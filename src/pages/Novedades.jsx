import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, List } from "lucide-react";
import NovedadDialog from "@/components/novedades/NovedadDialog";
import NuevaNovedadDialog from "@/components/novedades/NuevaNovedadDialog";
import EditNovedadDialog from "@/components/novedades/EditNovedadDialog";
import CorrectivoDialog from "@/components/maintenance/CorrectivoDialog";
import NovedadesDashboard from "@/components/novedades/NovedadesDashboard";
import NovedadesHistorial from "@/components/novedades/NovedadesHistorial";


export default function Novedades() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedNovedad, setSelectedNovedad] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showNuevaNovedadDialog, setShowNuevaNovedadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCorrectivoDialog, setShowCorrectivoDialog] = useState(false);
  const [correctivoNovedad, setCorretivoNovedad] = useState(null);
  const [view, setView] = useState("dashboard");

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isSuperAdmin = !currentUser?.company_id;

  const { data: novedades = [], isLoading } = useQuery({
    queryKey: ["novedades"],
    queryFn: () => base44.entities.Novedad.list("-fecha_reporte"),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => base44.entities.Location.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
    enabled: isSuperAdmin,
  });

  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ["vehicleTypes"],
    queryFn: () => base44.entities.VehicleType.list(),
  });

  const accessibleNovedades = isSuperAdmin
    ? novedades
    : novedades.filter(n => n.company_id === currentUser?.company_id);

  const handleNovedadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["novedades"] });
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    setShowEditDialog(false);
    setSelectedNovedad(null);
  };

  const handleOpenCorrectivo = (novedad) => {
    setCorretivoNovedad(novedad);
    setShowCorrectivoDialog(true);
  };

  const handleSave = async (data) => {
    if (selectedNovedad) {
      await base44.entities.Novedad.update(selectedNovedad.id, data);
    } else {
      await base44.entities.Novedad.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ["novedades"] });
    setShowDialog(false);
    setSelectedNovedad(null);
  };

  return (
    <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === "dark" ? "bg-black" : "bg-gray-50")}>
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Novedades"
          description="Gestión de novedades reportadas"
          actions={
            <div className="flex items-center gap-2">
              <div className={cn("flex rounded-xl border p-1 gap-1", theme === "dark" ? "border-zinc-700 bg-zinc-900" : "border-gray-200 bg-gray-100")}>
                <button
                  onClick={() => setView("dashboard")}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    view === "dashboard"
                      ? (theme === "dark" ? "bg-yellow-500/20 text-yellow-400" : "bg-white text-yellow-600 shadow-sm")
                      : (theme === "dark" ? "text-zinc-400 hover:text-white" : "text-gray-500 hover:text-gray-900")
                  )}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </button>
                <button
                  onClick={() => setView("list")}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    view === "list"
                      ? (theme === "dark" ? "bg-yellow-500/20 text-yellow-400" : "bg-white text-yellow-600 shadow-sm")
                      : (theme === "dark" ? "text-zinc-400 hover:text-white" : "text-gray-500 hover:text-gray-900")
                  )}
                >
                  <List className="w-3.5 h-3.5" /> Lista
                </button>
              </div>
              <Button variant="outline" onClick={() => { setCorretivoNovedad(null); setShowCorrectivoDialog(true); }}
                className={cn(theme === "dark" ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "")}>
                + Correctivo
              </Button>
              <Button onClick={() => setShowNuevaNovedadDialog(true)}>
                + Nueva Novedad
              </Button>
            </div>
          }
        />

        {/* Dashboard view */}
        {view === "dashboard" && isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto" />
          </div>
        )}
        {view === "dashboard" && !isLoading && (
          <div className="mb-6">
            <NovedadesDashboard novedades={accessibleNovedades} vehicles={vehicles} />
          </div>
        )}

        {/* Historial con filtros avanzados */}
        {view === "list" && (
          <NovedadesHistorial
            novedades={accessibleNovedades}
            vehicles={vehicles}
            locations={locations}
            companies={companies}
            vehicleTypes={vehicleTypes}
            onEdit={(n) => { setSelectedNovedad(n); setShowEditDialog(true); }}
            isLoading={isLoading}
          />
        )}
      </div>

      <NovedadDialog
        open={showDialog}
        onOpenChange={(open) => { setShowDialog(open); if (!open) setSelectedNovedad(null); }}
        novedad={selectedNovedad}
        onSave={handleSave}
      />

      <NuevaNovedadDialog
        open={showNuevaNovedadDialog}
        onOpenChange={setShowNuevaNovedadDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["novedades"] });
          setShowNuevaNovedadDialog(false);
        }}
      />

      <EditNovedadDialog
        open={showEditDialog}
        onOpenChange={(open) => { setShowEditDialog(open); if (!open) setSelectedNovedad(null); }}
        novedad={selectedNovedad}
        vehicle={selectedNovedad ? vehicles.find(v => v.id === selectedNovedad.vehicle_id) : null}
        onSuccess={handleNovedadSuccess}
        onOpenCorrectivo={handleOpenCorrectivo}
      />

      <CorrectivoDialog
        open={showCorrectivoDialog}
        onOpenChange={(open) => { setShowCorrectivoDialog(open); if (!open) setCorretivoNovedad(null); }}
        initialNovedad={correctivoNovedad}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["novedades"] });
          queryClient.invalidateQueries({ queryKey: ["vehicles"] });
          setShowCorrectivoDialog(false);
          setCorretivoNovedad(null);
        }}
      />
    </div>
  );
}