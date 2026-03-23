import React, { useState, useEffect } from "react";
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
import { Loader2, Trash2, Plus, X, Wrench, Zap, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const TASK_TYPES = [
  {
    key: "item",
    label: "Ítem / Componente",
    description: "Un insumo o repuesto (Filtro de aceite, Aceite motor, Filtro de cabina...)",
    icon: Wrench,
    color: "border-blue-500/50 bg-blue-500/10 text-blue-400",
    activeColor: "border-blue-500 bg-blue-500/20 text-blue-300",
  },
  {
    key: "action",
    label: "Acción / Procedimiento",
    description: "Una tarea de mantenimiento (Engrase de chasis, Purga de tanques de aire, Regulación de frenos...)",
    icon: Zap,
    color: "border-green-500/50 bg-green-500/10 text-green-400",
    activeColor: "border-green-500 bg-green-500/20 text-green-300",
  },
  {
    key: "program",
    label: "Programa de Servicio",
    description: "Agrupa múltiples ítems y acciones (Inspección S, PM2, Servicio Scania A...)",
    icon: Package,
    color: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
    activeColor: "border-yellow-500 bg-yellow-500/20 text-yellow-300",
  },
];

const initialState = {
  name: "",
  description: "",
  task_type: "item",
  interval_type: "mileage",
  interval_value: "",
  interval_mileage: "",
  interval_hours: "",
  warning_interval_type: "mileage",
  warning_interval_value: "",
  warning_interval_mileage: "",
  warning_interval_hours: "",
  is_program_group: false,
  linked_task_ids: [],
  applies_to_vehicle_type_id: "",
  applies_to_manufacturer_id: "",
  component_names: [],
  company_id: "",
  is_active: true,
};

export default function MaintenanceProgramDialog({
  open,
  onOpenChange,
  program,
  manufacturers,
  vehicleTypes,
  allPrograms,
  isSuperAdmin,
  currentUser,
  defaultType = "item",
  onSave,
  onDelete,
  isLoading,
  isDeleting,
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
          ...program,
          task_type: taskType,
          interval_value: program.interval_value || "",
          interval_mileage: program.interval_mileage || "",
          interval_hours: program.interval_hours || "",
          warning_interval_value: program.warning_interval_value || "",
          warning_interval_mileage: program.warning_interval_mileage || "",
          warning_interval_hours: program.warning_interval_hours || "",
          component_names: program.component_names || [],
          linked_task_ids: program.linked_task_ids || [],
        });
      } else {
        setForm({
          ...initialState,
          task_type: defaultType,
          is_program_group: defaultType === "program",
          company_id: isSuperAdmin ? "" : currentUser?.company_id,
        });
      }
      setComponentInput("");
    }
  }, [program, open, isSuperAdmin, currentUser, defaultType]);

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === "task_type") {
        updated.is_program_group = value === "program";
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      is_program_group: form.task_type === "program",
      interval_value: form.interval_value ? Number(form.interval_value) : null,
      interval_mileage: form.interval_mileage ? Number(form.interval_mileage) : null,
      interval_hours: form.interval_hours ? Number(form.interval_hours) : null,
      warning_interval_value: form.warning_interval_value ? Number(form.warning_interval_value) : null,
      warning_interval_mileage: form.warning_interval_mileage ? Number(form.warning_interval_mileage) : null,
      warning_interval_hours: form.warning_interval_hours ? Number(form.warning_interval_hours) : null,
    });
  };

  const addComponent = () => {
    if (componentInput.trim()) {
      handleChange("component_names", [...form.component_names, componentInput.trim()]);
      setComponentInput("");
    }
  };

  const removeComponent = (index) => {
    handleChange("component_names", form.component_names.filter((_, i) => i !== index));
  };

  const toggleLinkedTask = (taskId) => {
    if (form.linked_task_ids.includes(taskId)) {
      handleChange("linked_task_ids", form.linked_task_ids.filter(id => id !== taskId));
    } else {
      handleChange("linked_task_ids", [...form.linked_task_ids, taskId]);
    }
  };

  // Para programas, los candidatos a incluir son ítems y acciones
  const availableItemsAndActions = allPrograms.filter(p =>
    p.id !== program?.id &&
    (p.task_type === "item" || p.task_type === "action" || (!p.task_type && !p.is_program_group))
  );

  const currentTaskTypeInfo = TASK_TYPES.find(t => t.key === form.task_type);
  const isProgram = form.task_type === "program";

  const dialogTitle = program
    ? `Editar: ${program.name}`
    : form.task_type === "item" ? "Nuevo Ítem / Componente"
    : form.task_type === "action" ? "Nueva Acción"
    : "Nuevo Programa de Servicio";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentTaskTypeInfo && <currentTaskTypeInfo.icon className="w-5 h-5" />}
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <div className="grid grid-cols-3 gap-2">
              {TASK_TYPES.map(type => (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => handleChange("task_type", type.key)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center",
                    form.task_type === type.key
                      ? type.activeColor + " border-2"
                      : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  <type.icon className="w-5 h-5" />
                  <span className="text-xs font-semibold leading-tight">{type.label.split(" / ")[0].split(" de ")[0]}</span>
                </button>
              ))}
            </div>
            {currentTaskTypeInfo && (
              <p className="text-xs text-zinc-500 mt-1">{currentTaskTypeInfo.description}</p>
            )}
          </div>

          {/* Empresa (solo super admin) */}
          {isSuperAdmin && (
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <Select value={form.company_id} onValueChange={(v) => handleChange("company_id", v)} required>
                <SelectTrigger className="bg-zinc-900 border-zinc-700">
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

          {/* Nombre */}
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
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
              onChange={(e) => handleChange("description", e.target.value)}
              className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
              placeholder="Descripción detallada..."
              rows={2}
            />
          </div>

          {/* Si es programa: selector de ítems y acciones */}
          {isProgram && (
            <div className="space-y-2 p-4 rounded-xl bg-zinc-900/50 border border-yellow-500/20">
              <Label className="text-yellow-400">Ítems y Acciones incluidos en este programa</Label>
              {availableItemsAndActions.length === 0 ? (
                <p className="text-sm text-zinc-500">No hay ítems ni acciones disponibles. Créalos primero.</p>
              ) : (
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  {availableItemsAndActions.map(task => {
                    const ttype = task.task_type || (task.is_program_group ? "program" : "item");
                    return (
                      <label key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.linked_task_ids.includes(task.id)}
                          onChange={() => toggleLinkedTask(task.id)}
                          className="w-4 h-4 accent-yellow-500"
                        />
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border",
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
                <p className="text-xs text-yellow-500">{form.linked_task_ids.length} elemento(s) seleccionado(s)</p>
              )}
            </div>
          )}

          {/* Intervalo Principal */}
          <div className="space-y-2">
            <Label>Intervalo Principal {!isProgram && "*"}</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Tipo</Label>
                <Select value={form.interval_type} onValueChange={(v) => handleChange("interval_type", v)}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mileage">Kilómetros</SelectItem>
                    <SelectItem value="hours">Horas</SelectItem>
                    <SelectItem value="months">Meses</SelectItem>
                    <SelectItem value="years">Años</SelectItem>
                    <SelectItem value="days">Días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Cada (valor)</Label>
                <Input
                  type="number"
                  value={form.interval_value}
                  onChange={(e) => handleChange("interval_value", e.target.value)}
                  className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                  placeholder="Ej: 10000"
                />
              </div>
            </div>
          </div>

          {/* Intervalos adicionales */}
          <div className="space-y-2">
            <Label>Intervalos Adicionales <span className="text-zinc-500 font-normal text-xs">(se ejecuta el que llegue primero)</span></Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Cada (km)</Label>
                <Input type="number" value={form.interval_mileage} onChange={(e) => handleChange("interval_mileage", e.target.value)}
                  className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50" placeholder="Ej: 10000" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Cada (horas)</Label>
                <Input type="number" value={form.interval_hours} onChange={(e) => handleChange("interval_hours", e.target.value)}
                  className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50" placeholder="Ej: 500" />
              </div>
            </div>
          </div>

          {/* Aviso previo */}
          <div className="space-y-2">
            <Label>Aviso Previo <span className="text-zinc-500 font-normal text-xs">(opcional)</span></Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Tipo</Label>
                <Select value={form.warning_interval_type} onValueChange={(v) => handleChange("warning_interval_type", v)}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mileage">Kilómetros</SelectItem>
                    <SelectItem value="hours">Horas</SelectItem>
                    <SelectItem value="days">Días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Valor</Label>
                <Input type="number" value={form.warning_interval_value} onChange={(e) => handleChange("warning_interval_value", e.target.value)}
                  className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50" placeholder="Ej: 500" />
              </div>
            </div>
          </div>

          {/* Fabricante y Tipo de Vehículo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Fabricante</Label>
              <Select value={form.applies_to_manufacturer_id || ""} onValueChange={(v) => handleChange("applies_to_manufacturer_id", v || "")}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todos los fabricantes</SelectItem>
                  {manufacturers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Vehículo</Label>
              <Select value={form.applies_to_vehicle_type_id || ""} onValueChange={(v) => handleChange("applies_to_vehicle_type_id", v || "")}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todos los tipos</SelectItem>
                  {vehicleTypes.map(vt => <SelectItem key={vt.id} value={vt.id}>{vt.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Componentes / insumos */}
          <div className="space-y-2">
            <Label>
              {form.task_type === "item" ? "Especificaciones del ítem" : "Componentes / insumos relacionados"}
              <span className="text-zinc-500 font-normal text-xs ml-1">(opcional)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                value={componentInput}
                onChange={(e) => setComponentInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addComponent(); } }}
                className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                placeholder={form.task_type === "item" ? "Ej: SAE 15W40, Capacidad 18L" : "Ej: Grasa Mobilux EP2"}
              />
              <Button type="button" onClick={addComponent} variant="outline" className="border-zinc-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {form.component_names.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.component_names.map((component, idx) => (
                  <Badge key={idx} variant="outline" className="border-zinc-700 text-zinc-300 pr-1">
                    {component}
                    <button type="button" onClick={() => removeComponent(idx)} className="ml-2 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Activo */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-900">
            <Switch checked={form.is_active} onCheckedChange={(checked) => handleChange("is_active", checked)} />
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
                    <AlertDialogDescription>
                      Se eliminará permanentemente "{program.name}".
                    </AlertDialogDescription>
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
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {program ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}