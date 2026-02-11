import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";
import DocumentDialog from "../components/documents/DocumentDialog";
import { useTheme } from "../components/common/ThemeWrapper";

const typeLabels = {
  vehicle_registration: "Registro de vehículo",
  insurance: "Seguro",
  technical_inspection: "ITV",
  circulation_permit: "Permiso de circulación",
  driver_license: "Licencia de conducir",
  medical_certificate: "Certificado médico",
  contract: "Contrato",
  other: "Otro",
};

export default function Documents() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const { theme } = useTheme();

  const queryClient = useQueryClient();

  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-expiry_date'),
  });

  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const { data: drivers = [], isLoading: loadingDrivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list(),
  });

  const isLoading = loadingDocs || loadingVehicles || loadingDrivers;

  const vehiclesMap = vehicles.reduce((acc, v) => ({ ...acc, [v.id]: v }), {});
  const driversMap = drivers.reduce((acc, d) => ({ ...acc, [d.id]: d }), {});

  // Generar documentos virtuales desde vehículos y conductores
  const getVirtualDocuments = () => {
    const virtualDocs = [];

    // Documentos de vehículos
    const vehicleDocFields = [
      { key: 'insurance_expiry', url: 'insurance_url', type: 'insurance', label: 'Seguro' },
      { key: 'technical_inspection_expiry', url: 'technical_inspection_url', type: 'technical_inspection', label: 'VTV' },
      { key: 'circulation_permit_expiry', url: 'circulation_permit_url', type: 'circulation_permit', label: 'Permiso de circulación' },
      { key: 'vehicle_card_front_expiry', url: 'vehicle_card_front_url', type: 'vehicle_registration', label: 'Cédula del vehículo (A)' },
      { key: 'title_expiry', url: 'title_url', type: 'other', label: 'Título automotor' },
      { key: 'license_plate_expiry', url: 'license_plate_url', type: 'other', label: 'Patente' },
      { key: 'parts_engraving_expiry', url: 'parts_engraving_url', type: 'other', label: 'Grabado de autopartes' },
      { key: 'fire_extinguisher_expiry', url: 'fire_extinguisher_url', type: 'other', label: 'Extintor' }
    ];

    vehicles.forEach(v => {
      vehicleDocFields.forEach(({ key, url, type, label }) => {
        if (v[key] || v[url]) {
          virtualDocs.push({
            id: `virtual-v-${v.id}-${key}`,
            name: `${label} - ${v.plate}`,
            type,
            entity_type: 'vehicle',
            entity_id: v.id,
            expiry_date: v[key] || null,
            file_url: v[url] || null,
            company_id: v.company_id,
            status: v[key] ? (differenceInDays(new Date(v[key]), new Date()) <= 0 ? 'expired' : differenceInDays(new Date(v[key]), new Date()) <= 30 ? 'expiring_soon' : 'valid') : 'valid',
            isVirtual: true
          });
        }
      });
    });

    // Documentos de conductores
    drivers.forEach(d => {
      if (d.license_expiry || d.license_front_url || d.license_back_url) {
        virtualDocs.push({
          id: `virtual-d-${d.id}-license`,
          name: `Licencia de conducir - ${d.full_name}`,
          type: 'driver_license',
          entity_type: 'driver',
          entity_id: d.id,
          expiry_date: d.license_expiry || null,
          file_url: d.license_front_url || d.license_back_url || null,
          document_number: d.license_number || null,
          company_id: d.company_id,
          status: d.license_expiry ? (differenceInDays(new Date(d.license_expiry), new Date()) <= 0 ? 'expired' : differenceInDays(new Date(d.license_expiry), new Date()) <= 30 ? 'expiring_soon' : 'valid') : 'valid',
          isVirtual: true
        });
      }
    });

    return virtualDocs;
  };

  const virtualDocuments = getVirtualDocuments();
  const allDocuments = [...documents, ...virtualDocuments];

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Document.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDialogOpen(false);
      setSelectedDocument(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDialogOpen(false);
      setSelectedDocument(null);
    },
  });

  const handleSave = (data) => {
    if (selectedDocument) {
      updateMutation.mutate({ id: selectedDocument.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (document) => {
    setSelectedDocument(document);
    setDialogOpen(true);
  };

  const getDocumentStatus = (expiryDate) => {
    if (!expiryDate) return 'valid';
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days <= 0) return 'expired';
    if (days <= 30) return 'expiring_soon';
    return 'valid';
  };

  const getEntityName = (doc) => {
    if (doc.entity_type === 'vehicle') {
      const vehicle = vehiclesMap[doc.entity_id];
      return vehicle ? `${vehicle.plate} - ${vehicle.brand} ${vehicle.model}` : 'Vehículo no encontrado';
    } else {
      const driver = driversMap[doc.entity_id];
      return driver ? driver.full_name : 'Conductor no encontrado';
    }
  };

  const filteredDocuments = allDocuments.filter(d => {
    const matchesSearch = 
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.document_number?.toLowerCase().includes(search.toLowerCase()) ||
      getEntityName(d).toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || d.type === typeFilter;
    const matchesEntity = entityFilter === "all" || d.entity_type === entityFilter;
    return matchesSearch && matchesType && matchesEntity;
  }).sort((a, b) => {
    // Ordenar por fecha de vencimiento, los más próximos primero
    if (!a.expiry_date && !b.expiry_date) return 0;
    if (!a.expiry_date) return 1;
    if (!b.expiry_date) return -1;
    return new Date(a.expiry_date) - new Date(b.expiry_date);
  });

  return (
    <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Documentos" 
          description="Gestiona la documentación de tu flota y conductores"
          actions={
            <Button 
              onClick={() => { setSelectedDocument(null); setDialogOpen(true); }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Documento
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar documentos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-yellow-500/50"
            />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-zinc-900/50 border-zinc-800 text-white">
              <SelectValue placeholder="Entidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="vehicle">Vehículos</SelectItem>
              <SelectItem value="driver">Conductores</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-zinc-900/50 border-zinc-800 text-white">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(typeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Documents Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl bg-zinc-900/50" />
            ))}
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="rounded-2xl border border-zinc-800/50 overflow-hidden bg-zinc-900/50 backdrop-blur-xl shadow-2xl shadow-black/20">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800/50 border-slate-700">
                  <TableHead className="text-slate-400">Documento</TableHead>
                  <TableHead className="text-slate-400">Tipo</TableHead>
                  <TableHead className="text-slate-400">Entidad</TableHead>
                  <TableHead className="text-slate-400">Vencimiento</TableHead>
                  <TableHead className="text-slate-400">Estado</TableHead>
                  <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map(doc => (
                  <TableRow 
                    key={doc.id} 
                    className="border-slate-700/50 hover:bg-slate-800/30 cursor-pointer"
                    onClick={() => !doc.isVirtual && handleEdit(doc)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-700/50">
                          <FileText className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{doc.name}</p>
                          {doc.document_number && (
                            <p className="text-sm text-slate-500">{doc.document_number}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {typeLabels[doc.type] || doc.type}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          doc.entity_type === 'vehicle' 
                            ? 'bg-blue-500/10 text-blue-400' 
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {doc.entity_type === 'vehicle' ? 'Vehículo' : 'Conductor'}
                        </span>
                        <span className="text-slate-300 truncate max-w-[200px]">{getEntityName(doc)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {doc.expiry_date 
                        ? format(new Date(doc.expiry_date), "d MMM yyyy", { locale: es })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={getDocumentStatus(doc.expiry_date)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.file_url && (
                          <a 
                            href={doc.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        {doc.isVirtual && (
                          <span className="text-xs text-slate-500 italic">Auto-generado</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="Sin documentos"
            description={search ? "No se encontraron documentos con esos criterios" : "Agrega tu primer documento"}
            action={
              !search && (
                <Button 
                  onClick={() => { setSelectedDocument(null); setDialogOpen(true); }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Documento
                </Button>
              )
            }
          />
        )}

        <DocumentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          document={selectedDocument}
          vehicles={vehicles}
          drivers={drivers}
          onSave={handleSave}
          onDelete={selectedDocument ? () => deleteMutation.mutate(selectedDocument.id) : undefined}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}