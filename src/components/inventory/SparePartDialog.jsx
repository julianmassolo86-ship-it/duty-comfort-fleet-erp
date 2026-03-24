import React, { useState, useEffect, useContext } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ThemeContextValue } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";

export default function SparePartDialog({ open, onClose, sparePart, companyId }) {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";

  const emptyForm = {
    name: "",
    description: "",
    part_number: "",
    alternative_part_number: "",
    manufacturer: "",
    supplier: "",
    unit_of_measure: "UNID",
    stock_quantity: 0,
    minimum_stock: 0,
    unit_cost: "",
    specifications: "",
    notes: "",
    is_active: true,
    company_id: companyId || "",
  };

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sparePart) {
      setForm({ ...emptyForm, ...sparePart });
    } else {
      setForm({ ...emptyForm, company_id: companyId || "" });
    }
  }, [sparePart, open, companyId]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    if (sparePart?.id) {
      await base44.entities.SparePart.update(sparePart.id, form);
    } else {
      await base44.entities.SparePart.create(form);
    }
    setSaving(false);
    onClose(true);
  };

  const inputClass = cn(
    "h-9",
    isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" : ""
  );
  const labelClass = cn("text-sm font-medium", isDark ? "text-zinc-300" : "text-gray-700");

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", isDark ? "bg-zinc-900 border-zinc-700" : "bg-white")}>
        <DialogHeader>
          <DialogTitle className={isDark ? "text-white" : "text-gray-900"}>
            {sparePart ? "Editar Repuesto" : "Nuevo Repuesto"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          {/* Nombre */}
          <div className="md:col-span-2 space-y-1">
            <Label className={labelClass}>Nombre *</Label>
            <Input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nombre del repuesto" />
          </div>

          {/* Descripción */}
          <div className="md:col-span-2 space-y-1">
            <Label className={labelClass}>Descripción</Label>
            <Textarea className={cn(isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Descripción del repuesto" />
          </div>

          {/* Fabricante */}
          <div className="space-y-1">
            <Label className={labelClass}>Fabricante</Label>
            <Input className={inputClass} value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} placeholder="ej: Bosch, Mann" />
          </div>

          {/* Proveedor */}
          <div className="space-y-1">
            <Label className={labelClass}>Proveedor</Label>
            <Input className={inputClass} value={form.supplier} onChange={(e) => set("supplier", e.target.value)} placeholder="Nombre del proveedor" />
          </div>

          {/* N° Pieza */}
          <div className="space-y-1">
            <Label className={labelClass}>N° Pieza OEM</Label>
            <Input className={inputClass} value={form.part_number} onChange={(e) => set("part_number", e.target.value)} placeholder="ej: 0451103369" />
          </div>

          {/* N° Pieza Alternativo */}
          <div className="space-y-1">
            <Label className={labelClass}>N° Pieza Alternativo</Label>
            <Input className={inputClass} value={form.alternative_part_number} onChange={(e) => set("alternative_part_number", e.target.value)} placeholder="ej: WP7342" />
          </div>

          {/* Especificaciones */}
          <div className="md:col-span-2 space-y-1">
            <Label className={labelClass}>Especificaciones Técnicas</Label>
            <Input className={inputClass} value={form.specifications} onChange={(e) => set("specifications", e.target.value)} placeholder="ej: SAE 15W40, Capacidad 18L" />
          </div>

          {/* Unidad de Medida + Cantidad por unidad */}
          <div className="space-y-1">
            <Label className={labelClass}>Unidad de Medida *</Label>
            <div className="flex gap-2">
              <Select value={form.unit_of_measure} onValueChange={(v) => set("unit_of_measure", v)}>
                <SelectTrigger className={cn("h-9 flex-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                  <SelectItem value="UNID">UNID</SelectItem>
                  <SelectItem value="LITROS">LITROS</SelectItem>
                  <SelectItem value="METROS">METROS</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className={cn("h-9 w-24", isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" : "")}
                type="number"
                value={form.quantity_per_unit}
                onChange={(e) => set("quantity_per_unit", parseFloat(e.target.value) || "")}
                placeholder="Cant."
              />
            </div>
          </div>

          {/* Costo Unitario */}
          <div className="space-y-1">
            <Label className={labelClass}>Costo Unitario</Label>
            <Input className={inputClass} type="number" value={form.unit_cost} onChange={(e) => set("unit_cost", parseFloat(e.target.value) || "")} placeholder="0.00" />
          </div>

          {/* Stock Actual */}
          <div className="space-y-1">
            <Label className={labelClass}>Stock Actual</Label>
            <Input className={inputClass} type="number" value={form.stock_quantity} onChange={(e) => set("stock_quantity", parseFloat(e.target.value) || 0)} placeholder="0" />
          </div>

          {/* Stock Mínimo */}
          <div className="space-y-1">
            <Label className={labelClass}>Stock Mínimo (Alerta)</Label>
            <Input className={inputClass} type="number" value={form.minimum_stock} onChange={(e) => set("minimum_stock", parseFloat(e.target.value) || 0)} placeholder="0" />
          </div>

          {/* Notas */}
          <div className="md:col-span-2 space-y-1">
            <Label className={labelClass}>Notas</Label>
            <Textarea className={cn(isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Notas adicionales" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)} className={isDark ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800" : ""}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !form.name} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}