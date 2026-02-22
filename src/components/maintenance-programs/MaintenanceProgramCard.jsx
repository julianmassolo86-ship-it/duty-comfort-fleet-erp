import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Gauge, Clock, Edit, Package, Factory } from "lucide-react";

const intervalTypeLabels = {
  mileage: { label: "Kilómetros", icon: Gauge },
  miles: { label: "Millas", icon: Gauge },
  hours: { label: "Horas", icon: Clock },
  months: { label: "Meses", icon: Calendar },
  years: { label: "Años", icon: Calendar },
  days: { label: "Días", icon: Calendar },
};

export default function MaintenanceProgramCard({ program, manufacturers, vehicleTypes, allPrograms, onEdit }) {
  const IntervalIcon = intervalTypeLabels[program.interval_type]?.icon || Gauge;
  const intervalLabel = intervalTypeLabels[program.interval_type]?.label || program.interval_type;

  const manufacturer = manufacturers.find(m => m.id === program.applies_to_manufacturer_id);
  const vehicleType = vehicleTypes.find(vt => vt.id === program.applies_to_vehicle_type_id);

  const linkedTasks = program.linked_task_ids?.map(id => 
    allPrograms.find(p => p.id === id)
  ).filter(Boolean) || [];

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-yellow-500/30 transition-all cursor-pointer group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-white text-lg mb-2 flex items-center gap-2">
              {program.is_program_group && <Package className="w-5 h-5 text-yellow-400" />}
              {program.name}
            </CardTitle>
            {program.description && (
              <p className="text-sm text-zinc-400 line-clamp-2">{program.description}</p>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(program)}
            className="text-zinc-400 hover:text-yellow-400 hover:bg-yellow-500/10"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Intervalo */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
          <IntervalIcon className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="text-xs text-zinc-500">Intervalo</p>
            <p className="text-sm font-semibold text-white">
              Cada {program.interval_value} {intervalLabel}
            </p>
          </div>
        </div>

        {/* Aviso Previo */}
        {program.warning_interval_value && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-xs text-zinc-500">Aviso Previo</p>
              <p className="text-sm font-semibold text-white">
                {program.warning_interval_value} {intervalTypeLabels[program.warning_interval_type]?.label || program.warning_interval_type} antes
              </p>
            </div>
          </div>
        )}

        {/* Aplicable a */}
        {(manufacturer || vehicleType) && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Aplicable a:</p>
            <div className="flex flex-wrap gap-2">
              {manufacturer && (
                <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                  <Factory className="w-3 h-3 mr-1" />
                  {manufacturer.name}
                </Badge>
              )}
              {vehicleType && (
                <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                  {vehicleType.name}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Tareas incluidas (si es programa grupal) */}
        {program.is_program_group && linkedTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Incluye {linkedTasks.length} tareas:</p>
            <div className="space-y-1">
              {linkedTasks.slice(0, 3).map(task => (
                <p key={task.id} className="text-xs text-zinc-400 truncate">• {task.name}</p>
              ))}
              {linkedTasks.length > 3 && (
                <p className="text-xs text-zinc-500">+ {linkedTasks.length - 3} más</p>
              )}
            </div>
          </div>
        )}

        {/* Componentes */}
        {program.component_names && program.component_names.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Componentes:</p>
            <div className="flex flex-wrap gap-1">
              {program.component_names.slice(0, 3).map((component, idx) => (
                <Badge key={idx} variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                  {component}
                </Badge>
              ))}
              {program.component_names.length > 3 && (
                <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-xs">
                  +{program.component_names.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Estado */}
        {program.is_active === false && (
          <Badge variant="outline" className="border-red-500/30 text-red-400">
            Inactivo
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}