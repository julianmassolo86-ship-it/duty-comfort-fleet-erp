import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, ExternalLink, Wrench, Wind } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusColors = {
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  en_proceso: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  completado: "bg-green-500/20 text-green-400 border-green-500/30",
  aprobado: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels = {
  scheduled: "Programado",
  in_progress: "En Proceso",
  en_proceso: "En Proceso",
  completed: "Completado",
  completado: "Completado",
  aprobado: "Aprobado",
  cancelled: "Cancelado",
};

const typeLabels = {
  preventive: "Preventivo",
  preventivo: "Preventivo",
  corrective: "Correctivo",
  correctivo: "Correctivo",
  inspection: "Inspección",
  inspeccion: "Inspección",
};

export default function VehicleMaintenanceHistory({ vehicleId }) {
  // Fetch maintenance records
  const { data: maintenanceRecords = [], isLoading: loadingMaintenance } = useQuery({
    queryKey: ['maintenance', vehicleId],
    queryFn: () => base44.entities.Maintenance.filter({ vehicle_id: vehicleId }),
    enabled: !!vehicleId,
  });

  // Fetch AC maintenance reports
  const { data: acReports = [], isLoading: loadingAC } = useQuery({
    queryKey: ['acMaintenance', vehicleId],
    queryFn: () => base44.entities.AirConditioningMaintenance.filter({ vehicle_id: vehicleId }),
    enabled: !!vehicleId,
  });

  const isLoading = loadingMaintenance || loadingAC;

  // Combine and sort all records by date
  const allRecords = React.useMemo(() => {
    const combined = [
      ...maintenanceRecords.map(record => ({
        ...record,
        recordType: 'maintenance',
        date: record.scheduled_date || record.completed_date,
        interventionType: record.type,
      })),
      ...acReports.map(report => ({
        ...report,
        recordType: 'ac_report',
        date: report.inspection_date,
        interventionType: report.tipo_mantenimiento,
      })),
    ];

    return combined
      .filter(record => record.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [maintenanceRecords, acReports]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (allRecords.length === 0) {
    return (
      <div className="p-8 text-center">
        <Wrench className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-500">No hay historial de mantenimiento para este vehículo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Intervención</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Temp. Ambiente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {allRecords.map((record, index) => (
                <tr key={`${record.recordType}-${record.id}-${index}`} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-white whitespace-nowrap">
                    {format(new Date(record.date), "dd/MM/yyyy", { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {record.recordType === 'maintenance' ? (
                        <>
                          <Wrench className="w-4 h-4 text-blue-400" />
                          <span className="text-blue-400">Mantenimiento</span>
                        </>
                      ) : (
                        <>
                          <Wind className="w-4 h-4 text-cyan-400" />
                          <span className="text-cyan-400">Informe A/C</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                      {typeLabels[record.interventionType] || record.interventionType || "N/A"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge 
                      variant="outline" 
                      className={statusColors[record.status] || "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"}
                    >
                      {statusLabels[record.status] || record.status || "N/A"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {record.recordType === 'ac_report' && record.ambient_temperature 
                      ? `${record.ambient_temperature}°C` 
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400 max-w-xs truncate">
                    {record.description || record.observaciones_finales || "Sin descripción"}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                      onClick={() => {
                        // Navigate to the maintenance or AC report page
                        if (record.recordType === 'maintenance') {
                          window.open(`#/maintenance/${record.id}`, '_blank');
                        } else {
                          window.open(`#/ac-maintenance/${record.id}`, '_blank');
                        }
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <p className="text-xs text-zinc-500 text-center">
        Total de registros: {allRecords.length}
      </p>
    </div>
  );
}