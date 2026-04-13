import React from "react";
import { cn } from "@/lib/utils";

const POSITIONS = [
  { key: "eje_1_izq",     label: "E1-I",   axle: 1, side: "left",  dual: false },
  { key: "eje_1_der",     label: "E1-D",   axle: 1, side: "right", dual: false },
  { key: "eje_2_izq_ext", label: "E2-IE",  axle: 2, side: "left",  dual: true,  inner: false },
  { key: "eje_2_izq_int", label: "E2-II",  axle: 2, side: "left",  dual: true,  inner: true  },
  { key: "eje_2_der_int", label: "E2-DI",  axle: 2, side: "right", dual: true,  inner: true  },
  { key: "eje_2_der_ext", label: "E2-DE",  axle: 2, side: "right", dual: true,  inner: false },
  { key: "eje_3_izq_ext", label: "E3-IE",  axle: 3, side: "left",  dual: true,  inner: false },
  { key: "eje_3_izq_int", label: "E3-II",  axle: 3, side: "left",  dual: true,  inner: true  },
  { key: "eje_3_der_int", label: "E3-DI",  axle: 3, side: "right", dual: true,  inner: true  },
  { key: "eje_3_der_ext", label: "E3-DE",  axle: 3, side: "right", dual: true,  inner: false },
  { key: "repuesto_1",    label: "R1",     axle: 99 },
  { key: "repuesto_2",    label: "R2",     axle: 99 },
];

function getTireCondition(inspection) {
  if (!inspection) return "sin_datos";
  const minTread = Math.min(
    inspection.tread_depth_inner ?? 99,
    inspection.tread_depth_center ?? 99,
    inspection.tread_depth_outer ?? 99
  );
  if (minTread < 3) return "critico";
  if (minTread < 4) return "alerta";

  if (inspection.pressure_psi && inspection.expected_pressure_psi) {
    const diff = Math.abs(inspection.pressure_psi - inspection.expected_pressure_psi) / inspection.expected_pressure_psi;
    if (diff > 0.1) return "alerta";
  }
  if (inspection.visual_condition === "burbuja" || inspection.visual_condition === "corte") return "critico";
  if (inspection.visual_condition === "desgaste_irregular") return "alerta";
  return "bueno";
}

const conditionStyle = {
  bueno:     { bg: "bg-green-500",  border: "border-green-400",  text: "text-green-400",  label: "Bueno" },
  alerta:    { bg: "bg-yellow-500", border: "border-yellow-400", text: "text-yellow-400", label: "Alerta" },
  critico:   { bg: "bg-red-500",    border: "border-red-400",    text: "text-red-400",    label: "Crítico" },
  sin_datos: { bg: "bg-zinc-600",   border: "border-zinc-500",   text: "text-zinc-400",   label: "Sin datos" },
  vacio:     { bg: "bg-zinc-800",   border: "border-zinc-700",   text: "text-zinc-600",   label: "Vacío" },
};

function TireSlot({ position, assignment, inspection, onClick, isDark }) {
  const condition = assignment ? getTireCondition(inspection) : "vacio";
  const style = conditionStyle[condition];

  return (
    <button
      onClick={() => assignment && onClick && onClick(assignment, position)}
      className={cn(
        "flex flex-col items-center justify-center rounded border-2 transition-all",
        "w-10 h-14 text-[9px] font-bold",
        style.border,
        assignment
          ? cn(style.bg, "bg-opacity-20 hover:bg-opacity-30 cursor-pointer")
          : cn(isDark ? "bg-zinc-900/50" : "bg-gray-100", "cursor-default opacity-50 border-dashed"),
        isDark ? "text-white" : "text-gray-800"
      )}
      title={assignment ? `${assignment.tire?.brand} ${assignment.tire?.size}` : "Sin neumático"}
    >
      <span className={cn("text-[8px]", style.text)}>{position.label}</span>
      {assignment && (
        <div className={cn("w-2 h-2 rounded-full mt-1", style.bg)} />
      )}
    </button>
  );
}

export default function TirePositionMap({ assignments, inspections, onTireClick, isDark }) {
  // Build a map: position key -> assignment + last inspection
  const posMap = {};
  assignments.forEach(a => {
    if (a.is_active) {
      const lastInspection = inspections
        .filter(i => i.tire_id === a.tire_id)
        .sort((x, y) => new Date(y.inspection_date) - new Date(x.inspection_date))[0];
      posMap[a.position] = { assignment: a, inspection: lastInspection };
    }
  });

  const axles = [1, 2, 3];

  return (
    <div className="space-y-4">
      {/* Vehicle body representation */}
      <div className={cn(
        "rounded-xl border-2 p-4 relative",
        isDark ? "border-zinc-700 bg-zinc-900/50" : "border-gray-300 bg-gray-50"
      )}>
        {/* Vehicle outline */}
        <div className="flex flex-col items-center gap-4">
          {/* Front label */}
          <span className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-zinc-500" : "text-gray-400")}>
            ← Frente
          </span>

          {/* Axles */}
          {axles.map(axle => {
            const axlePositions = POSITIONS.filter(p => p.axle === axle);
            if (axlePositions.length === 0) return null;

            const hasAnyInAxle = axlePositions.some(p => posMap[p.key]);
            if (!hasAnyInAxle && axle === 3) return null; // skip axle 3 if unused

            return (
              <div key={axle} className="flex items-center gap-3 w-full justify-center">
                {/* Left side */}
                <div className="flex gap-1">
                  {axlePositions.filter(p => p.side === "left" || !p.side).map(p => (
                    <TireSlot
                      key={p.key}
                      position={p}
                      assignment={posMap[p.key]?.assignment}
                      inspection={posMap[p.key]?.inspection}
                      onClick={onTireClick}
                      isDark={isDark}
                    />
                  ))}
                </div>
                {/* Axle bar */}
                <div className={cn("flex-1 h-1.5 rounded max-w-24", isDark ? "bg-zinc-700" : "bg-gray-300")} />
                {/* Axle label */}
                <span className={cn("text-xs w-6 text-center", isDark ? "text-zinc-500" : "text-gray-400")}>E{axle}</span>
                <div className={cn("flex-1 h-1.5 rounded max-w-24", isDark ? "bg-zinc-700" : "bg-gray-300")} />
                {/* Right side */}
                <div className="flex gap-1 flex-row-reverse">
                  {axlePositions.filter(p => p.side === "right").map(p => (
                    <TireSlot
                      key={p.key}
                      position={p}
                      assignment={posMap[p.key]?.assignment}
                      inspection={posMap[p.key]?.inspection}
                      onClick={onTireClick}
                      isDark={isDark}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Rear label */}
          <span className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-zinc-500" : "text-gray-400")}>
            Trasera →
          </span>
        </div>
      </div>

      {/* Spare tires */}
      <div className="flex gap-2 items-center">
        <span className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>Repuestos:</span>
        {POSITIONS.filter(p => p.axle === 99).map(p => (
          <TireSlot
            key={p.key}
            position={p}
            assignment={posMap[p.key]?.assignment}
            inspection={posMap[p.key]?.inspection}
            onClick={onTireClick}
            isDark={isDark}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(conditionStyle).map(([key, s]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-full", s.bg)} />
            <span className={cn("text-xs", isDark ? "text-zinc-400" : "text-gray-500")}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}