import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";
import { Calendar, FileText, AlertTriangle, CheckCircle, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import AirConditioningMaintenanceDialog from "./AirConditioningMaintenanceDialog";

export default function ACMaintenanceHistory({ vehicleId }) {
  const { theme } = useTheme();
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: ['ac-maintenance-history', vehicleId],
    queryFn: async () => {
      const allReports = await base44.entities.AirConditioningMaintenance.filter({ 
        vehicle_id: vehicleId 
      });
      return allReports.sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date));
    },
    enabled: !!vehicleId,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000
  });

  const handleViewReport = async (report) => {
    setSelectedReport(report);
    setShowDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completado':
        return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'aprobado':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      default:
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
    }
  };

  const displayedReports = expanded ? reports : reports.slice(0, 3);

  if (isLoading) {
    return (
      <Card className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : ''}>
        <CardHeader>
          <CardTitle className={cn("text-sm flex items-center gap-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            <FileText className="w-4 h-4" />
            Historial de Inspecciones A/C
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
              <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                Cargando historial de inspecciones...
              </p>
            </div>
            {/* Skeleton loaders */}
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn("p-3 rounded-lg border animate-pulse", theme === 'dark' ? 'bg-zinc-800/30 border-zinc-700' : 'bg-gray-100 border-gray-200')}>
                <div className={cn("h-4 rounded w-1/3 mb-2", theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-300')}></div>
                <div className={cn("h-3 rounded w-2/3", theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-300')}></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : ''}>
        <CardHeader>
          <CardTitle className={cn("text-sm flex items-center gap-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            <FileText className="w-4 h-4" />
            Historial de Inspecciones A/C
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-sm">Error al cargar el historial</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : ''}>
        <CardHeader>
          <CardTitle className={cn("text-sm flex items-center gap-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            <FileText className="w-4 h-4" />
            Historial de Inspecciones A/C
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
            No hay inspecciones registradas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : ''}>
        <CardHeader>
          <CardTitle className={cn("text-sm flex items-center gap-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            <FileText className="w-4 h-4" />
            Historial de Inspecciones A/C ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {displayedReports.map((report) => (
            <div
              key={report.id}
              className={cn(
                "p-3 rounded-lg border transition-colors",
                theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-xs font-mono font-semibold", theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600')}>
                      {report.report_number}
                    </span>
                    <Badge className={cn("text-xs", getStatusColor(report.status))}>
                      {report.status === 'en_proceso' ? 'En Proceso' : report.status === 'completado' ? 'Completado' : 'Aprobado'}
                    </Badge>
                    {report.requiere_seguimiento && (
                      <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-xs">
                        Requiere Seguimiento
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-3 h-3" />
                    <span className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>
                      {format(new Date(report.inspection_date), 'dd/MM/yyyy')}
                    </span>
                    <span className={theme === 'dark' ? 'text-zinc-600' : 'text-gray-400'}>•</span>
                    <span className={cn("capitalize", theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
                      {report.tipo_mantenimiento}
                    </span>
                  </div>

                  {report.observaciones_finales && (
                    <p className={cn("text-xs mt-1 line-clamp-2", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
                      {report.observaciones_finales}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewReport(report)}
                  className={cn("flex-shrink-0", theme === 'dark' ? 'text-zinc-400 hover:text-white' : '')}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {reports.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className={cn("w-full", theme === 'dark' ? 'text-zinc-400 hover:text-white' : '')}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Ver todos ({reports.length})
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {showDialog && selectedReport && (
        <AirConditioningMaintenanceDialog
          open={showDialog}
          onOpenChange={(isOpen) => {
            setShowDialog(isOpen);
            if (!isOpen) {
              setSelectedReport(null);
            }
          }}
          maintenance={selectedReport}
          onSuccess={() => {}}
        />
      )}
    </>
  );
}