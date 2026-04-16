import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, Plus, X, Zap, Package, AlertTriangle } from "lucide-react";
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
import SparePartsSelector from "@/components/maintenance/SparePartsSelector";

const TASK_TYPES = [
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
    description: "Agrupa acciones y define los intervalos y avisos del conjunto (Servicio A, PM2, Inspección S...)",
    icon: Package,
    activeColor: "border-yellow-500 bg-yellow-500/20 text-yellow-300",
  },
];

const initialState = {
  name: "",
  description: "",
  task_type: "action",
  part_number: "",
  alternative_part_number: "",
  component_names: [],
  required_spare_parts: [],
  // Solo para programas:
  interval_mileage: "",
  interval_hours: "",
  interval_months: "",
  warning_mileage: "",
  warning_hours: "",
  warning_days: "",
  linked_task_ids: [],
  applies_to_vehicle_type_id: "",
  applies_to_vehicle_model_id: "",
  applies_to_manufacturer_id: "",
  company_id: "",
  is_active: true,
};

export default function MaintenanceProgramDialog({
  open, onOpenChange, program, manufacturers, vehicleTypes, vehicleModels = [], allPrograms,
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
          required_spare_parts: program.required_spare_parts || [],
          applies_to_vehicle_model_id: program.applies_to_vehicle_model_id ? String(program.applies_to_vehicle_model_id) : "",
          applies_to_manufacturer_id: program.applies_to_manufacturer_id ? String(program.applies_to_manufacturer_id) : "",
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
      applies_to_manufacturer_id: form.applies_to_manufacturer_id || "",
      applies_to_vehicle_model_id: form.applies_to_vehicle_model_id || "",
      interval_mileage: form.interval_mileage ? Number(form.interval_mileage) : null,
      interval_hours: form.interval_hours ? Number(form.interval_hours) : null,
      interval_months: form.interval_months ? Number(form.interval_months) : null,
      warning_mileage: form.warning_mileage ? Number(form.warning_mileage) : null,
      warning_hours: form.warning_hours ? Number(form.warning_hours) : null,
      warning_days: form.warning_days ? Number(form.warning_days) : null,
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

  const handleSelectSparePartsList = (parts) => {
    set("required_spare_parts", parts);
  };

  const toggleLinkedTask = (taskId) => {
    set("linked_task_ids",
      form.linked_task_ids.includes(taskId)
        ? form.linked_task_ids.filter(id => id !== taskId)
        : [...form.linked_task_ids, taskId]
    );
  };

  const availableItemsAndActions = allPrograms.filter(p =>
    p.id !== program?.id
  );

  const typeInfo = TASK_TYPES.find(t => t.key === form.task_type);
  const isProgram = form.task_type === "program";

  // Detectar marcas en repuestos y acciones seleccionadas
  const getSelectedManufacturers = () => {
    const mfgIds = new Set();
    
    // Desde required_spare_parts (repuestos almacén - cuando tipo es item)
    form.required_spare_parts.forEach(part => {
      if (part.compatible_manufacturer_id) {
        mfgIds.add(part.compatible_manufacturer_id);
      }
    });

    // Desde linked_task_ids (acciones/ítems - cuando tipo es program)
    form.linked_task_ids.forEach(taskId => {
      const task = allPrograms.find(t => t.id === taskId);
      if (task?.applies_to_manufacturer_id) {
        mfgIds.add(task.applies_to_manufacturer_id);
      }
    });

    return Array.from(mfgIds);
  };

  const selectedMfgs = isProgram ? getSelectedManufacturers() : [];
  const hasConflictingManufacturers = selectedMfgs.length > 1;
  const suggestedManufacturerId = selectedMfgs.length === 1 ? selectedMfgs[0] : null;

  const dialogTitle = program
    ? `Editar: ${program.name}`
    : isProgram ? "Nuevo Programa de Servicio"
    : "Nueva Acción";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {typeInfo && <typeInfo.icon className="w-5 h-5" />}
            {dialogTitle}
          </DialogTitle>
          {isProgram && !program && (
            <div className="mt-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-zinc-400 space-y-1">
              <p className="text-yellow-400 font-semibold">¿Cómo configurar un programa?</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Primero creá las <span className="text-green-400 font-medium">Acciones</span> que lo componen (ej: Purga de frenos, Engrase de chasis).</li>
                <li>Luego creá el <span className="text-yellow-400 font-medium">Programa</span>, seleccioná el fabricante y modelo, vinculá las acciones y definí los intervalos de ejecución y avisos.</li>
                <li>Finalmente, <span className="text-white font-medium">asigná el programa</span> a los vehículos correspondientes desde el botón "Asignar a Vehículos".</li>
              </ol>
            </div>
          )}
          {form.task_type === "action" && !program && (
            <p className="mt-1 text-xs text-zinc-500">
              Definí un procedimiento de mantenimiento (ej: Engrase de chasis, Purga de tanques). Luego podrás incluirlo en uno o más programas.
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">





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

          {/* === CAMPOS SOLO PARA ACCIONES === */}
          {form.task_type === "action" && (
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Fabricante / Marca</Label>
                  <Select value={form.applies_to_manufacturer_id || "__none__"} onValueChange={(v) => {
                    set("applies_to_manufacturer_id", v === "__none__" ? "" : v);
                    set("applies_to_vehicle_model_id", ""); // Reset modelo
                  }}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:border-green-500/50">
                      <SelectValue placeholder="Seleccionar fabricante (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin especificar</SelectItem>
                      {manufacturers.filter(m => m?.id).map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Modelo de Vehículo</Label>
                  <Select value={form.applies_to_vehicle_model_id || "__none__"} onValueChange={(v) => set("applies_to_vehicle_model_id", v === "__none__" ? "" : v)} disabled={!form.applies_to_manufacturer_id}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:border-green-500/50">
                      <SelectValue placeholder={form.applies_to_manufacturer_id ? "Seleccionar modelo" : "Primero selecciona un fabricante"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin especificar</SelectItem>
                      {vehicleModels.filter(m => m?.id && m.manufacturer_id === form.applies_to_manufacturer_id).map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* === CAMPOS SOLO PARA PROGRAMAS === */}
          {isProgram && (
            <>
              {/* Advertencia de conflicto de marcas */}
              {hasConflictingManufacturers && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-orange-300">
                    <p className="font-semibold">⚠️ Marcas conflictivas detectadas</p>
                    <p>Los repuestos/acciones seleccionados tienen marcas diferentes. Verifica la compatibilidad.</p>
                  </div>
                </div>
              )}

              {/* Sugerencia automática de marca */}
              {suggestedManufacturerId && !form.applies_to_manufacturer_id && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex gap-2">
                  <div className="text-xs text-blue-300 flex-1">
                    <p className="font-semibold">💡 Marca detectada</p>
                    <p>Se sugiere asignar la marca <strong>{manufacturers.find(m => m.id === suggestedManufacturerId)?.name}</strong></p>
                  </div>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline" 
                    className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20 shrink-0"
                    onClick={() => set("applies_to_manufacturer_id", suggestedManufacturerId)}
                  >
                    Aplicar
                  </Button>
                </div>
              )}

              {/* Fabricante y Modelo de Vehículo — solo programas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Fabricante</Label>
                  <Select value={form.applies_to_manufacturer_id || "__none__"} onValueChange={(v) => {
                    set("applies_to_manufacturer_id", v === "__none__" ? "" : v);
                    set("applies_to_vehicle_model_id", ""); // Reset modelo
                  }}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700"><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Todos los fabricantes</SelectItem>
                      {manufacturers.filter(m => m?.id).map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Modelo de Vehículo</Label>
                  <Select value={form.applies_to_vehicle_model_id || "__none__"} onValueChange={(v) => set("applies_to_vehicle_model_id", v === "__none__" ? "" : v)} disabled={!form.applies_to_manufacturer_id}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700"><SelectValue placeholder={form.applies_to_manufacturer_id ? "Seleccionar modelo" : "Primero selecciona fabricante"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Todos los modelos</SelectItem>
                      {vehicleModels.filter(m => m?.id && m.manufacturer_id === form.applies_to_manufacturer_id).map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Selector de Repuestos */}
              <SparePartsSelector
                companyId={isSuperAdmin ? (form.company_id || program?.company_id) : currentUser?.company_id}
                value={form.required_spare_parts}
                onChange={handleSelectSparePartsList}
                isDark={true}
                manufacturerId={form.applies_to_manufacturer_id}
                vehicleModelId={form.applies_to_vehicle_model_id}
              />

              {/* Buscador de Acciones */}
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 space-y-2">
                <Label className="text-green-400">Acciones del Programa</Label>
                <p className="text-xs text-zinc-500">Seleccioná las acciones de mantenimiento que incluye este programa.</p>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {availableItemsAndActions.filter(t => t.task_type === "action").length === 0 ? (
                    <p className="text-sm text-zinc-500 italic">No hay acciones disponibles. Créalas primero.</p>
                  ) : (
                    availableItemsAndActions.filter(t => t.task_type === "action").map(task => {
                      const manufacturerName = manufacturers.find(m => m.id === task.applies_to_manufacturer_id)?.name;
                      return (
                        <label key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.linked_task_ids.includes(task.id)}
                            onChange={() => toggleLinkedTask(task.id)}
                            className="w-4 h-4 accent-green-500 shrink-0"
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm text-white truncate">{task.name}</span>
                            {manufacturerName && (
                              <span className="text-xs text-zinc-500">Fab: {manufacturerName}</span>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                {form.linked_task_ids.filter(id => availableItemsAndActions.find(t => t.id === id && t.task_type === "action")).length > 0 && (
                  <p className="text-xs text-green-500 font-medium">{form.linked_task_ids.filter(id => availableItemsAndActions.find(t => t.id === id && t.task_type === "action")).length} acción(es) seleccionada(s)</p>
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