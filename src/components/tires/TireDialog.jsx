import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";

const TIRE_TYPES = [
  { value: "directriz", label: "Directriz" },
  { value: "traccion", label: "Tracción" },
  { value: "remolque", label: "Remolque" },
  { value: "all_terrain", label: "All-Terrain" },
];

const STATUSES = [
  { value: "en_stock", label: "En Stock" },
  { value: "montado", label: "Montado" },
  { value: "en_reparacion", label: "En Reparación" },
  { value: "recapando", label: "Recapando" },
  { value: "de_baja", label: "De Baja" },
];

export default function TireDialog({ open, onOpenChange, tire, onSave, companyId }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tire) setForm({ ...tire });
    else setForm({ status: "en_stock", company_id: companyId });
  }, [tire, open, companyId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", isDark ? "bg-zinc-900 border-zinc-800 text-white" : "")}>
        <DialogHeader>
          <DialogTitle>{tire ? "Editar Neumático" : "Nuevo Neumático"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1">
            <Label>N° de Serie *</Label>
            <Input value={form.serial_number || ""} onChange={e => set("serial_number", e.target.value)}
              className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
          </div>
          <div className="space-y-1">
            <Label>Marca *</Label>
            <Input value={form.brand || ""} onChange={e => set("brand", e.target.value)}
              className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
          </div>
          <div className="space-y-1">
            <Label>Modelo</Label>
            <Input value={form.model || ""} onChange={e => set("model", e.target.value)}
              className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
          </div>
          <div className="space-y-1">
            <Label>Medida *</Label>
            <Input value={form.size || ""} onChange={e => set("size", e.target.value)}
              placeholder="ej: 295/80R22.5" className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={form.tire_type || ""} onValueChange={v => set("tire_type", v)}>
              <SelectTrigger className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {TIRE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Estado</Label>
            <Select value={form.status || "en_stock"} onValueChange={v => set("status", v)}>
              <SelectTrigger className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>DOT</Label>
            <Input value={form.dot || ""} onChange={e => set("dot", e.target.value)}
              className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
          </div>
          <div className="space-y-1">
            <Label>Fecha Fabricación</Label>
            <Input type="date" value={form.manufacture_date || ""} onChange={e => set("manufacture_date", e.target.value)}
              className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
          </div>
          <div className="space-y-1">
            <Label>Fecha Compra</Label>
            <Input type="date" value={form.purchase_date || ""} onChange={e => set("purchase_date", e.target.value)}
              className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
          </div>
          <div className="space-y-1">
            <Label>Costo de Compra</Label>
            <Input type="number" value={form.purchase_cost || ""} onChange={e => set("purchase_cost", parseFloat(e.target.value))}
              className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
          </div>
          <div className="space-y-1">
            <Label>Proveedor</Label>
            <Input value={form.supplier || ""} onChange={e => set("supplier", e.target.value)}
              className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
          </div>
          <div className="space-y-1">
            <Label>Vida Útil Estimada (km)</Label>
            <Input type="number" value={form.estimated_lifespan_km || ""} onChange={e => set("estimated_lifespan_km", parseFloat(e.target.value))}
              className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Notas</Label>
            <Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)}
              className={isDark ? "bg-zinc-800 border-zinc-700" : ""} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-yellow-500 hover:bg-yellow-600 text-black">
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}