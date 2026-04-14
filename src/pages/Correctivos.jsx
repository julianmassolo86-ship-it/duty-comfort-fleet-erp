import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, List } from "lucide-react";
import CorrectivoDialog from "@/components/maintenance/CorrectivoDialog";
import CorrectivosDashboard from "@/components/correctivos/CorrectivosDashboard";
import CorrectivosHistorial from "@/components/correctivos/CorrectivosHistorial";
import EditCorrectivoSparePartsDialog from "@/components/correctivos/EditCorrectivoSparePartsDialog";

export default function Correctivos() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCorrectivo, setSelectedCorrectivo] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isSuperAdmin = !currentUser?.company_id;

  const { data: allMaintenances = [], isLoading } = useQuery({
    queryKey: ["correctivos", currentUser?.company_id],
    queryFn: async () => {
      const all = await base44.entities.Maintenance.list("-completed_date");
      const correctivos = all.filter(m => m.type === "corrective");
      if (currentUser?.company_id) {
        return correctivos.filter(m => m.company_id === currentUser.company_id);
      }
      return correctivos;
    },
    enabled: !!currentUser,
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

  const { data: spareParts = [] } = useQuery({
    queryKey: ["spareParts"],
    queryFn: () => base44.entities.SparePart.list(),
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["correctivos"] });
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    setShowDialog(false);
    setSelectedCorrectivo(null);
  };

  return (
    <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === "dark" ? "bg-black" : "bg-gray-50")}>
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Mantenimientos Correctivos"
          description="Historial y seguimiento de correctivos de flota"
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
              <Button onClick={() => { setSelectedCorrectivo(null); setShowDialog(true); }}>
                + Nuevo Correctivo
              </Button>
            </div>
          }
        />

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : view === "dashboard" ? (
          <CorrectivosDashboard
            correctivos={allMaintenances}
            vehicles={vehicles}
            spareParts={spareParts}
          />
        ) : (
          <CorrectivosHistorial
            correctivos={allMaintenances}
            vehicles={vehicles}
            locations={locations}
            companies={isSuperAdmin ? companies : []}
            onEdit={(c) => { setSelectedCorrectivo(c); setShowDialog(true); }}
            isLoading={isLoading}
          />
        )}
      </div>

      <CorrectivoDialog
        open={showDialog && !selectedCorrectivo}
        onOpenChange={(open) => { setShowDialog(open); if (!open) setSelectedCorrectivo(null); }}
        initialNovedad={null}
        onSuccess={handleSuccess}
      />

      <EditCorrectivoSparePartsDialog
        open={showDialog && !!selectedCorrectivo}
        onOpenChange={(open) => { setShowDialog(open); if (!open) setSelectedCorrectivo(null); }}
        correctivo={selectedCorrectivo}
        onSuccess={handleSuccess}
      />
    </div>
  );
}