import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, Plus, X, Wrench, Zap, Package, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const TASK_TYPES = [
  {
    key: "item",
    label: "Ítem",
    sublabel: "Componente / Insumo",
    description: "Un repuesto o insumo físico (Filtro de aceite, Aceite motor, Filtro de cabina...)",
    icon: Wrench,
    activeColor: "border-blue-500 bg-blue-500/20 text-blue-300",
  },
  {
    key: "action",
    label: "Acción",
    sublabel: "Procedimiento",
    description: "Una tarea de mantenimiento (Engrase de chasis, Purga de tanques, Regulación de frenos...)",
    icon: Zap,
    activeColor: "border-green-500 bg-green-500/20 text-green-300",
  },
  {
    key: "program",
    label: "Programa",
    sublabel: "Agrupador con intervalo",
    description: "Agrupa ítems y acciones y define los intervalos y avisos del conjunto (Servicio A, PM2, Inspección S...)",
    icon: Package,
    activeColor: "border-yellow-500 bg-yellow-500/20 text-yellow-300",
  },
];

const initialState = {
  name: "",
  description: "",
  task_type: "item",
  part_number: "",
  alternative_part_number: "",
  component_names: [],
  // Solo para programas:
  interval_mileage: "",
  interval_hours: "",
  interval_months: "",
  warning_mileage: "",
  warning_hours: "",
  warning_days: "",
  linked_task_ids: [],
  applies_to_vehicle_type_id: "",
  applies_to_manufacturer_id: "",
  company_id: "",
  is_active: true,
};

export default function MaintenanceProgramDialog({
  open, onOpenChange, program, manufacturers, vehicleTypes, allPrograms,
  isSuperAdmin, currentUser, defaultType = "item",
  onSave, onDelete, isLoading, isDeleting,
}) {
  const [form, setForm] = useState(initialState);
  const [componentInput, setComponentInput] = useState("");

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    enabled: isSuperAdmin,
  });

  useEffect(() => {
    if (open) {
      if (program) {
        const taskType = program.task_type || (program.is_program_group ? "program" : "item");
        setForm({
          ...initialState,
          ...program,
          task_type: taskType,
          part_number: program.part_number || "",
          alternative_part_number: program.alternative_part_number || "",
          interval_mileage: program.interval_mileage || "",
          interval_hours: program.interval_hours || "",
          interval_months: program.interval_months || "",
          warning_mileage: program.warning_mileage || "",
          warning_hours: program.warning_hours || "",
          warning_days: program.warning_days || "",
          component_names: program.component_names || [],
          linked_task_ids: program.linked_task_ids || [],
        });
      } else {
        setForm({
          ...initialState,
          task_type: defaultType,
          company_id: isSuperAdmin ? "" : currentUser?.company_id || "",
        });
      }
      setComponentInput("");
    }
  }, [program, open, isSuperAdmin, currentUser, defaultType]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const isProgram = form.task_type === "program";
    onSave({
      ...form,
      is_program_group: isProgram,
      // Convertir a número o null
      interval_mileage: form.interval_mileage ? Number(form.interval_mileage) : null,
      interval_hours: form.interval_hours ? Number(form.interval_hours) : null,
      interval_months: form.interval_months ? Number(form.interval_months) : null,
      warning_mileage: form.warning_mileage ? Number(form.warning_mileage) : null,
      warning_hours: form.warning_hours ? Number(form.warning_hours) : null,
      warning_days: form.warning_days ? Number(form.warning_days) : null,
      // Limpiar campos que no aplican
      part_number: !isProgram ? form.part_number : null,
      alternative_part_number: !isProgram ? form.alternative_part_number : null,
      linked_task_ids: isProgram ? form.linked_task_ids : [],
    });
  };

  const addComponent = () => {
    if (componentInput.trim()) {
      set("component_names", [...form.component_names, componentInput.trim()]);
      setComponentInput("");
    }
  };

  const removeComponent = (index) => {
    set("component_names", form.component_names.filter((_, i) => i !== index));
  };

  const toggleLinkedTask = (taskId) => {
    set("linked_task_ids",
      form.linked_task_ids.includes(taskId)
        ? form.linked_task_ids.filter(id => id !== taskId)
        : [...form.linked_task_ids, taskId]
    );
  };

  const availableItemsAndActions = allPrograms.filter(p =>
    p.id !== program?.id &&
    (p.task_type === "item" || p.task_type === "action" || (!p.task_type && !p.is_program_group))
  );

  const typeInfo = TASK_TYPES.find(t => t.key === form.task_type);
  const isProgram = form.task_type === "program";

  const dialogTitle = program
    ? `Editar: ${program.name}`
    : isProgram ? "Nuevo Programa de Servicio"
    : form.task_type === "action" ? "Nueva Acción"
    : "Nuevo Ítem / Componente";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {typeInfo && <typeInfo.icon className="w-5 h-5" />}
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <div className="grid grid-cols-3 gap-2">
              {TASK_TYPES.map(type => (
                <button key={type.key} type="button"
                  onClick={() => set("task_type", type.key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center",
                    form.task_type === type.key
                      ? type.activeColor
                      : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  <type.icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{type.label}</span>
                  <span className="text-[10px] opacity-70 leading-tight">{type.sublabel}</span>
                </button>
              ))}
            </div>
            {typeInfo && <p className="text-xs text-zinc-500">{typeInfo.description}</p>}
          </div>

          {/* Empresa (solo super admin) */}
          {isSuperAdmin && (
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <Select value={form.company_id} onValueChange={(v) => set("company_id", v)} required>
                <SelectTrigger className="bg-zinc-900 border-zinc-700">
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Nombre */}
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
              placeholder={
                isProgram ? "Ej: Inspección S, PM2, Servicio Scania A"
                : form.task_type === "action" ? "Ej: Engrase de chasis, Purga de tanques de aire"
                : "Ej: Filtro de aceite motor, Aceite SAE 15W40"
              }
              required
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
              placeholder="Descripción detallada..."
              rows={2}
            />
          </div>

          {/* === CAMPOS SOLO PARA ÍTEMS === */}
          {form.task_type === "item" && (
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
              <Label className="text-blue-400 flex items-center gap-2">
                <Hash className="w-4 h-4" /> Identificación del Componente
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Número de Pieza (OEM)</Label>
                  <Input
                    value={form.part_number}
                    onChange={(e) => set("part_number", e.target.value)}
                    className="bg-zinc-900 border-zinc-700 focus:border-blue-500/50"
                    placeholder="Ej: 7420543688"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">N° de Pieza Alternativo</Label>
                  <Input
                    value={form.alternative_part_number}
                    onChange={(e) => set("alternative_part_number", e.target.value)}
                    className="bg-zinc-900 border-zinc-700 focus:border-blue-500/50"
                    placeholder="Ej: SH8019L, LF16015"
                  />
                </div>
              </div>
            </div>
          )}

          {/* === CAMPOS SOLO PARA PROGRAMAS === */}
          {isProgram && (
            <>
              {/* Selector de ítems y acciones */}
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-yellow-500/20 space-y-2">
                <Label className="text-yellow-400">Ítems y Acciones del Programa</Label>
                <p className="text-xs text-zinc-500">Seleccioná qué ítems y acciones se realizan durante este programa.</p>
                {availableItemsAndActions.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic">No hay ítems ni acciones disponibles. Créalos primero.</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {availableItemsAndActions.map(task => {
                      const ttype = task.task_type || "item";
                      return (
                        <label key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.linked_task_ids.includes(task.id)}
                            onChange={() => toggleLinkedTask(task.id)}
                            className="w-4 h-4 accent-yellow-500 shrink-0"
                          />
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border shrink-0",
                            ttype === "action" ? "border-green-500/40 text-green-400" : "border-blue-500/40 text-blue-400"
                          )}>
                            {ttype === "action" ? "Acción" : "Ítem"}
                          </span>
                          <span className="text-sm text-white">{task.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {form.linked_task_ids.length > 0 && (
                  <p className="text-xs text-yellow-500 font-medium">{form.linked_task_ids.length} elemento(s) seleccionado(s)</p>
                )}
              </div>

              {/* Intervalos del programa */}
              <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 space-y-4">
                <Label className="text-yellow-400">Intervalos de Ejecución</Label>
                <p className="text-xs text-zinc-500">Se ejecutará cuando se alcance el primero de estos límites.</p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-400">Cada (km)</Label>
                    <Input
                      type="number"
                      value={form.interval_mileage}
                      onChange={(e) => set("interval_mileage", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                      placeholder="Ej: 10000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-400">Cada (horas)</Label>
                    <Input
                      type="number"
                      value={form.interval_hours}
                      onChange={(e) => set("interval_hours", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                      placeholder="Ej: 500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-400">Cada (meses)</Label>
                    <Input
                      type="number"
                      value={form.interval_months}
                      onChange={(e) => set("interval_months", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                      placeholder="Ej: 6"
                    />
                  </div>
                </div>
              </div>

              {/* Avisos previos del programa */}
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-700 space-y-4">
                <Label className="text-zinc-300">Avisos Previos <span className="text-zinc-500 font-normal text-xs">(opcional)</span></Label>
                <p className="text-xs text-zinc-500">Alertar cuando falte esta cantidad para el vencimiento.</p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-400">Faltan (km)</Label>
                    <Input
                      type="number"
                      value={form.warning_mileage}
                      onChange={(e) => set("warning_mileage", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                      placeholder="Ej: 500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-400">Faltan (horas)</Label>
                    <Input
                      type="number"
                      value={form.warning_hours}
                      onChange={(e) => set("warning_hours", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                      placeholder="Ej: 25"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-400">Faltan (días)</Label>
                    <Input
                      type="number"
                      value={form.warning_days}
                      onChange={(e) => set("warning_days", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                      placeholder="Ej: 15"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Especificaciones / insumos (para ítems y acciones) */}
          <div className="space-y-2">
            <Label>
              {form.task_type === "item" ? "Especificaciones" : form.task_type === "action" ? "Insumos / Materiales" : "Notas adicionales"}
              <span className="text-zinc-500 font-normal text-xs ml-1">(opcional)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                value={componentInput}
                onChange={(e) => setComponentInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addComponent(); } }}
                className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                placeholder={
                  form.task_type === "item" ? "Ej: SAE 15W40, Capacidad 18L"
                  : form.task_type === "action" ? "Ej: Grasa Mobilux EP2, Llave 24mm"
                  : "Ej: Herramienta especial requerida"
                }
              />
              <Button type="button" onClick={addComponent} variant="outline" className="border-zinc-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {form.component_names.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.component_names.map((c, idx) => (
                  <Badge key={idx} variant="outline" className="border-zinc-700 text-zinc-300 pr-1">
                    {c}
                    <button type="button" onClick={() => removeComponent(idx)} className="ml-2 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Fabricante y Tipo de Vehículo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Fabricante</Label>
              <Select value={form.applies_to_manufacturer_id || ""} onValueChange={(v) => set("applies_to_manufacturer_id", v)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todos los fabricantes</SelectItem>
                  {manufacturers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Vehículo</Label>
              <Select value={form.applies_to_vehicle_type_id || ""} onValueChange={(v) => set("applies_to_vehicle_type_id", v)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todos los tipos</SelectItem>
                  {vehicleTypes.map(vt => <SelectItem key={vt.id} value={vt.id}>{vt.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Activo */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-900">
            <Switch checked={form.is_active !== false} onCheckedChange={(v) => set("is_active", v)} />
            <Label className="cursor-pointer">Activo</Label>
          </div>

          <DialogFooter className="gap-2">
            {program && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">¿Eliminar?</AlertDialogTitle>
                    <AlertDialogDescription>Se eliminará permanentemente "{program.name}".</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-white">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="border-zinc-700 text-zinc-300">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {program ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}