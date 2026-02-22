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
import { Loader2, Trash2, Plus, X } from "lucide-react";
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

const initialState = {
  name: "",
  description: "",
  interval_type: "mileage",
  interval_value: "",
  warning_interval_type: "mileage",
  warning_interval_value: "",
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
        setForm({
          ...program,
          interval_value: program.interval_value || "",
          warning_interval_value: program.warning_interval_value || "",
          component_names: program.component_names || [],
          linked_task_ids: program.linked_task_ids || [],
        });
      } else {
        setForm({
          ...initialState,
          company_id: isSuperAdmin ? "" : currentUser?.company_id,
        });
      }
    }
  }, [program, open, isSuperAdmin, currentUser]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      interval_value: Number(form.interval_value),
      warning_interval_value: form.warning_interval_value ? Number(form.warning_interval_value) : null,
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

  const availableTasks = allPrograms.filter(p => !p.is_program_group && p.id !== program?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{program ? "Editar Programa" : "Nuevo Programa"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
              placeholder="Ej: Servicio Scania A, Cambio de Aceite"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
              placeholder="Descripción del programa o tarea"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-900">
            <Switch
              checked={form.is_program_group}
              onCheckedChange={(checked) => handleChange("is_program_group", checked)}
            />
            <Label className="cursor-pointer">Es un grupo de tareas (programa completo)</Label>
          </div>

          {form.is_program_group && (
            <div className="space-y-2 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <Label>Tareas incluidas en este programa</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableTasks.length === 0 ? (
                  <p className="text-sm text-zinc-500">No hay tareas individuales disponibles</p>
                ) : (
                  availableTasks.map(task => (
                    <label key={task.id} className="flex items-center gap-2 p-2 rounded hover:bg-zinc-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.linked_task_ids.includes(task.id)}
                        onChange={() => toggleLinkedTask(task.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-white">{task.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Intervalo *</Label>
              <Select value={form.interval_type} onValueChange={(v) => handleChange("interval_type", v)} required>
                <SelectTrigger className="bg-zinc-900 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mileage">Kilómetros</SelectItem>
                  <SelectItem value="hours">Horas</SelectItem>
                  <SelectItem value="months">Meses</SelectItem>
                  <SelectItem value="years">Años</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cada (valor) *</Label>
              <Input
                type="number"
                value={form.interval_value}
                onChange={(e) => handleChange("interval_value", e.target.value)}
                className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                placeholder="Ej: 10000, 3, 12"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Aviso Previo</Label>
              <Select value={form.warning_interval_type} onValueChange={(v) => handleChange("warning_interval_type", v)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mileage">Kilómetros</SelectItem>
                  <SelectItem value="hours">Horas</SelectItem>
                  <SelectItem value="days">Días</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                value={form.warning_interval_value}
                onChange={(e) => handleChange("warning_interval_value", e.target.value)}
                className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                placeholder="Ej: 500, 7"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fabricante</Label>
              <Select value={form.applies_to_manufacturer_id || ""} onValueChange={(v) => handleChange("applies_to_manufacturer_id", v || "")}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700">
                  <SelectValue placeholder="Todos los fabricantes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todos</SelectItem>
                  {manufacturers.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Vehículo</Label>
              <Select value={form.applies_to_vehicle_type_id || ""} onValueChange={(v) => handleChange("applies_to_vehicle_type_id", v || "")}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todos</SelectItem>
                  {vehicleTypes.map(vt => (
                    <SelectItem key={vt.id} value={vt.id}>{vt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Componentes</Label>
            <div className="flex gap-2">
              <Input
                value={componentInput}
                onChange={(e) => setComponentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addComponent();
                  }
                }}
                className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                placeholder="Ej: Filtro de aceite"
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

          <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-900">
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => handleChange("is_active", checked)}
            />
            <Label className="cursor-pointer">Programa activo</Label>
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
                    <AlertDialogTitle className="text-white">¿Eliminar programa?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente el programa "{program.name}".
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