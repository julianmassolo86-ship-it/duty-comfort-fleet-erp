import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";

const CONDITIONS = [
  { value: "buena", label: "Buena" },
  { value: "desgaste_irregular", label: "Desgaste Irregular" },
  { value: "corte", label: "Corte" },
  { value: "burbuja", label: "Burbuja" },
  { value: "otro", label: "Otro" },
];

export default function TireInspectionDialog({ open, onOpenChange, assignment, tire, vehicle, onSave, companyId, inspectorName }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({
      inspection_date: new Date().toISOString().split("T")[0],
      visual_condition: "buena",
      company_id: companyId,
      tire_id: tire?.id || assignment?.tire_id,
      vehicle_id: vehicle?.id || assignment?.vehicle_id,
      tire_assignment_id: assignment?.id,
      inspector_name: inspectorName || "",
    });
  }, [open, assignment, tire, vehicle, companyId, inspectorName]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-lg max-h-[90vh] overflow-y-auto", isDark ? "bg-zinc-900 border-zinc-800 text-white" : "")}>
        <DialogHeader>
          <DialogTitle>
            Nueva Inspección — {tire?.brand} {tire?.size}
            {vehicle && <span className={cn("text-sm font-normal ml-2", isDark ? "text-zinc-400" : "text-gray-500")}>({vehicle.plate})</span>}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Fecha *</Label>
              <Input type="date" value={form.inspection_date || ""} onChange={e => set("inspection_date", e.target.value)}
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
            </div>
            <div className="space-y-1">
              <Label>Km vehículo</Label>
              <Input type="number" value={form.vehicle_km || ""} onChange={e => set("vehicle_km", parseFloat(e.target.value))}
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
            </div>
          </div>

          <div className={cn("rounded-lg p-3 space-y-3", isDark ? "bg-zinc-800/50" : "bg-gray-50")}>
            <p className="text-sm font-semibold">Profundidad de Labrado (mm)</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Interior</Label>
                <Input type="number" step="0.1" value={form.tread_depth_inner || ""} onChange={e => set("tread_depth_inner", parseFloat(e.target.value))}
                  className={isDark ? "bg-zinc-700 border-zinc-600" : ""} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Centro</Label>
                <Input type="number" step="0.1" value={form.tread_depth_center || ""} onChange={e => set("tread_depth_center", parseFloat(e.target.value))}
                  className={isDark ? "bg-zinc-700 border-zinc-600" : ""} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Exterior</Label>
                <Input type="number" step="0.1" value={form.tread_depth_outer || ""} onChange={e => set("tread_depth_outer", parseFloat(e.target.value))}
                  className={isDark ? "bg-zinc-700 border-zinc-600" : ""} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Presión Medida (PSI)</Label>
              <Input type="number" value={form.pressure_psi || ""} onChange={e => set("pressure_psi", parseFloat(e.target.value))}
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
            </div>
            <div className="space-y-1">
              <Label>Presión Esperada (PSI)</Label>
              <Input type="number" value={form.expected_pressure_psi || ""} onChange={e => set("expected_pressure_psi", parseFloat(e.target.value))}
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Condición Visual</Label>
            <Select value={form.visual_condition || "buena"} onValueChange={v => set("visual_condition", v)}>
              <SelectTrigger className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Inspector</Label>
            <Input value={form.inspector_name || ""} onChange={e => set("inspector_name", e.target.value)}
              className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
          </div>

          <div className="space-y-1">
            <Label>Observaciones</Label>
            <Textarea value={form.observations || ""} onChange={e => set("observations", e.target.value)}
              className={isDark ? "bg-zinc-800 border-zinc-700" : ""} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-yellow-500 hover:bg-yellow-600 text-black">
            {saving ? "Guardando..." : "Guardar Inspección"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}