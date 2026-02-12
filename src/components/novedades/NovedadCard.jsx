import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, Wrench, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/common/ThemeWrapper";

const estadoConfig = {
  pendiente: {
    icon: Clock,
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
  },
  en_proceso: {
    icon: Wrench,
    label: "En Proceso",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
  },
  resuelto: {
    icon: CheckCircle2,
    label: "Resuelto",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
  },
  cerrado: {
    icon: XCircle,
    label: "Cerrado",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
  }
};

const prioridadConfig = {
  baja: { label: "Baja", color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400" },
  media: { label: "Media", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  alta: { label: "Alta", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  critica: { label: "Crítica", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" }
};

export default function NovedadCard({ novedad, vehicle, onUpdateEstado, onClick }) {
  const { theme } = useTheme();
  const [updating, setUpdating] = useState(false);
  const estadoInfo = estadoConfig[novedad.estado] || estadoConfig.pendiente;
  const prioridadInfo = prioridadConfig[novedad.prioridad] || prioridadConfig.media;
  const IconoEstado = estadoInfo.icon;

  const handleChangeEstado = async (nuevoEstado) => {
    setUpdating(true);
    await onUpdateEstado(novedad, nuevoEstado);
    setUpdating(false);
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg",
        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-gray-200 hover:border-gray-300'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn(
              "p-2 rounded-lg",
              theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'
            )}>
              <IconoEstado className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className={cn("font-semibold truncate", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  {vehicle?.internal_number} - {vehicle?.plate}
                </h3>
                <Badge className={prioridadInfo.color}>
                  {prioridadInfo.label}
                </Badge>
              </div>
              <p className={cn("text-sm truncate", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                {vehicle?.manufacturer} {vehicle?.model}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="outline" 
                size="sm"
                disabled={updating}
                className={theme === 'dark' ? 'border-zinc-700' : ''}
              >
                <Badge className={estadoInfo.color}>
                  {estadoInfo.label}
                </Badge>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : ''}>
              {Object.entries(estadoConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <DropdownMenuItem 
                    key={key}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChangeEstado(key);
                    }}
                    disabled={novedad.estado === key}
                    className={theme === 'dark' ? 'focus:bg-zinc-800' : ''}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {config.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className={cn("text-sm mb-3", theme === 'dark' ? 'text-zinc-300' : 'text-gray-700')}>
          {novedad.descripcion}
        </p>
        
        <div className="flex items-center gap-4 text-xs">
          <span className={theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}>
            {format(new Date(novedad.fecha_reporte), "dd MMM yyyy", { locale: es })}
          </span>
          {novedad.kilometraje_reportado && (
            <span className={theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}>
              📏 {novedad.kilometraje_reportado.toLocaleString()} km
            </span>
          )}
          {novedad.horas_reportadas && (
            <span className={theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}>
              ⏱️ {novedad.horas_reportadas.toLocaleString()} hs
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}