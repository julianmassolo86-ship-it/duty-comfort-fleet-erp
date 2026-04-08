import React, { useState, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ThemeContextValue } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, ArrowUpDown, TrendingUp, TrendingDown, RefreshCw, RotateCcw } from "lucide-react";
import { format } from "date-fns";

const TYPE_CONFIG = {
  entrada: { label: "Entrada", icon: TrendingUp, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  egreso: { label: "Egreso", icon: TrendingDown, color: "bg-red-500/10 text-red-400 border-red-500/20" },
  ajuste: { label: "Ajuste", icon: RefreshCw, color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  devolucion: { label: "Devolución", icon: RotateCcw, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};
const ORIGIN_LABELS = { remito_compra: "Remito de Compra", orden_trabajo: "Orden de Trabajo", ajuste_manual: "Ajuste Manual", devolucion: "Devolución" };

function StockMovementDialog({ open, onClose, companyId, spareParts, currentUser }) {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ type: "ajuste", spare_part_id: "", quantity: 1, date: new Date().toISOString().split("T")[0], origin: "ajuste_manual", reference_number: "", notes: "" });

  React.useEffect(() => { setForm({ type: "ajuste", spare_part_id: "", quantity: 1, date: new Date().toISOString().split("T")[0], origin: "ajuste_manual", reference_number: "", notes: "" }); }, [open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke("confirmDeliveryNote", { action: "manual_adjustment", ...data, company_id: companyId, user_name: currentUser?.full_name || currentUser?.email }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["stock-movements"] }); queryClient.invalidateQueries({ queryKey: ["spare-parts"] }); onClose(); },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-md", isDark ? "bg-zinc-900 border-zinc-700" : "")}>
        <DialogHeader>
          <DialogTitle className={isDark ? "text-white" : ""}>Registrar Movimiento de Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className={isDark ? "text-zinc-300" : ""}>Repuesto *</Label>
            <Select value={form.spare_part_id} onValueChange={v => set("spare_part_id", v)}>
              <SelectTrigger className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")}>
                <SelectValue placeholder="Seleccionar repuesto" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                {spareParts.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className={isDark ? "text-zinc-300" : ""}>Tipo *</Label>
              <Select value={form.type} onValueChange={v => set("type", v)}>
                <SelectTrigger className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="egreso">Egreso</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                  <SelectItem value="devolucion">Devolución</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={isDark ? "text-zinc-300" : ""}>Cantidad *</Label>
              <Input type="number" value={form.quantity} onChange={e => set("quantity", parseFloat(e.target.value) || 0)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} min="0.01" step="0.01" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className={isDark ? "text-zinc-300" : ""}>Fecha *</Label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} />
            </div>
            <div>
              <Label className={isDark ? "text-zinc-300" : ""}>Origen</Label>
              <Select value={form.origin} onValueChange={v => set("origin", v)}>
                <SelectTrigger className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                  <SelectItem value="ajuste_manual">Ajuste Manual</SelectItem>
                  <SelectItem value="orden_trabajo">Orden de Trabajo</SelectItem>
                  <SelectItem value="devolucion">Devolución</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className={isDark ? "text-zinc-300" : ""}>Referencia</Label>
            <Input value={form.reference_number} onChange={e => set("reference_number", e.target.value)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} placeholder="N° de OT, referencia, etc." />
          </div>
          <div>
            <Label className={isDark ? "text-zinc-300" : ""}>Notas</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className={isDark ? "border-zinc-600 text-zinc-300" : ""}>Cancelar</Button>
          <Button onClick={() => saveMutation.mutate(form)} disabled={!form.spare_part_id || !form.quantity || saveMutation.isPending} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
            {saveMutation.isPending ? "Registrando..." : "Registrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function StockMovements() {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const isSuperAdmin = !user?.company_id || user?.user_role === "super_admin";
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const companyId = isSuperAdmin ? selectedCompanyId : user?.company_id;

  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list(), enabled: isSuperAdmin });
  const { data: spareParts = [] } = useQuery({ queryKey: ["spare-parts", companyId], queryFn: () => companyId ? base44.entities.SparePart.filter({ company_id: companyId, is_active: true }) : base44.entities.SparePart.filter({ is_active: true }), enabled: !!user });
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["stock-movements", companyId],
    queryFn: () => companyId ? base44.entities.StockMovement.filter({ company_id: companyId }, "-date") : base44.entities.StockMovement.list("-date"),
    enabled: !!user,
  });

  const canManage = user?.role === "admin" || user?.user_role === "super_admin" || user?.user_role === "almacen_admin";

  const filtered = movements.filter(m => {
    const sp = spareParts.find(s => s.id === m.spare_part_id);
    const matchSearch = !search || sp?.name?.toLowerCase().includes(search.toLowerCase()) || m.reference_number?.includes(search);
    const matchType = filterType === "all" || m.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className={cn("min-h-screen p-4 md:p-6", isDark ? "bg-black" : "bg-gray-50")}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>Movimientos de Stock</h1>
          <p className={cn("text-sm mt-1", isDark ? "text-zinc-400" : "text-gray-500")}>{movements.length} movimiento{movements.length !== 1 ? "s" : ""} registrado{movements.length !== 1 ? "s" : ""}</p>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" /> Registrar Movimiento
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {isSuperAdmin && (
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className={cn("w-full sm:w-48", isDark ? "bg-zinc-900 border-zinc-700 text-white" : "")}>
              <SelectValue placeholder="Todas las empresas" />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
              <SelectItem value={null}>Todas las empresas</SelectItem>
              {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="relative flex-1">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-zinc-500" : "text-gray-400")} />
          <Input className={cn("pl-9", isDark ? "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500" : "")} placeholder="Buscar por repuesto o referencia..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className={cn("w-full sm:w-40", isDark ? "bg-zinc-900 border-zinc-700 text-white" : "")}>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="egreso">Egreso</SelectItem>
            <SelectItem value="ajuste">Ajuste</SelectItem>
            <SelectItem value="devolucion">Devolución</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className={cn("h-16 rounded-xl animate-pulse", isDark ? "bg-zinc-900" : "bg-gray-200")} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <ArrowUpDown className={cn("w-12 h-12", isDark ? "text-zinc-700" : "text-gray-300")} />
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-gray-400")}>No hay movimientos de stock</p>
        </div>
      ) : (
        <div className={cn("rounded-xl border overflow-hidden", isDark ? "border-zinc-800" : "border-gray-200")}>
          <table className="w-full">
            <thead>
              <tr className={cn("text-xs border-b", isDark ? "bg-zinc-900/50 text-zinc-500 border-zinc-800" : "bg-gray-50 text-gray-500 border-gray-200")}>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Repuesto</th>
                <th className="text-right px-4 py-3">Cantidad</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Origen</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Referencia</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const sp = spareParts.find(s => s.id === m.spare_part_id);
                const cfg = TYPE_CONFIG[m.type] || TYPE_CONFIG.ajuste;
                const Icon = cfg.icon;
                return (
                  <tr key={m.id} className={cn("text-sm border-b transition-colors", isDark ? "border-zinc-800/50 hover:bg-zinc-900/50" : "border-gray-100 hover:bg-gray-50", i % 2 === 0 ? "" : (isDark ? "bg-zinc-900/20" : "bg-gray-50/50"))}>
                    <td className={cn("px-4 py-3", isDark ? "text-zinc-400" : "text-gray-600")}>{m.date ? format(new Date(m.date), "dd/MM/yyyy") : "-"}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-xs border flex items-center gap-1 w-fit", cfg.color)}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </Badge>
                    </td>
                    <td className={cn("px-4 py-3 font-medium", isDark ? "text-white" : "text-gray-900")}>{sp?.name || m.spare_part_id || "-"}</td>
                    <td className={cn("px-4 py-3 text-right font-mono font-semibold", m.type === "egreso" ? "text-red-400" : "text-emerald-400")}>
                      {m.type === "egreso" ? "-" : "+"}{m.quantity}
                    </td>
                    <td className={cn("px-4 py-3 hidden md:table-cell", isDark ? "text-zinc-400" : "text-gray-600")}>{ORIGIN_LABELS[m.origin] || m.origin || "-"}</td>
                    <td className={cn("px-4 py-3 hidden lg:table-cell", isDark ? "text-zinc-400" : "text-gray-600")}>{m.reference_number || "-"}</td>
                    <td className={cn("px-4 py-3 hidden lg:table-cell", isDark ? "text-zinc-500" : "text-gray-500")}>{m.user_name || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <StockMovementDialog open={dialogOpen} onClose={() => setDialogOpen(false)} companyId={companyId || user?.company_id} spareParts={spareParts} currentUser={user} />
    </div>
  );
}