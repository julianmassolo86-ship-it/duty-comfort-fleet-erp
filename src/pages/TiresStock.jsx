import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, History } from "lucide-react";
import TireDialog from "@/components/tires/TireDialog";
import TireEventDialog from "@/components/tires/TireEventDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const STATUS_BADGE = {
  en_stock:      { label: "En Stock",       className: "bg-green-500/20 text-green-400 border-green-500/30" },
  montado:       { label: "Montado",         className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  en_reparacion: { label: "En Reparación",   className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  recapando:     { label: "Recapando",       className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  de_baja:       { label: "De Baja",         className: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const TYPE_LABEL = { directriz: "Directriz", traccion: "Tracción", remolque: "Remolque", all_terrain: "All-Terrain" };

export default function TiresStock() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const qc = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editTire, setEditTire] = useState(null);
  const [prefillTireId, setPrefillTireId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);
  const isSuperAdmin = !currentUser?.company_id;
  const companyId = currentUser?.company_id;

  const { data: tires = [], isLoading } = useQuery({
    queryKey: ["tires"],
    queryFn: () => base44.entities.Tire.list(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const saveTire = useMutation({
    mutationFn: (data) => data.id ? base44.entities.Tire.update(data.id, data) : base44.entities.Tire.create({ ...data, company_id: data.company_id || companyId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tires"] }),
  });

  const saveEvent = useMutation({
    mutationFn: (data) => base44.entities.TireEvent.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tireEvents"] }),
  });

  const deleteTire = useMutation({
    mutationFn: (id) => base44.entities.Tire.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tires"] }),
  });

  const accessibleTires = isSuperAdmin ? tires : tires.filter(t => t.company_id === companyId);

  const filtered = accessibleTires.filter(t => {
    const matchSearch = !search || [t.brand, t.model, t.size, t.serial_number, t.supplier].some(
      f => f?.toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const cardBg = isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-gray-200";

  return (
    <div className={cn("min-h-screen p-4 sm:p-6", isDark ? "bg-black" : "bg-gray-50")}>
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Stock de Neumáticos" description="Gestión del inventario de neumáticos" />

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-zinc-500" : "text-gray-400")} />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por marca, serie, medida..."
              className={cn("pl-9", isDark ? "bg-zinc-900 border-zinc-700" : "")} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className={cn("px-3 py-2 rounded-lg border text-sm", isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-gray-300 text-gray-900")}>
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_BADGE).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <Button onClick={() => { setEditTire(null); setShowDialog(true); }} className="bg-yellow-500 hover:bg-yellow-600 text-black gap-2">
            <Plus className="w-4 h-4" /> Nuevo Neumático
          </Button>
        </div>

        {/* Summary badges */}
        <div className="flex gap-3 flex-wrap mb-6">
          {Object.entries(STATUS_BADGE).map(([status, { label, className }]) => {
            const count = accessibleTires.filter(t => t.status === status).length;
            if (count === 0) return null;
            return (
              <div key={status} className={cn("px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer", className,
                statusFilter === status ? "ring-2 ring-offset-1" : ""
              )} onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}>
                {label}: {count}
              </div>
            );
          })}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className={cn("rounded-2xl border p-8 text-center", cardBg, isDark ? "text-zinc-500" : "text-gray-400")}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className={cn("rounded-2xl border border-dashed p-12 text-center", isDark ? "border-zinc-700 text-zinc-500" : "border-gray-300 text-gray-400")}>
            No se encontraron neumáticos
          </div>
        ) : (
          <div className={cn("rounded-2xl border overflow-hidden", cardBg)}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn("border-b", isDark ? "border-zinc-800 bg-zinc-900/50" : "border-gray-200 bg-gray-50")}>
                    {["Serie", "Marca / Modelo", "Medida", "Tipo", "Estado", "Km Acum.", "Vida útil", "Costo/km", "Acciones"].map(h => (
                      <th key={h} className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider",
                        isDark ? "text-zinc-400" : "text-gray-500")}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={cn("divide-y", isDark ? "divide-zinc-800" : "divide-gray-100")}>
                  {filtered.map(t => {
                    const statusInfo = STATUS_BADGE[t.status] || STATUS_BADGE.en_stock;
                    const lifeUsedPct = t.estimated_lifespan_km && t.total_km ? Math.min(100, (t.total_km / t.estimated_lifespan_km) * 100) : null;
                    const costPerKm = t.total_km > 0 && t.purchase_cost ? (t.purchase_cost / t.total_km).toFixed(2) : "–";
                    return (
                      <tr key={t.id} className={cn("transition-colors", isDark ? "hover:bg-zinc-800/30" : "hover:bg-gray-50")}>
                        <td className={cn("px-4 py-3 font-mono text-xs", isDark ? "text-zinc-300" : "text-gray-700")}>{t.serial_number}</td>
                        <td className={cn("px-4 py-3", isDark ? "text-white" : "text-gray-900")}>
                          <p className="font-semibold">{t.brand}</p>
                          <p className={cn("text-xs", isDark ? "text-zinc-400" : "text-gray-500")}>{t.model || "–"}</p>
                        </td>
                        <td className={cn("px-4 py-3", isDark ? "text-zinc-300" : "text-gray-700")}>{t.size}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-xs", isDark ? "text-zinc-400" : "text-gray-500")}>{TYPE_LABEL[t.tire_type] || "–"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full border text-xs font-semibold", statusInfo.className)}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className={cn("px-4 py-3", isDark ? "text-zinc-300" : "text-gray-700")}>
                          {t.total_km?.toLocaleString() ?? "0"} km
                        </td>
                        <td className="px-4 py-3">
                          {lifeUsedPct !== null ? (
                            <div className="flex items-center gap-2">
                              <div className={cn("flex-1 h-1.5 rounded-full", isDark ? "bg-zinc-700" : "bg-gray-200")}>
                                <div className={cn("h-full rounded-full", lifeUsedPct > 90 ? "bg-red-500" : lifeUsedPct > 70 ? "bg-yellow-500" : "bg-green-500")}
                                  style={{ width: `${lifeUsedPct}%` }} />
                              </div>
                              <span className={cn("text-xs w-8", isDark ? "text-zinc-400" : "text-gray-500")}>{Math.round(lifeUsedPct)}%</span>
                            </div>
                          ) : <span className={cn("text-xs", isDark ? "text-zinc-600" : "text-gray-400")}>–</span>}
                        </td>
                        <td className={cn("px-4 py-3 text-xs", isDark ? "text-zinc-300" : "text-gray-700")}>${costPerKm}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditTire(t); setShowDialog(true); }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-yellow-500 hover:text-yellow-400"
                              onClick={() => { setPrefillTireId(t.id); setShowEventDialog(true); }}>
                              <History className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-red-400 hover:text-red-300"
                              onClick={() => setDeleteId(t.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <TireDialog open={showDialog} onOpenChange={setShowDialog} tire={editTire} companyId={companyId}
        onSave={async (data) => { await saveTire.mutateAsync(data); }} />

      <TireEventDialog open={showEventDialog} onOpenChange={setShowEventDialog} tires={accessibleTires}
        vehicles={vehicles} prefillTireId={prefillTireId} companyId={companyId}
        onSave={async (data) => { await saveEvent.mutateAsync(data); }} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className={isDark ? "bg-zinc-900 border-zinc-800 text-white" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar neumático?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => { deleteTire.mutate(deleteId); setDeleteId(null); }}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}