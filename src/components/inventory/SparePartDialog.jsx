import React, { useState, useEffect, useContext, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
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
    category_id: "",
    subcategory_id: "",
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
    compatible_manufacturer_id: "",
    compatible_vehicle_model_id: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: sparePartCategories = [] } = useQuery({
    queryKey: ["spare-part-categories"],
    queryFn: () => base44.entities.SparePartCategory.list(),
  });

  const { data: sparePartSubcategories = [] } = useQuery({
    queryKey: ["spare-part-subcategories"],
    queryFn: () => base44.entities.SparePartSubcategory.list(),
  });

  const filteredSubcategories = useMemo(() => {
    if (!form.category_id) return [];
    return sparePartSubcategories.filter(s => s.category_id === form.category_id && s.is_active !== false);
  }, [sparePartSubcategories, form.category_id]);

  const { data: manufacturers = [] } = useQuery({
    queryKey: ["manufacturers"],
    queryFn: () => base44.entities.Manufacturer.list(),
  });

  const { data: vehicleModels = [] } = useQuery({
    queryKey: ["vehicleModels"],
    queryFn: () => base44.entities.VehicleModel.list(),
  });

  const filteredModels = useMemo(() => {
    if (!form.compatible_manufacturer_id) return vehicleModels;
    return vehicleModels.filter(m => m.manufacturer_id === form.compatible_manufacturer_id);
  }, [vehicleModels, form.compatible_manufacturer_id]);

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

          {/* Categoría */}
          <div className="space-y-1">
            <Label className={labelClass}>Categoría</Label>
            <Select
              value={form.category_id || ""}
              onValueChange={(v) => { set("category_id", v); set("subcategory_id", ""); }}
            >
              <SelectTrigger className={cn("h-9", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")}>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                {sparePartCategories.filter(c => c.is_active !== false).sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategoría */}
          <div className="space-y-1">
            <Label className={labelClass}>Subcategoría</Label>
            <Select
              value={form.subcategory_id || ""}
              onValueChange={(v) => set("subcategory_id", v)}
              disabled={!form.category_id || filteredSubcategories.length === 0}
            >
              <SelectTrigger className={cn("h-9", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")}>
                <SelectValue placeholder={!form.category_id ? "Primero seleccioná una categoría" : filteredSubcategories.length === 0 ? "Sin subcategorías" : "Seleccionar subcategoría"} />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                {filteredSubcategories.sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          {/* Compatibilidad de Vehículo */}
          <div className="md:col-span-2">
            <p className={cn("text-xs font-semibold uppercase tracking-wider mb-2", isDark ? "text-zinc-500" : "text-gray-400")}>
              Vehículo Compatible
            </p>
          </div>

          <div className="space-y-1">
            <Label className={labelClass}>Fabricante Compatible</Label>
            <Select
              value={form.compatible_manufacturer_id || ""}
              onValueChange={(v) => {
                set("compatible_manufacturer_id", v);
                set("compatible_vehicle_model_id", ""); // reset model
              }}
            >
              <SelectTrigger className={cn("h-9", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")}>
                <SelectValue placeholder="Cualquier fabricante" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                <SelectItem value={null}>Cualquier fabricante</SelectItem>
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
            <Label className={labelClass}>Modelo Compatible</Label>
            <Select
              value={form.compatible_vehicle_model_id || ""}
              onValueChange={(v) => set("compatible_vehicle_model_id", v)}
            >
              <SelectTrigger className={cn("h-9", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")}>
                <SelectValue placeholder="Cualquier modelo" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                <SelectItem value={null}>Cualquier modelo</SelectItem>
                {filteredModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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