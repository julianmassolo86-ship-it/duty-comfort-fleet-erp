import React, { useState, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ThemeContextValue } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Package, AlertTriangle } from "lucide-react";
import SparePartCard from "@/components/inventory/SparePartCard";
import SparePartDialog from "@/components/inventory/SparePartDialog";

export default function Inventory() {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState("all");
  const [filterUnit, setFilterUnit] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const isSuperAdmin = !user?.company_id || user?.user_role === "super_admin";

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
    enabled: isSuperAdmin,
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const companyId = isSuperAdmin ? selectedCompanyId : user?.company_id;

  const { data: spareParts = [], isLoading } = useQuery({
    queryKey: ["spare-parts", companyId],
    queryFn: () =>
      companyId
        ? base44.entities.SparePart.filter({ company_id: companyId, is_active: true })
        : base44.entities.SparePart.filter({ is_active: true }),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SparePart.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spare-parts"] });
      setDeleting(null);
    },
  });

  const handleDialogClose = (refreshed) => {
    setDialogOpen(false);
    setEditing(null);
    if (refreshed) queryClient.invalidateQueries({ queryKey: ["spare-parts"] });
  };

  const handleEdit = (sp) => {
    setEditing(sp);
    setDialogOpen(true);
  };

  const filtered = spareParts.filter((sp) => {
    const matchSearch =
      !search ||
      sp.name?.toLowerCase().includes(search.toLowerCase()) ||
      sp.part_number?.toLowerCase().includes(search.toLowerCase()) ||
      sp.manufacturer?.toLowerCase().includes(search.toLowerCase());

    const matchUnit = filterUnit === "all" || sp.unit_of_measure === filterUnit;

    const matchStock =
      filterStock === "all"
        ? true
        : filterStock === "low"
        ? sp.stock_quantity <= sp.minimum_stock && sp.minimum_stock > 0
        : filterStock === "out"
        ? sp.stock_quantity === 0
        : true;

    return matchSearch && matchUnit && matchStock;
  });

  const lowStockCount = spareParts.filter(
    (sp) => sp.stock_quantity <= sp.minimum_stock && sp.minimum_stock > 0
  ).length;

  const outOfStockCount = spareParts.filter((sp) => sp.stock_quantity === 0).length;

  return (
    <div className={cn("min-h-screen p-4 md:p-6", isDark ? "bg-black" : "bg-gray-50")}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
            Inventario de Repuestos
          </h1>
          <p className={cn("text-sm mt-1", isDark ? "text-zinc-400" : "text-gray-500")}>
            {spareParts.length} repuesto{spareParts.length !== 1 ? "s" : ""} registrado{spareParts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Repuesto
        </Button>
      </div>

      {/* Alert Banners */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="flex flex-wrap gap-3 mb-5">
          {outOfStockCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{outOfStockCount} repuesto{outOfStockCount > 1 ? "s" : ""} sin stock</span>
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{lowStockCount} repuesto{lowStockCount > 1 ? "s" : ""} con stock bajo</span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {isSuperAdmin && (
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className={cn("w-full sm:w-48", isDark ? "bg-zinc-900 border-zinc-700 text-white" : "")}>
              <SelectValue placeholder="Todas las empresas" />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
              <SelectItem value={null}>Todas las empresas</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="relative flex-1">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-zinc-500" : "text-gray-400")} />
          <Input
            className={cn("pl-9", isDark ? "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500" : "")}
            placeholder="Buscar por nombre, N° pieza, fabricante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={filterUnit} onValueChange={setFilterUnit}>
          <SelectTrigger className={cn("w-full sm:w-36", isDark ? "bg-zinc-900 border-zinc-700 text-white" : "")}>
            <SelectValue placeholder="Unidad" />
          </SelectTrigger>
          <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
            <SelectItem value="all">Todas las UDM</SelectItem>
            <SelectItem value="UNID">UNID</SelectItem>
            <SelectItem value="LITROS">LITROS</SelectItem>
            <SelectItem value="METROS">METROS</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStock} onValueChange={setFilterStock}>
          <SelectTrigger className={cn("w-full sm:w-40", isDark ? "bg-zinc-900 border-zinc-700 text-white" : "")}>
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
            <SelectItem value="all">Todo el stock</SelectItem>
            <SelectItem value="out">Sin stock</SelectItem>
            <SelectItem value="low">Stock bajo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={cn("h-40 rounded-xl animate-pulse", isDark ? "bg-zinc-900" : "bg-gray-200")} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Package className={cn("w-12 h-12", isDark ? "text-zinc-700" : "text-gray-300")} />
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-gray-400")}>
            {search ? "No se encontraron repuestos" : "No hay repuestos registrados"}
          </p>
          {!search && (
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }} variant="outline" size="sm" className={isDark ? "border-zinc-700 text-zinc-300" : ""}>
              <Plus className="w-4 h-4 mr-1" /> Agregar repuesto
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((sp) => (
            <SparePartCard
              key={sp.id}
              sparePart={sp}
              onEdit={handleEdit}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      <SparePartDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        sparePart={editing}
        companyId={companyId || (isSuperAdmin ? selectedCompanyId : user?.company_id)}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className={isDark ? "bg-zinc-900 border-zinc-700" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isDark ? "text-white" : ""}>¿Eliminar repuesto?</AlertDialogTitle>
            <AlertDialogDescription className={isDark ? "text-zinc-400" : ""}>
              Esta acción desactivará el repuesto "{deleting?.name}". No podrás deshacerlo fácilmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={isDark ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800" : ""}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteMutation.mutate(deleting.id)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}