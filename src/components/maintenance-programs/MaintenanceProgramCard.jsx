import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Gauge, Clock, Edit, Package, Factory, Wrench, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const intervalTypeLabels = {
  mileage: { label: "km", icon: Gauge },
  miles: { label: "mi", icon: Gauge },
  hours: { label: "hs", icon: Clock },
  months: { label: "meses", icon: Calendar },
  years: { label: "años", icon: Calendar },
  days: { label: "días", icon: Calendar },
};

const TYPE_CONFIG = {
  item: {
    label: "Ítem",
    icon: Wrench,
    badgeClass: "border-blue-500/40 text-blue-400 bg-blue-500/10",
    borderClass: "hover:border-blue-500/30",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    iconColor: "text-blue-400",
  },
  action: {
    label: "Acción",
    icon: Zap,
    badgeClass: "border-green-500/40 text-green-400 bg-green-500/10",
    borderClass: "hover:border-green-500/30",
    iconBg: "bg-green-500/10 border-green-500/20",
    iconColor: "text-green-400",
  },
  program: {
    label: "Programa",
    icon: Package,
    badgeClass: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10",
    borderClass: "hover:border-yellow-500/30",
    iconBg: "bg-yellow-500/10 border-yellow-500/20",
    iconColor: "text-yellow-400",
  },
};

export default function MaintenanceProgramCard({ program, manufacturers, vehicleTypes, allPrograms, onEdit }) {
  const taskType = program.task_type || (program.is_program_group ? "program" : "item");
  const config = TYPE_CONFIG[taskType] || TYPE_CONFIG.item;
  const TypeIcon = config.icon;

  const IntervalIcon = intervalTypeLabels[program.interval_type]?.icon || Gauge;
  const intervalLabel = intervalTypeLabels[program.interval_type]?.label || program.interval_type;

  const manufacturer = manufacturers.find(m => m.id === program.applies_to_manufacturer_id);
  const vehicleType = vehicleTypes.find(vt => vt.id === program.applies_to_vehicle_type_id);

  const linkedTasks = (program.linked_task_ids || [])
    .map(id => allPrograms.find(p => p.id === id))
    .filter(Boolean);

  // Separar ítems de acciones en el programa
  const linkedItems = linkedTasks.filter(t => !t.task_type || t.task_type === "item");
  const linkedActions = linkedTasks.filter(t => t.task_type === "action");

  return (
    <Card className={cn("bg-zinc-900 border-zinc-800 transition-all cursor-pointer group", config.borderClass)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn("p-2 rounded-lg border shrink-0 mt-0.5", config.iconBg)}>
              <TypeIcon className={cn("w-4 h-4", config.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className={cn("text-xs shrink-0", config.badgeClass)}>
                  {config.label}
                </Badge>
                {program.is_active === false && (
                  <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs">Inactivo</Badge>
                )}
              </div>
              <CardTitle className="text-white text-base leading-tight">{program.name}</CardTitle>
              {program.description && (
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{program.description}</p>
              )}
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(program)}
            className="text-zinc-500 hover:text-yellow-400 hover:bg-yellow-500/10 shrink-0 w-8 h-8"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Intervalo */}
        {(program.interval_value || program.interval_mileage || program.interval_hours) && (
          <div className="flex flex-wrap gap-2">
            {program.interval_value && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800/50 text-xs">
                <IntervalIcon className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-white font-medium">c/ {program.interval_value.toLocaleString()} {intervalLabel}</span>
              </div>
            )}
            {program.interval_mileage && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800/50 text-xs">
                <Gauge className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-white font-medium">c/ {program.interval_mileage.toLocaleString()} km</span>
              </div>
            )}
            {program.interval_hours && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800/50 text-xs">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-white font-medium">c/ {program.interval_hours.toLocaleString()} hs</span>
              </div>
            )}
          </div>
        )}

        {/* Aviso previo */}
        {program.warning_interval_value && (
          <div className="flex items-center gap-1.5 text-xs text-cyan-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>Aviso: {program.warning_interval_value} {intervalTypeLabels[program.warning_interval_type]?.label} antes</span>
          </div>
        )}

        {/* Aplicable a */}
        {(manufacturer || vehicleType) && (
          <div className="flex flex-wrap gap-1.5">
            {manufacturer && (
              <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                <Factory className="w-2.5 h-2.5 mr-1" />{manufacturer.name}
              </Badge>
            )}
            {vehicleType && (
              <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                {vehicleType.name}
              </Badge>
            )}
          </div>
        )}

        {/* Contenido del programa */}
        {taskType === "program" && linkedTasks.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-zinc-800">
            {linkedItems.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> {linkedItems.length} ítem(s)
                </p>
                <div className="flex flex-wrap gap-1">
                  {linkedItems.slice(0, 3).map(t => (
                    <span key={t.id} className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{t.name}</span>
                  ))}
                  {linkedItems.length > 3 && <span className="text-xs text-zinc-500">+{linkedItems.length - 3}</span>}
                </div>
              </div>
            )}
            {linkedActions.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {linkedActions.length} acción(es)
                </p>
                <div className="flex flex-wrap gap-1">
                  {linkedActions.slice(0, 3).map(t => (
                    <span key={t.id} className="text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">{t.name}</span>
                  ))}
                  {linkedActions.length > 3 && <span className="text-xs text-zinc-500">+{linkedActions.length - 3}</span>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Especificaciones del ítem */}
        {taskType !== "program" && program.component_names && program.component_names.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-zinc-800">
            {program.component_names.slice(0, 3).map((c, idx) => (
              <Badge key={idx} variant="outline" className="border-zinc-700 text-zinc-400 text-xs">{c}</Badge>
            ))}
            {program.component_names.length > 3 && (
              <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-xs">+{program.component_names.length - 3}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}