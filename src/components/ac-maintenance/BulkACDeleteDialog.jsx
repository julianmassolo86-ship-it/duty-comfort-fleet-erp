import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Trash2, AlertCircle, Search, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";

export default function BulkACDeleteDialog({ open, onOpenChange, onSuccess }) {
  const [selectedReports, setSelectedReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (open) {
      base44.auth.me().then(setUser).catch(() => {});
      setSelectedReports([]);
      setSearchTerm("");
      setError("");
    }
  }, [open]);

  const { data: acMaintenances = [], isLoading } = useQuery({
    queryKey: ['ac-maintenances-delete', user?.company_id],
    queryFn: async () => {
      const all = await base44.entities.AirConditioningMaintenance.list('-inspection_date');
      if (user?.company_id) {
        return all.filter(ac => ac.company_id === user.company_id);
      }
      return all;
    },
    enabled: !!user && open,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-delete', user?.company_id],
    queryFn: async () => {
      const allVehicles = await base44.entities.Vehicle.list();
      if (user?.company_id) {
        return allVehicles.filter(v => v.company_id === user.company_id);
      }
      return allVehicles;
    },
    enabled: !!user && open,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-delete'],
    queryFn: () => base44.entities.Company.list(),
    enabled: open,
  });

  const vehiclesMap = vehicles.reduce((acc, v) => ({ ...acc, [v.id]: v }), {});
  const companiesMap = companies.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

  const filteredReports = acMaintenances.filter(ac => {
    const vehicle = vehiclesMap[ac.vehicle_id];
    const company = companiesMap[ac.company_id];
    const searchLower = searchTerm.toLowerCase();
    
    return (
      vehicle?.internal_number?.toLowerCase().includes(searchLower) ||
      vehicle?.plate?.toLowerCase().includes(searchLower) ||
      ac.report_number?.toLowerCase().includes(searchLower) ||
      company?.name?.toLowerCase().includes(searchLower)
    );
  });

  const handleToggleReport = (reportId) => {
    setSelectedReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleToggleAll = () => {
    if (selectedReports.length === filteredReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(filteredReports.map(r => r.id));
    }
  };

  const handleDelete = async () => {
    if (selectedReports.length === 0) {
      setError("Debe seleccionar al menos un informe para eliminar");
      return;
    }

    const confirmDelete = window.confirm(
      `¿Está seguro de eliminar ${selectedReports.length} informe${selectedReports.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    setDeleting(true);
    setError("");

    try {
      // Eliminar informes seleccionados
      await Promise.all(
        selectedReports.map(id =>
          base44.entities.AirConditioningMaintenance.delete(id)
        )
      );

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "Error al eliminar los informes");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn("max-w-4xl max-h-[90vh]", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white')}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            <Trash2 className="w-5 h-5 text-red-500" />
            Eliminación Masiva de Informes A/C
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por patente, interno, número de informe o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn("pl-10", theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : '')}
            />
          </div>

          {/* Seleccionar todos */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg border",
            theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200'
          )}>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                onCheckedChange={handleToggleAll}
              />
              <span className={cn("text-sm font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                Seleccionar todos ({filteredReports.length} informes)
              </span>
            </div>
            {selectedReports.length > 0 && (
              <span className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
                {selectedReports.length} seleccionado{selectedReports.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Lista de informes */}
          <div className={cn(
            "border rounded-lg max-h-[400px] overflow-y-auto",
            theme === 'dark' ? 'bg-zinc-900/50 border-zinc-700' : 'bg-white border-gray-200'
          )}>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8">
                <Wind className={cn("w-12 h-12 mb-3", theme === 'dark' ? 'text-zinc-600' : 'text-gray-300')} />
                <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
                  {searchTerm ? 'No se encontraron informes' : 'No hay informes disponibles'}
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: theme === 'dark' ? 'rgb(63, 63, 70)' : 'rgb(229, 231, 235)' }}>
                {filteredReports.map((report) => {
                  const vehicle = vehiclesMap[report.vehicle_id];
                  const company = companiesMap[report.company_id];
                  const isSelected = selectedReports.includes(report.id);

                  return (
                    <div
                      key={report.id}
                      onClick={() => handleToggleReport(report.id)}
                      className={cn(
                        "flex items-center gap-3 p-4 cursor-pointer transition-colors",
                        isSelected 
                          ? theme === 'dark' ? 'bg-red-500/10' : 'bg-red-50'
                          : theme === 'dark' ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleReport(report.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={cn("font-medium text-sm", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                            {vehicle?.internal_number || 'N/A'} - {vehicle?.plate || 'Sin patente'}
                          </p>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            report.status === 'completado'
                              ? theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                              : report.status === 'aprobado'
                              ? theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-500/10 text-green-600'
                              : theme === 'dark' ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-500/10 text-orange-600'
                          )}>
                            {report.status === 'completado' ? 'Completado' : report.status === 'aprobado' ? 'Aprobado' : 'En Proceso'}
                          </span>
                        </div>
                        <div className={cn("text-xs space-y-0.5", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                          <p>📋 {report.report_number || 'Sin número'}</p>
                          <p>📅 {report.inspection_date.split('T')[0].split('-').reverse().join('/')}</p>
                          {company && <p>🏢 {company.name}</p>}
                          <p className="capitalize">{report.tipo_mantenimiento || 'preventivo'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-between gap-3 pt-4 border-t" style={{ borderColor: theme === 'dark' ? 'rgb(63, 63, 70)' : 'rgb(229, 231, 235)' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={deleting}
              className={theme === 'dark' ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : ''}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleDelete}
              disabled={deleting || selectedReports.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar {selectedReports.length > 0 ? `(${selectedReports.length})` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}