import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, Upload } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const initialState = {
  name: "",
  type: "other",
  entity_type: "vehicle",
  entity_id: "",
  issue_date: "",
  expiry_date: "",
  file_url: "",
  document_number: "",
  notes: "",
};

const typeOptions = [
  { value: "vehicle_registration", label: "Registro de vehículo", entity: "vehicle" },
  { value: "insurance", label: "Seguro", entity: "vehicle" },
  { value: "technical_inspection", label: "ITV", entity: "vehicle" },
  { value: "circulation_permit", label: "Permiso de circulación", entity: "vehicle" },
  { value: "driver_license", label: "Licencia de conducir", entity: "driver" },
  { value: "medical_certificate", label: "Certificado médico", entity: "driver" },
  { value: "contract", label: "Contrato", entity: "both" },
  { value: "other", label: "Otro", entity: "both" },
];

export default function DocumentDialog({ 
  open, 
  onOpenChange, 
  document, 
  vehicles = [],
  drivers = [],
  onSave, 
  onDelete,
  isLoading,
  isDeleting 
}) {
  const [form, setForm] = useState(initialState);
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    base44.auth.me().then(user => {
      setCurrentUser(user);
      // Auto-asignar company_id si no es super admin
      if (user.company_id && !document) {
        setForm(prev => ({ ...prev, company_id: user.company_id }));
      }
    }).catch(() => {});

    // Cargar empresas y locaciones
    base44.entities.Company.list().then(setCompanies).catch(() => {});
    base44.entities.Location.list().then(setLocations).catch(() => {});
  }, []);

  useEffect(() => {
    if (document) {
      setForm({ ...initialState, ...document });
    } else {
      const initialForm = { ...initialState };
      if (currentUser?.company_id) {
        initialForm.company_id = currentUser.company_id;
      }
      setForm(initialForm);
    }
  }, [document, open, currentUser]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, file_url }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const filteredTypeOptions = typeOptions.filter(opt => 
    opt.entity === 'both' || opt.entity === form.entity_type
  );

  const isSuperAdmin = !currentUser?.company_id;

  // Filtrar vehículos y conductores según empresa seleccionada
  const filteredVehicles = form.company_id 
    ? vehicles.filter(v => v.company_id === form.company_id)
    : vehicles;
  
  const filteredDrivers = form.company_id 
    ? drivers.filter(d => d.company_id === form.company_id)
    : drivers;

  const filteredLocations = form.company_id
    ? locations.filter(l => l.company_id === form.company_id)
    : locations;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{document ? "Editar Documento" : "Nuevo Documento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSuperAdmin && (
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <Select 
                value={form.company_id} 
                onValueChange={(v) => {
                  handleChange("company_id", v);
                  handleChange("entity_id", "");
                }}
                required
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tipo de documento *</Label>
            <Select value={form.type} onValueChange={(v) => handleChange("type", v)} required>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pertenece a *</Label>
              <Select value={form.entity_type} onValueChange={(v) => {
                handleChange("entity_type", v);
                handleChange("entity_id", "");
              }} required>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicle">Vehículo</SelectItem>
                  <SelectItem value="driver">Conductor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{form.entity_type === 'vehicle' ? 'Vehículo' : 'Conductor'} *</Label>
              <Select 
                value={form.entity_id} 
                onValueChange={(v) => handleChange("entity_id", v)} 
                required
                disabled={!form.company_id && isSuperAdmin}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder={
                    (!form.company_id && isSuperAdmin) 
                      ? "Primero selecciona empresa" 
                      : "Seleccionar"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {form.entity_type === 'vehicle' 
                    ? filteredVehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.plate} - {v.manufacturer} {v.model}
                        </SelectItem>
                      ))
                    : filteredDrivers.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.full_name}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nombre del documento *</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="bg-slate-800 border-slate-700"
              placeholder="Ej: Seguro XYZ, Licencia ABC"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Número de documento</Label>
            <Input
              value={form.document_number}
              onChange={(e) => handleChange("document_number", e.target.value)}
              className="bg-slate-800 border-slate-700"
              placeholder="Número o referencia del documento"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de emisión</Label>
              <Input
                type="date"
                value={form.issue_date}
                onChange={(e) => handleChange("issue_date", e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de vencimiento</Label>
              <Input
                type="date"
                value={form.expiry_date}
                onChange={(e) => handleChange("expiry_date", e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Archivo adjunto</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                onChange={handleFileUpload}
                className="bg-slate-800 border-slate-700 file:bg-slate-700 file:text-slate-200 file:border-0"
                disabled={uploading}
              />
              {uploading && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
            </div>
            {form.file_url && (
              <a 
                href={form.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:underline"
              >
                Ver archivo actual
              </a>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="bg-slate-800 border-slate-700"
              placeholder="Notas adicionales..."
            />
          </div>

          <DialogFooter className="mt-6 gap-2">
            {document && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">¿Eliminar documento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || uploading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {document ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}