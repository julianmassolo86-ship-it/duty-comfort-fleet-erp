import { useState, useContext, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ThemeContextValue } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Package, AlertTriangle } from "lucide-react";
import SparePartCard from "@/components/inventory/SparePartCard";
import SparePartDialog from "@/components/inventory/SparePartDialog";
import SparePartMovementsHistory from "@/components/inventory/SparePartMovementsHistory";

export default function Inventory() {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSparePart, setEditingSparePart] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [historyPart, setHistoryPart] = useState(null);

  const [user, setUser] = useState(null);
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const companyId = user?.company_id || "";

  const { data: sparePartsRaw = [] } = useQuery({
    queryKey: ["spare-parts", companyId],
    queryFn: () =>
      companyId
        ? base44.entities.SparePart.filter({ company_id: companyId, is_active: true })
        : base44.entities.SparePart.list(),
    enabled: !!user,
  });

  const spareParts = Array.isArray(sparePartsRaw) ? sparePartsRaw : [];
  const isLoading = !user;

  const handleDialogClose = (saved) => {
    setDialogOpen(false);
    setEditingSparePart(null);
    if (saved) queryClient.invalidateQueries({ queryKey: ["spare-parts"] });
  };

  const handleEdit = (part) => {
    setEditingSparePart(part);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await base44.entities.SparePart.update(deleting.id, { is_active: false });
    queryClient.invalidateQueries({ queryKey: ["spare-parts"] });
    setDeleting(null);
  };

  const filtered = spareParts.filter((p) => {
    if (!p || !p.id) return false;

    const matchSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.part_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.alternative_part_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.manufacturer?.toLowerCase().includes(search.toLowerCase());

    const isLow = p.stock_quantity <= p.minimum_stock && p.minimum_stock > 0;
    const isOut = p.stock_quantity === 0;

    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "low" && isLow && !isOut) ||
      (filterStatus === "out" && isOut) ||
      (filterStatus === "ok" && !isLow && !isOut);

    return matchSearch && matchStatus;
  });

  const lowStockCount = spareParts.filter(
    (p) => p.stock_quantity <= p.minimum_stock && p.minimum_stock > 0 && p.stock_quantity > 0
  ).length;
  const outOfStockCount = spareParts.filter((p) => p.stock_quantity === 0).length;

  const filterBtns = [
    { key: "all", label: "Todos" },
    { key: "ok", label: "En Stock" },
    { key: "low", label: `Stock Bajo${lowStockCount ? ` (${lowStockCount})` : ""}` },
    { key: "out", label: `Sin Stock${outOfStockCount ? ` (${outOfStockCount})` : ""}` },
  ];

  return (
    <div className={cn("min-h-screen p-4 md:p-6", isDark ? "bg-black" : "bg-gray-50")}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
            Repuestos
          </h1>
          <p className={cn("text-sm mt-0.5", isDark ? "text-zinc-500" : "text-gray-500")}>
            {spareParts.length} repuestos en inventario
          </p>
        </div>
        <Button
          onClick={() => { setEditingSparePart(null); setDialogOpen(true); }}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuevo
        </Button>
      </div>

      {/* Alerts */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className={cn("rounded-xl p-3 mb-4 flex items-center gap-3 border", isDark ? "bg-yellow-500/10 border-yellow-500/20" : "bg-yellow-50 border-yellow-200")}>
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
          <p className={cn("text-sm", isDark ? "text-yellow-300" : "text-yellow-800")}>
            {outOfStockCount > 0 && <span><strong>{outOfStockCount}</strong> sin stock. </span>}
            {lowStockCount > 0 && <span><strong>{lowStockCount}</strong> con stock bajo.</span>}
          </p>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-zinc-500" : "text-gray-400")} />
          <Input
            className={cn("pl-9", isDark ? "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500" : "")}
            placeholder="Buscar por nombre, número de pieza..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filterBtns.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilterStatus(btn.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                filterStatus === btn.key
                  ? isDark
                    ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                    : "bg-yellow-500/10 border-yellow-500/30 text-yellow-700"
                  : isDark
                  ? "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:text-gray-900"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={cn("h-40 rounded-xl animate-pulse", isDark ? "bg-zinc-900" : "bg-gray-100")} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Package className={cn("w-12 h-12", isDark ? "text-zinc-700" : "text-gray-300")} />
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-gray-400")}>
            {search || filterStatus !== "all" ? "No se encontraron repuestos con esos filtros" : "No hay repuestos registrados"}
          </p>
          {!search && filterStatus === "all" && (
            <Button
              size="sm"
              onClick={() => { setEditingSparePart(null); setDialogOpen(true); }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold mt-1"
            >
              <Plus className="w-4 h-4 mr-1" /> Agregar Repuesto
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.filter(part => part?.id).map((part) => (
            <SparePartCard
              key={part.id}
              sparePart={part}
              onEdit={handleEdit}
              onDelete={(p) => setDeleting(p)}
              onViewHistory={(p) => setHistoryPart(p)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {dialogOpen && (
        <SparePartDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          sparePart={editingSparePart}
          companyId={companyId}
        />
      )}

      {/* Delete Confirmation */}
      {deleting ? (
        <AlertDialog open={true} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
          <AlertDialogContent className={isDark ? "bg-zinc-900 border-zinc-700" : ""}>
            <AlertDialogHeader>
              <AlertDialogTitle className={isDark ? "text-white" : ""}>¿Eliminar repuesto?</AlertDialogTitle>
              <AlertDialogDescription className={isDark ? "text-zinc-400" : ""}>
                Se desactivará <strong>{deleting.name}</strong>. Esta acción se puede revertir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className={isDark ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800" : ""}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      {/* History Dialog */}
      {historyPart ? (
        <Dialog open={true} onOpenChange={(o) => { if (!o) setHistoryPart(null); }}>
          <DialogContent className={cn("max-w-3xl max-h-[90vh] overflow-y-auto", isDark ? "bg-zinc-900 border-zinc-700" : "")}>
            <DialogHeader>
              <DialogTitle className={isDark ? "text-white" : ""}>
                Historial de Movimientos — {historyPart.name}
              </DialogTitle>
            </DialogHeader>
            <SparePartMovementsHistory sparePartId={historyPart.id} />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}