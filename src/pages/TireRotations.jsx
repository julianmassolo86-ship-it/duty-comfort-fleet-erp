import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, RotateCcw, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { differenceInDays } from "date-fns";

export default function TireRotations() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const qc = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);
  const isSuperAdmin = !currentUser?.company_id;
  const companyId = currentUser?.company_id;

  const { data: plans = [] } = useQuery({ queryKey: ["tireRotationPlans"], queryFn: () => base44.entities.TireRotationPlan.list() });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => base44.entities.Vehicle.list() });

  const savePlan = useMutation({
    mutationFn: (data) => data.id ? base44.entities.TireRotationPlan.update(data.id, data) : base44.entities.TireRotationPlan.create({ ...data, company_id: companyId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tireRotationPlans"] }); setShowDialog(false); },
  });

  const accessibleVehicles = isSuperAdmin ? vehicles : vehicles.filter(v => v.company_id === companyId);
  const accessiblePlans = isSuperAdmin ? plans : plans.filter(p => p.company_id === companyId);

  const getPlanStatus = (plan) => {
    const vehicle = accessibleVehicles.find(v => v.id === plan.vehicle_id);
    if (!vehicle) return "unknown";
    let overdue = false, soon = false;

    if (plan.next_rotation_km && vehicle.mileage) {
      const diff = plan.next_rotation_km - vehicle.mileage;
      if (diff <= 0) overdue = true;
      else if (diff <= (plan.interval_km * 0.1 || 500)) soon = true;
    }
    if (plan.next_rotation_date) {
      const daysLeft = differenceInDays(new Date(plan.next_rotation_date), new Date());
      if (daysLeft < 0) overdue = true;
      else if (daysLeft <= 7) soon = true;
    }
    if (overdue) return "overdue";
    if (soon) return "soon";
    return "ok";
  };

  const openNew = () => {
    setEditPlan(null);
    setForm({ is_active: true, company_id: companyId });
    setShowDialog(true);
  };

  const openEdit = (plan) => {
    setEditPlan(plan);
    setForm({ ...plan });
    setShowDialog(true);
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const cardBg = isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-gray-200";

  const statusConfig = {
    overdue: { label: "Vencido", icon: AlertTriangle, cls: isDark ? "text-red-400 bg-red-500/10 border-red-500/30" : "text-red-600 bg-red-50 border-red-200" },
    soon: { label: "Próxima", icon: Clock, cls: isDark ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" : "text-yellow-600 bg-yellow-50 border-yellow-200" },
    ok: { label: "Al día", icon: CheckCircle, cls: isDark ? "text-green-400 bg-green-500/10 border-green-500/30" : "text-green-600 bg-green-50 border-green-200" },
    unknown: { label: "Sin datos", icon: Clock, cls: isDark ? "text-zinc-400 bg-zinc-800 border-zinc-700" : "text-gray-500 bg-gray-100 border-gray-200" },
  };

  return (
    <div className={cn("min-h-screen p-4 sm:p-6", isDark ? "bg-black" : "bg-gray-50")}>
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Rotación de Neumáticos" description="Planes y programación de rotaciones por vehículo" />

        <div className="flex justify-end mb-6">
          <Button onClick={openNew} className="bg-yellow-500 hover:bg-yellow-600 text-black gap-2">
            <Plus className="w-4 h-4" /> Nuevo Plan
          </Button>
        </div>

        {accessiblePlans.length === 0 ? (
          <div className={cn("rounded-2xl border border-dashed p-16 text-center", isDark ? "border-zinc-700 text-zinc-500" : "border-gray-300 text-gray-400")}>
            <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No hay planes de rotación</p>
            <Button size="sm" onClick={openNew} className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-black">Crear primer plan</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {accessiblePlans.map(plan => {
              const vehicle = accessibleVehicles.find(v => v.id === plan.vehicle_id);
              const status = getPlanStatus(plan);
              const sc = statusConfig[status];
              const Icon = sc.icon;
              return (
                <div key={plan.id} className={cn("rounded-2xl border p-5", cardBg)}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl border", sc.cls)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={cn("font-bold", isDark ? "text-white" : "text-gray-900")}>
                          {vehicle ? `${vehicle.plate || vehicle.internal_number} — ${vehicle.manufacturer} ${vehicle.model}` : "Vehículo desconocido"}
                        </p>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border font-semibold", sc.cls)}>{sc.label}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEdit(plan)}
                      className={isDark ? "border-zinc-700 hover:border-yellow-500/50" : ""}>
                      Editar plan
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t" style={{ borderColor: isDark ? "rgb(39,39,42)" : "rgb(229,231,235)" }}>
                    <div>
                      <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>Intervalo km</p>
                      <p className={cn("font-semibold text-sm", isDark ? "text-white" : "text-gray-900")}>{plan.interval_km?.toLocaleString() || "–"} km</p>
                    </div>
                    <div>
                      <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>Intervalo días</p>
                      <p className={cn("font-semibold text-sm", isDark ? "text-white" : "text-gray-900")}>{plan.interval_days || "–"} días</p>
                    </div>
                    <div>
                      <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>Última rotación</p>
                      <p className={cn("font-semibold text-sm", isDark ? "text-white" : "text-gray-900")}>{plan.last_rotation_date || "–"}</p>
                    </div>
                    <div>
                      <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>Próxima rotación</p>
                      <p className={cn("font-semibold text-sm", isDark ? "text-white" : "text-gray-900")}>
                        {plan.next_rotation_date || "–"}
                        {plan.next_rotation_km ? ` / ${plan.next_rotation_km.toLocaleString()} km` : ""}
                      </p>
                    </div>
                  </div>
                  {plan.rotation_pattern && (
                    <div className={cn("mt-3 p-3 rounded-lg text-sm", isDark ? "bg-zinc-800/50 text-zinc-300" : "bg-gray-50 text-gray-600")}>
                      <span className="font-semibold">Patrón: </span>{plan.rotation_pattern}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Plan Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className={cn("max-w-lg max-h-[90vh] overflow-y-auto", isDark ? "bg-zinc-900 border-zinc-800 text-white" : "")}>
          <DialogHeader>
            <DialogTitle>{editPlan ? "Editar Plan de Rotación" : "Nuevo Plan de Rotación"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Vehículo *</Label>
              <Select value={form.vehicle_id || ""} onValueChange={v => set("vehicle_id", v)}>
                <SelectTrigger className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {accessibleVehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.plate || v.internal_number} — {v.manufacturer} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Intervalo (km)</Label>
                <Input type="number" value={form.interval_km || ""} onChange={e => set("interval_km", parseFloat(e.target.value))}
                  className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
              </div>
              <div className="space-y-1">
                <Label>Intervalo (días)</Label>
                <Input type="number" value={form.interval_days || ""} onChange={e => set("interval_days", parseInt(e.target.value))}
                  className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Última rotación (fecha)</Label>
                <Input type="date" value={form.last_rotation_date || ""} onChange={e => set("last_rotation_date", e.target.value)}
                  className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
              </div>
              <div className="space-y-1">
                <Label>Última rotación (km)</Label>
                <Input type="number" value={form.last_rotation_km || ""} onChange={e => set("last_rotation_km", parseFloat(e.target.value))}
                  className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Próxima rotación (fecha)</Label>
                <Input type="date" value={form.next_rotation_date || ""} onChange={e => set("next_rotation_date", e.target.value)}
                  className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
              </div>
              <div className="space-y-1">
                <Label>Próxima rotación (km)</Label>
                <Input type="number" value={form.next_rotation_km || ""} onChange={e => set("next_rotation_km", parseFloat(e.target.value))}
                  className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Patrón de rotación</Label>
              <Textarea value={form.rotation_pattern || ""} onChange={e => set("rotation_pattern", e.target.value)}
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""} rows={2}
                placeholder="Ej: Delanteros ↔ Traseros en X, repuesto entra en posición..." />
            </div>
            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)}
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={() => savePlan.mutate(form)} disabled={savePlan.isPending} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              {savePlan.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}