import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Package, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";
import SparePartsSelector from "@/components/maintenance/SparePartsSelector";

export default function EditCorrectivoSparePartsDialog({ open, onOpenChange, correctivo, onSuccess }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [spareParts, setSpareParts] = useState([]);
  const [cost, setCost] = useState("");
  const [provider, setProvider] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && correctivo) {
      setSpareParts(correctivo.spare_parts_used || []);
      setCost(correctivo.cost || "");
      setProvider(correctivo.provider || "");
      setError("");
    }
  }, [open, correctivo]);

  // Auto-calcular costo total desde repuestos
  const totalFromParts = spareParts.reduce((sum, p) => sum + ((p.unit_cost || 0) * (p.quantity || 1)), 0);

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      await base44.entities.Maintenance.update(correctivo.id, {
        spare_parts_used: spareParts,
        cost: cost !== "" ? parseFloat(cost) : (totalFromParts || correctivo.cost || 0),
        provider: provider || correctivo.provider || "",
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!correctivo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-xl max-h-[90vh] overflow-y-auto", isDark ? "bg-zinc-900 border-zinc-800 text-white" : "")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-yellow-500" />
            Editar Repuestos del Correctivo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info del correctivo */}
          <div className={cn("p-3 rounded-lg border text-sm", isDark ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200")}>
            {correctivo.report_number && (
              <span className={cn("text-xs font-mono mr-2", isDark ? "text-zinc-400" : "text-gray-400")}>#{correctivo.report_number}</span>
            )}
            <span className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>{correctivo.description}</span>
            {correctivo.parts_replaced && !correctivo.spare_parts_used?.length && (
              <p className={cn("text-xs mt-1", isDark ? "text-zinc-500" : "text-gray-400")}>
                <Package className="w-3 h-3 inline mr-1" />
                Texto anterior: {correctivo.parts_replaced}
              </p>
            )}
          </div>

          {/* Selector de repuestos */}
          <SparePartsSelector
            companyId={correctivo.company_id}
            value={spareParts}
            onChange={setSpareParts}
            isDark={isDark}
          />

          {/* Costo y proveedor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Costo Total</Label>
              <Input
                type="number"
                value={cost}
                onChange={e => setCost(e.target.value)}
                placeholder={totalFromParts > 0 ? `Calculado: $${totalFromParts.toLocaleString()}` : "0"}
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""}
              />
              {totalFromParts > 0 && (
                <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>
                  Suma de repuestos: ${totalFromParts.toLocaleString()}
                  {cost === "" && (
                    <button onClick={() => setCost(String(totalFromParts))} className="ml-2 text-yellow-500 underline">usar</button>
                  )}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Proveedor / Taller</Label>
              <Input
                value={provider}
                onChange={e => setProvider(e.target.value)}
                placeholder="Nombre del taller..."
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}
            className={isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : ""}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}
            className="bg-yellow-500 hover:bg-yellow-600 text-black">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}