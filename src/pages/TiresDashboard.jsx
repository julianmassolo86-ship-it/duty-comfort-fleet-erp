import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ClipboardList } from "lucide-react";
import TirePositionMap from "@/components/tires/TirePositionMap";
import TireInspectionDialog from "@/components/tires/TireInspectionDialog";
import TireAssignmentDialog from "@/components/tires/TireAssignmentDialog";

export default function TiresDashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const qc = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [showInspDialog, setShowInspDialog] = useState(false);
  const [showMountDialog, setShowMountDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  const isSuperAdmin = !currentUser?.company_id;
  const companyId = currentUser?.company_id;

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const { data: tires = [] } = useQuery({
    queryKey: ["tires"],
    queryFn: () => base44.entities.Tire.list(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["tireAssignments"],
    queryFn: () => base44.entities.TireAssignment.list(),
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ["tireInspections"],
    queryFn: () => base44.entities.TireInspection.list(),
  });

  const accessibleVehicles = isSuperAdmin ? vehicles : vehicles.filter(v => v.company_id === companyId);

  const selectedVehicle = accessibleVehicles.find(v => v.id === selectedVehicleId);

  useEffect(() => {
    if (!selectedVehicleId && accessibleVehicles.length > 0) {
      setSelectedVehicleId(accessibleVehicles[0].id);
    }
  }, [accessibleVehicles]);

  const vehicleAssignments = assignments.filter(a => a.vehicle_id === selectedVehicleId && a.is_active).map(a => ({
    ...a,
    tire: tires.find(t => t.id === a.tire_id)
  }));

  const saveInspection = useMutation({
    mutationFn: (data) => base44.entities.TireInspection.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tireInspections"] }),
  });

  const saveAssignment = useMutation({
    mutationFn: async (data) => {
      const a = await base44.entities.TireAssignment.create(data);
      await base44.entities.Tire.update(data.tire_id, { status: "montado" });
      return a;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tireAssignments"] });
      qc.invalidateQueries({ queryKey: ["tires"] });
    },
  });

  const handleTireClick = (assignment) => {
    setSelectedAssignment(assignment);
    setShowInspDialog(true);
  };

  const stockTires = tires.filter(t => t.status === "en_stock" && (!t.company_id || t.company_id === companyId || isSuperAdmin));

  return (
    <div className={cn("min-h-screen p-4 sm:p-6", isDark ? "bg-black" : "bg-gray-50")}>
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Dashboard de Neumáticos" description="Vista por vehículo del tren de rodamiento" />

        {/* Vehicle Selector */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="flex-1 min-w-64">
            <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
              <SelectTrigger className={isDark ? "bg-zinc-900 border-zinc-700" : ""}>
                <SelectValue placeholder="Seleccionar vehículo" />
              </SelectTrigger>
              <SelectContent>
                {accessibleVehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.plate || v.internal_number} — {v.manufacturer} {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowMountDialog(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black gap-2">
            <Plus className="w-4 h-4" /> Montar Neumático
          </Button>
        </div>

        {selectedVehicle && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Position Map */}
            <div className={cn("lg:col-span-2 rounded-2xl border p-6", isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-gray-200")}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn("font-bold text-lg", isDark ? "text-white" : "text-gray-900")}>
                  {selectedVehicle.plate || selectedVehicle.internal_number} — {selectedVehicle.manufacturer} {selectedVehicle.model}
                </h3>
                <span className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-500")}>
                  {vehicleAssignments.length} neumáticos montados
                </span>
              </div>
              <TirePositionMap
                assignments={vehicleAssignments}
                inspections={inspections}
                onTireClick={handleTireClick}
                isDark={isDark}
              />
              <p className={cn("text-xs mt-3", isDark ? "text-zinc-500" : "text-gray-400")}>
                💡 Haz clic en un neumático para registrar una inspección
              </p>
            </div>

            {/* Summary Panel */}
            <div className="space-y-4">
              {vehicleAssignments.map(a => {
                const tire = a.tire;
                if (!tire) return null;
                const lastInsp = inspections.filter(i => i.tire_id === tire.id)
                  .sort((x, y) => new Date(y.inspection_date) - new Date(x.inspection_date))[0];
                const minTread = lastInsp ? Math.min(lastInsp.tread_depth_inner ?? 99, lastInsp.tread_depth_center ?? 99, lastInsp.tread_depth_outer ?? 99) : null;
                const isAlert = minTread !== null && minTread < 4;
                const isCritical = minTread !== null && minTread < 3;

                return (
                  <div key={a.id} className={cn(
                    "rounded-xl border p-4 cursor-pointer transition-all",
                    isCritical ? "border-red-500/50 bg-red-500/5" :
                    isAlert ? "border-yellow-500/50 bg-yellow-500/5" :
                    isDark ? "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50" : "border-gray-200 bg-white hover:bg-gray-50"
                  )} onClick={() => handleTireClick(a)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={cn("font-semibold text-sm", isDark ? "text-white" : "text-gray-900")}>
                          {tire.brand} {tire.model}
                        </p>
                        <p className={cn("text-xs", isDark ? "text-zinc-400" : "text-gray-500")}>{tire.size} · {a.position.replace(/_/g," ")}</p>
                      </div>
                      {isCritical && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">CRÍTICO</span>}
                      {isAlert && !isCritical && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">ALERTA</span>}
                    </div>
                    {lastInsp && (
                      <div className={cn("mt-2 text-xs grid grid-cols-3 gap-1", isDark ? "text-zinc-400" : "text-gray-500")}>
                        <span>Int: {lastInsp.tread_depth_inner ?? "–"}mm</span>
                        <span>Ctr: {lastInsp.tread_depth_center ?? "–"}mm</span>
                        <span>Ext: {lastInsp.tread_depth_outer ?? "–"}mm</span>
                      </div>
                    )}
                    {!lastInsp && (
                      <p className={cn("text-xs mt-1", isDark ? "text-zinc-500" : "text-gray-400")}>Sin inspección</p>
                    )}
                    <button
                      className={cn("mt-2 flex items-center gap-1 text-xs", isDark ? "text-yellow-400 hover:text-yellow-300" : "text-yellow-600 hover:text-yellow-700")}
                      onClick={e => { e.stopPropagation(); setSelectedAssignment(a); setShowInspDialog(true); }}
                    >
                      <ClipboardList className="w-3 h-3" /> Inspeccionar
                    </button>
                  </div>
                );
              })}
              {vehicleAssignments.length === 0 && (
                <div className={cn("rounded-xl border border-dashed p-8 text-center", isDark ? "border-zinc-700 text-zinc-500" : "border-gray-300 text-gray-400")}>
                  <p>No hay neumáticos montados en este vehículo</p>
                  <Button size="sm" onClick={() => setShowMountDialog(true)} className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-black">
                    Montar primer neumático
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <TireInspectionDialog
        open={showInspDialog}
        onOpenChange={setShowInspDialog}
        assignment={selectedAssignment}
        tire={selectedAssignment?.tire}
        vehicle={selectedVehicle}
        companyId={companyId || selectedAssignment?.company_id}
        inspectorName={currentUser?.full_name}
        onSave={async (data) => { await saveInspection.mutateAsync(data); }}
      />

      <TireAssignmentDialog
        open={showMountDialog}
        onOpenChange={setShowMountDialog}
        vehicles={accessibleVehicles}
        tires={stockTires}
        companyId={companyId}
        prefillVehicleId={selectedVehicleId}
        onSave={async (data) => { await saveAssignment.mutateAsync(data); }}
      />
    </div>
  );
}