import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Car, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";
import { format } from "date-fns";

const PRIORIDAD_OPTS = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

const ESTADO_CONFIG = {
  pendiente: { label: "Pendiente", cls: "bg-yellow-500/10 text-yellow-500" },
  en_proceso: { label: "En Proceso", cls: "bg-blue-500/10 text-blue-400" },
  resuelto: { label: "Resuelto", cls: "bg-green-500/10 text-green-400" },
  cerrado: { label: "Cerrado", cls: "bg-gray-500/10 text-gray-400" },
};

export default function EditNovedadDialog({ open, onOpenChange, novedad, vehicle, onSuccess, onOpenCorrectivo }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [estado, setEstado] = useState("pendiente");
  const [prioridad, setPrioridad] = useState("media");
  const [cancelacionMotivo, setCancelacionMotivo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (novedad && open) {
      setEstado(novedad.estado || "pendiente");
      setPrioridad(novedad.prioridad || "media");
      setCancelacionMotivo(novedad.cancelacion_motivo || "");
      setError("");
    }
  }, [novedad, open, vehicle]);

  const handleSave = async () => {
    setError("");

    if (estado === "cerrado" && !cancelacionMotivo.trim()) {
      setError("Debe ingresar el motivo de cancelación para cerrar la novedad.");
      return;
    }
    if (estado === "resuelto" && novedad.estado !== "resuelto") {
      setError("Para marcar como resuelta, debe generar un Mantenimiento Correctivo.");
      return;
    }

    setLoading(true);
    try {
      const updates = { estado, prioridad };
      if (estado === "cerrado") updates.cancelacion_motivo = cancelacionMotivo;

      await base44.entities.Novedad.update(novedad.id, updates);

      // Auto-cambiar estado del vehículo a "maintenance" cuando pasa a en_proceso
      if (estado === "en_proceso" && novedad.estado !== "en_proceso" && novedad.vehicle_id) {
        await base44.entities.Vehicle.update(novedad.vehicle_id, { status: "maintenance" });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!novedad) return null;

  const estadoInfo = ESTADO_CONFIG[novedad.estado] || ESTADO_CONFIG.pendiente;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-lg", isDark ? "bg-zinc-900 border-zinc-800 text-white" : "")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Gestionar Novedad</span>
            {novedad.report_number && (
              <span className="text-sm font-mono px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-600 border border-yellow-500/30">
                #{novedad.report_number}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Datos del vehículo */}
          {vehicle && (
            <div className={cn("p-3 rounded-lg border flex items-center gap-3", isDark ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200")}>
              {vehicle.image_url ? (
                <img src={vehicle.image_url} alt={vehicle.plate} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0", isDark ? "bg-zinc-700" : "bg-gray-200")}>
                  <Car className={cn("w-6 h-6", isDark ? "text-zinc-400" : "text-gray-400")} />
                </div>
              )}
              <div>
                <p className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                  {vehicle.internal_number && `Interno ${vehicle.internal_number}`}{vehicle.plate && ` · ${vehicle.plate}`}
                </p>
                <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-500")}>
                  {vehicle.manufacturer} {vehicle.model}
                </p>
              </div>
            </div>
          )}

          {/* Descripción de la novedad */}
          <div className={cn("p-3 rounded-lg border", isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-amber-50 border-amber-200")}>
            <p className={cn("text-xs font-medium mb-1", isDark ? "text-zinc-400" : "text-amber-700")}>Problema reportado:</p>
            <p className={cn("text-sm", isDark ? "text-zinc-200" : "text-gray-800")}>{novedad.descripcion}</p>
            {novedad.fecha_reporte && (
              <p className={cn("text-xs mt-1", isDark ? "text-zinc-500" : "text-amber-600")}>
                Reportado el {format(new Date(novedad.fecha_reporte + "T00:00:00"), "dd/MM/yyyy")}
              </p>
            )}
          </div>

          {/* Estado actual */}
          <div className="flex items-center gap-2">
            <span className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-500")}>Estado actual:</span>
            <span className={cn("text-xs px-2 py-1 rounded-full font-medium", estadoInfo.cls)}>{estadoInfo.label}</span>
          </div>

          {/* Editar prioridad */}
          <div className="space-y-1">
            <Label>Prioridad</Label>
            <Select value={prioridad} onValueChange={setPrioridad}>
              <SelectTrigger className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORIDAD_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Cambiar estado */}
          <div className="space-y-1">
            <Label>Cambiar Estado</Label>
            <Select value={estado} onValueChange={setEstado} disabled={novedad.estado === "resuelto"}>
              <SelectTrigger className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
                <SelectItem value="resuelto" disabled>Resuelto (solo vía mantenimiento correctivo)</SelectItem>
              </SelectContent>
            </Select>
            {estado === "en_proceso" && novedad.estado !== "en_proceso" && (
              <p className="text-xs text-blue-500">El vehículo pasará automáticamente a estado "En mantenimiento".</p>
            )}
          </div>

          {/* Motivo de cancelación */}
          {estado === "cerrado" && (
            <div className="space-y-1">
              <Label>Motivo de Cancelación *</Label>
              <Textarea
                value={cancelacionMotivo}
                onChange={e => setCancelacionMotivo(e.target.value)}
                placeholder="Describa el motivo por el cual se cierra esta novedad sin resolverla..."
                rows={3}
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""}
              />
            </div>
          )}

          {/* Botón para generar correctivo */}
          {novedad.estado !== "cerrado" && novedad.estado !== "resuelto" && (
            <div className={cn("p-3 rounded-lg border", isDark ? "border-zinc-700 bg-zinc-800/30" : "border-gray-200 bg-gray-50")}>
              <p className={cn("text-xs mb-2", isDark ? "text-zinc-400" : "text-gray-500")}>
                Para resolver esta novedad, genere un Mantenimiento Correctivo:
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
                onClick={() => { onOpenChange(false); onOpenCorrectivo(novedad); }}
              >
                <Wrench className="w-4 h-4" />
                Generar Mantenimiento Correctivo
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}
            className={isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : ""}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || novedad.estado === "resuelto"}
            className="bg-yellow-500 hover:bg-yellow-600 text-black">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}