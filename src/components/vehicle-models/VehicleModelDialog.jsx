import React, { useState, useEffect, useContext } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { ThemeContextValue } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";

export default function VehicleModelDialog({ open, onOpenChange, vehicleModel, manufacturers = [], vehicleTypes = [], vehicleCategories = [], onSave, onDelete }) {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";

  const categoriesMap = new Map(vehicleCategories.map((c) => [c.id, c.name]));
  const vehicleTypeOptions = vehicleTypes.map((vt) => ({
    ...vt,
    display_name: `${categoriesMap.get(vt.category_id) || "Sin categoría"} - ${vt.name}`,
  }));

  const emptyForm = { name: "", manufacturer_id: "", vehicle_type_id: "", notes: "" };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(vehicleModel ? { ...emptyForm, ...vehicleModel } : emptyForm);
    }
  }, [vehicleModel, open]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const inputClass = cn("h-9", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "");
  const labelClass = cn("text-sm font-medium", isDark ? "text-zinc-300" : "text-gray-700");
  const selectClass = cn("h-9", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-lg", isDark ? "bg-zinc-900 border-zinc-700" : "bg-white")}>
        <DialogHeader>
          <DialogTitle className={isDark ? "text-white" : "text-gray-900"}>
            {vehicleModel ? "Editar Modelo" : "Nuevo Modelo de Vehículo"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className={labelClass}>Fabricante *</Label>
            <Select value={form.manufacturer_id} onValueChange={(v) => set("manufacturer_id", v)}>
              <SelectTrigger className={selectClass}>
                <SelectValue placeholder="Seleccionar fabricante" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                {manufacturers.sort((a, b) => a.name.localeCompare(b.name)).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      {m.logo_url && <img src={m.logo_url} alt={m.name} className="h-4 w-auto object-contain" />}
                      {m.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className={labelClass}>Nombre del Modelo *</Label>
            <Input
              className={inputClass}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej: Berlingo 1.6 HDI AM52, Tector 6x4"
            />
          </div>

          <div className="space-y-1">
            <Label className={labelClass}>Tipo de Vehículo</Label>
            <Select value={form.vehicle_type_id || ""} onValueChange={(v) => set("vehicle_type_id", v)}>
              <SelectTrigger className={selectClass}>
                <SelectValue placeholder="Seleccionar tipo (opcional)" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                <SelectItem value={null}>Sin tipo</SelectItem>
                {vehicleTypeOptions.sort((a, b) => a.display_name.localeCompare(b.display_name)).map((vt) => (
                  <SelectItem key={vt.id} value={vt.id}>
                    {vt.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className={labelClass}>Notas</Label>
            <Input
              className={inputClass}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Notas opcionales"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {vehicleModel && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className={isDark ? "bg-zinc-900 border-zinc-700" : ""}>
                <AlertDialogHeader>
                  <AlertDialogTitle className={isDark ? "text-white" : ""}>¿Eliminar modelo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className={isDark ? "bg-zinc-800 border-zinc-700 text-white" : ""}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(vehicleModel.id)} className="bg-red-600 hover:bg-red-700">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} className={isDark ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800" : ""}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.name || !form.manufacturer_id}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}