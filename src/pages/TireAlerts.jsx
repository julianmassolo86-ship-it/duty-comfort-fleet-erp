import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/common/PageHeader";
import { AlertTriangle, Gauge, Ruler, RotateCcw, Battery } from "lucide-react";
import { differenceInDays } from "date-fns";

function AlertRow({ icon: Icon, color, title, detail, severity, isDark }) {
  const sev = {
    critico: { bg: isDark ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200", text: isDark ? "text-red-400" : "text-red-600", badge: "bg-red-500/20 text-red-400 border-red-500/30" },
    alerta: { bg: isDark ? "bg-yellow-500/10 border-yellow-500/30" : "bg-yellow-50 border-yellow-200", text: isDark ? "text-yellow-400" : "text-yellow-600", badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  }[severity] || {};

  return (
    <div className={cn("flex items-start gap-4 p-4 rounded-xl border", sev.bg)}>
      <div className={cn("p-2 rounded-lg", isDark ? "bg-black/20" : "bg-white/60")}>
        <Icon className={cn("w-4 h-4", sev.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold text-sm", isDark ? "text-white" : "text-gray-900")}>{title}</p>
        <p className={cn("text-xs mt-0.5", isDark ? "text-zinc-400" : "text-gray-500")}>{detail}</p>
      </div>
      <span className={cn("px-2 py-0.5 rounded-full border text-xs font-bold shrink-0", sev.badge)}>
        {severity === "critico" ? "CRÍTICO" : "ALERTA"}
      </span>
    </div>
  );
}

export default function TireAlerts() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);
  const isSuperAdmin = !currentUser?.company_id;
  const companyId = currentUser?.company_id;

  const { data: tires = [] } = useQuery({ queryKey: ["tires"], queryFn: () => base44.entities.Tire.list() });
  const { data: assignments = [] } = useQuery({ queryKey: ["tireAssignments"], queryFn: () => base44.entities.TireAssignment.list() });
  const { data: inspections = [] } = useQuery({ queryKey: ["tireInspections"], queryFn: () => base44.entities.TireInspection.list() });
  const { data: rotationPlans = [] } = useQuery({ queryKey: ["tireRotationPlans"], queryFn: () => base44.entities.TireRotationPlan.list() });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => base44.entities.Vehicle.list() });

  const accessibleTires = isSuperAdmin ? tires : tires.filter(t => t.company_id === companyId);
  const accessibleVehicles = isSuperAdmin ? vehicles : vehicles.filter(v => v.company_id === companyId);

  const alerts = [];

  // 1. Tread depth alerts
  const activeAssignments = assignments.filter(a => a.is_active);
  activeAssignments.forEach(a => {
    const tire = accessibleTires.find(t => t.id === a.tire_id);
    if (!tire) return;
    const vehicle = accessibleVehicles.find(v => v.id === a.vehicle_id);
    const lastInsp = inspections.filter(i => i.tire_id === a.tire_id)
      .sort((x, y) => new Date(y.inspection_date) - new Date(x.inspection_date))[0];
    if (!lastInsp) return;

    const minTread = Math.min(lastInsp.tread_depth_inner ?? 99, lastInsp.tread_depth_center ?? 99, lastInsp.tread_depth_outer ?? 99);
    if (minTread < 3) {
      alerts.push({ type: "tread", severity: "critico", icon: Ruler,
        title: `Labrado crítico — ${tire.brand} ${tire.size} (${a.position.replace(/_/g," ")})`,
        detail: `Mín. ${minTread}mm · Vehículo: ${vehicle?.plate || vehicle?.internal_number || "–"} · Última insp.: ${lastInsp.inspection_date}` });
    } else if (minTread < 4) {
      alerts.push({ type: "tread", severity: "alerta", icon: Ruler,
        title: `Labrado bajo — ${tire.brand} ${tire.size} (${a.position.replace(/_/g," ")})`,
        detail: `Mín. ${minTread}mm · Vehículo: ${vehicle?.plate || vehicle?.internal_number || "–"}` });
    }

    // 2. Pressure alerts
    if (lastInsp.pressure_psi && lastInsp.expected_pressure_psi) {
      const diff = Math.abs(lastInsp.pressure_psi - lastInsp.expected_pressure_psi) / lastInsp.expected_pressure_psi;
      if (diff > 0.1) {
        alerts.push({ type: "pressure", severity: diff > 0.2 ? "critico" : "alerta", icon: Gauge,
          title: `Presión fuera de rango — ${tire.brand} ${tire.size}`,
          detail: `Medida: ${lastInsp.pressure_psi} PSI · Esperada: ${lastInsp.expected_pressure_psi} PSI · Diferencia: ${(diff * 100).toFixed(0)}%` });
      }
    }
  });

  // 3. Lifespan alerts
  accessibleTires.filter(t => t.status === "montado" && t.estimated_lifespan_km && t.total_km).forEach(t => {
    const pct = t.total_km / t.estimated_lifespan_km;
    if (pct >= 1) {
      alerts.push({ type: "lifespan", severity: "critico", icon: Battery,
        title: `Vida útil excedida — ${t.brand} ${t.size} (${t.serial_number})`,
        detail: `${t.total_km.toLocaleString()} km / ${t.estimated_lifespan_km.toLocaleString()} km estimados (${(pct * 100).toFixed(0)}%)` });
    } else if (pct >= 0.9) {
      alerts.push({ type: "lifespan", severity: "alerta", icon: Battery,
        title: `Fin de vida próximo — ${t.brand} ${t.size} (${t.serial_number})`,
        detail: `${t.total_km.toLocaleString()} km / ${t.estimated_lifespan_km.toLocaleString()} km estimados (${(pct * 100).toFixed(0)}%)` });
    }
  });

  // 4. Rotation plan alerts
  const accessiblePlans = isSuperAdmin ? rotationPlans : rotationPlans.filter(p => p.company_id === companyId);
  accessiblePlans.filter(p => p.is_active).forEach(p => {
    const vehicle = accessibleVehicles.find(v => v.id === p.vehicle_id);
    if (!vehicle) return;
    let isAlert = false, isCritical = false, reason = "";

    if (p.next_rotation_km && vehicle.mileage) {
      const diff = p.next_rotation_km - vehicle.mileage;
      if (diff <= 0) { isCritical = true; reason = `Rotación vencida por km (${Math.abs(diff).toLocaleString()} km pasados)`; }
      else if (diff <= (p.interval_km * 0.1 || 500)) { isAlert = true; reason = `Rotación próxima (faltan ${diff.toLocaleString()} km)`; }
    }
    if (p.next_rotation_date && !isCritical) {
      const daysLeft = differenceInDays(new Date(p.next_rotation_date), new Date());
      if (daysLeft < 0) { isCritical = true; reason = `Rotación vencida por fecha (${Math.abs(daysLeft)} días)`; }
      else if (daysLeft <= 7) { isAlert = true; reason = `Rotación en ${daysLeft} días`; }
    }

    if (isCritical || isAlert) {
      alerts.push({ type: "rotation", severity: isCritical ? "critico" : "alerta", icon: RotateCcw,
        title: `Rotación pendiente — ${vehicle.plate || vehicle.internal_number}`,
        detail: reason });
    }
  });

  const criticals = alerts.filter(a => a.severity === "critico");
  const alertsOnly = alerts.filter(a => a.severity === "alerta");

  const cardBg = isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-gray-200";

  return (
    <div className={cn("min-h-screen p-4 sm:p-6", isDark ? "bg-black" : "bg-gray-50")}>
      <div className="max-w-4xl mx-auto">
        <PageHeader title="Alertas de Neumáticos" description="Monitoreo automático del estado de la flota" />

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={cn("rounded-2xl border p-4 flex items-center gap-4", isDark ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200")}>
            <AlertTriangle className={cn("w-8 h-8", isDark ? "text-red-400" : "text-red-600")} />
            <div>
              <p className={cn("text-2xl font-bold", isDark ? "text-red-400" : "text-red-600")}>{criticals.length}</p>
              <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-500")}>Alertas críticas</p>
            </div>
          </div>
          <div className={cn("rounded-2xl border p-4 flex items-center gap-4", isDark ? "bg-yellow-500/10 border-yellow-500/30" : "bg-yellow-50 border-yellow-200")}>
            <AlertTriangle className={cn("w-8 h-8", isDark ? "text-yellow-400" : "text-yellow-600")} />
            <div>
              <p className={cn("text-2xl font-bold", isDark ? "text-yellow-400" : "text-yellow-600")}>{alertsOnly.length}</p>
              <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-500")}>Alertas preventivas</p>
            </div>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className={cn("rounded-2xl border border-dashed p-16 text-center", isDark ? "border-zinc-700 text-zinc-500" : "border-gray-300 text-gray-400")}>
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Sin alertas activas</p>
            <p className="text-sm mt-1">Todos los neumáticos están dentro de parámetros normales</p>
          </div>
        ) : (
          <div className="space-y-6">
            {criticals.length > 0 && (
              <div className={cn("rounded-2xl border p-6", cardBg)}>
                <h3 className={cn("font-bold text-base mb-4", isDark ? "text-red-400" : "text-red-600")}>
                  🔴 Críticas ({criticals.length})
                </h3>
                <div className="space-y-3">
                  {criticals.map((a, i) => <AlertRow key={i} {...a} isDark={isDark} />)}
                </div>
              </div>
            )}
            {alertsOnly.length > 0 && (
              <div className={cn("rounded-2xl border p-6", cardBg)}>
                <h3 className={cn("font-bold text-base mb-4", isDark ? "text-yellow-400" : "text-yellow-600")}>
                  🟡 Preventivas ({alertsOnly.length})
                </h3>
                <div className="space-y-3">
                  {alertsOnly.map((a, i) => <AlertRow key={i} {...a} isDark={isDark} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}