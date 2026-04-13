import React, { useState, useEffect, useContext, useRef } from "react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, ShoppingCart, Trash2, Edit2, X, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  borrador: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  aprobada: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  recibida: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelada: "bg-red-500/10 text-red-400 border-red-500/20",
};

function SparePartSearch({ value, spareParts, onChange, isDark }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = spareParts.find(s => s.id === value);
  const filtered = spareParts.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.part_number?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50);

  React.useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch(""); }}
        className={cn(
          "w-full h-8 text-xs px-2 text-left rounded-md border flex items-center justify-between",
          isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-white border-gray-300 text-gray-900"
        )}
      >
        <span className={selected ? "" : (isDark ? "text-zinc-500" : "text-gray-400")}>
          {selected ? selected.name : "Seleccionar repuesto..."}
        </span>
        <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className={cn(
          "absolute z-50 top-full mt-1 left-0 right-0 rounded-md border shadow-lg",
          isDark ? "bg-zinc-800 border-zinc-700" : "bg-white border-gray-200"
        )}>
          <div className="p-1.5 border-b" style={{ borderColor: isDark ? "#3f3f46" : "#e5e7eb" }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o N° de parte..."
              className={cn(
                "w-full text-xs px-2 py-1 rounded outline-none",
                isDark ? "bg-zinc-700 text-white placeholder:text-zinc-500" : "bg-gray-100 text-gray-900 placeholder:text-gray-400"
              )}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className={cn("text-xs text-center py-3", isDark ? "text-zinc-500" : "text-gray-400")}>
                {spareParts.length === 0 ? "No hay repuestos cargados" : "Sin resultados"}
              </p>
            ) : filtered.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => { onChange(s.id); setOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 hover:opacity-80 transition-colors",
                  value === s.id ? (isDark ? "bg-yellow-500/20 text-yellow-300" : "bg-yellow-50 text-yellow-700") :
                  (isDark ? "text-zinc-200 hover:bg-zinc-700" : "text-gray-800 hover:bg-gray-50")
                )}
              >
                <span className="font-medium truncate">{s.name}</span>
                <span className={cn("shrink-0", isDark ? "text-zinc-500" : "text-gray-400")}>
                  {s.part_number && <span className="mr-2">{s.part_number}</span>}
                  {s.unit_cost ? `$${s.unit_cost}` : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PurchaseOrderDialog({ open, onClose, order, companyId, suppliers, spareParts }) {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const emptyForm = { supplier_id: "", date: new Date().toISOString().split("T")[0], status: "borrador", items: [], total: 0, notes: "" };
  const [form, setForm] = useState(order || emptyForm);

  React.useEffect(() => { setForm(order || emptyForm); }, [order, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addItem = () => setForm(f => ({ ...f, items: [...(f.items || []), { spare_part_id: "", spare_part_name: "", quantity: 1, unit_price: 0, subtotal: 0 }] }));

  const updateItem = (idx, key, val) => {
    setForm(f => {
      const items = [...(f.items || [])];
      items[idx] = { ...items[idx], [key]: val };
      if (key === "spare_part_id") {
        const sp = spareParts.find(s => s.id === val);
        items[idx].spare_part_name = sp?.name || "";
        items[idx].unit_price = sp?.unit_cost || 0;
      }
      const qty = key === "quantity" ? parseFloat(val) || 0 : parseFloat(items[idx].quantity) || 0;
      const price = key === "unit_price" ? parseFloat(val) || 0 : parseFloat(items[idx].unit_price) || 0;
      items[idx].subtotal = qty * price;
      const total = items.reduce((s, it) => s + (it.subtotal || 0), 0);
      return { ...f, items, total };
    });
  };

  const removeItem = (idx) => setForm(f => {
    const items = f.items.filter((_, i) => i !== idx);
    return { ...f, items, total: items.reduce((s, it) => s + (it.subtotal || 0), 0) };
  });

  const saveMutation = useMutation({
    mutationFn: (data) => order ? base44.entities.PurchaseOrder.update(order.id, data) : base44.entities.PurchaseOrder.create({ ...data, company_id: companyId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }); onClose(); },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", isDark ? "bg-zinc-900 border-zinc-700" : "")}>
        <DialogHeader>
          <DialogTitle className={isDark ? "text-white" : ""}>{order ? `OC ${order.order_number}` : "Nueva Orden de Compra"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className={isDark ? "text-zinc-300" : ""}>Proveedor *</Label>
              <Select value={form.supplier_id} onValueChange={v => set("supplier_id", v)}>
                <SelectTrigger className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")}>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={isDark ? "text-zinc-300" : ""}>Fecha *</Label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} />
            </div>
            <div>
              <Label className={isDark ? "text-zinc-300" : ""}>Estado</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="aprobada">Aprobada</SelectItem>
                  <SelectItem value="recibida">Recibida</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className={isDark ? "text-zinc-300" : ""}>Ítems</Label>
              <Button size="sm" variant="outline" onClick={addItem} className={cn("h-7 text-xs", isDark ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800" : "")}>
                <Plus className="w-3 h-3 mr-1" /> Agregar ítem
              </Button>
            </div>
            {spareParts.length === 0 && (
              <p className={cn("text-xs mb-2 p-2 rounded border", isDark ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-amber-700 bg-amber-50 border-amber-200")}>
                ⚠ No hay repuestos cargados para esta empresa. Primero creá los repuestos en el módulo de Almacén.
              </p>
            )}
            <div className="space-y-2">
              {/* Header */}
              {(form.items || []).length > 0 && (
                <div className={cn("grid grid-cols-12 gap-2 px-2 pb-1 text-xs font-medium", isDark ? "text-zinc-500" : "text-gray-400")}>
                  <div className="col-span-5">Repuesto</div>
                  <div className="col-span-2">Cant.</div>
                  <div className="col-span-2">Precio U.</div>
                  <div className="col-span-2">Subtotal</div>
                  <div className="col-span-1" />
                </div>
              )}
              {(form.items || []).map((item, idx) => (
                <div key={idx} className={cn("grid grid-cols-12 gap-2 p-2 rounded-lg", isDark ? "bg-zinc-800/50" : "bg-gray-50")}>
                  <div className="col-span-5">
                    <SparePartSearch
                      value={item.spare_part_id}
                      spareParts={spareParts}
                      onChange={v => updateItem(idx, "spare_part_id", v)}
                      isDark={isDark}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)} className={cn("h-8 text-xs", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} placeholder="Cant." min="1" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" value={item.unit_price} onChange={e => updateItem(idx, "unit_price", e.target.value)} className={cn("h-8 text-xs", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} placeholder="Precio" />
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={cn("text-xs font-medium", isDark ? "text-zinc-300" : "text-gray-600")}>${(item.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <Button size="icon" variant="ghost" onClick={() => removeItem(idx)} className="w-7 h-7 text-red-500 hover:bg-red-500/10"><X className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
              {(form.items || []).length === 0 && (
                <p className={cn("text-xs text-center py-3", isDark ? "text-zinc-600" : "text-gray-400")}>Sin ítems. Agrega repuestos a la orden.</p>
              )}
            </div>
            {(form.items || []).length > 0 && (
              <div className={cn("flex justify-end mt-2 pt-2 border-t", isDark ? "border-zinc-700" : "border-gray-200")}>
                <span className={cn("font-bold", isDark ? "text-white" : "text-gray-900")}>Total: ${(form.total || 0).toFixed(2)}</span>
              </div>
            )}
          </div>

          <div>
            <Label className={isDark ? "text-zinc-300" : ""}>Notas</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className={isDark ? "border-zinc-600 text-zinc-300" : ""}>Cancelar</Button>
          <Button onClick={() => saveMutation.mutate(form)} disabled={!form.supplier_id || !form.date || saveMutation.isPending} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
            {saveMutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PurchaseOrders() {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const isSuperAdmin = !user?.company_id || user?.user_role === "super_admin";
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const companyId = isSuperAdmin ? selectedCompanyId : user?.company_id;

  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list(), enabled: isSuperAdmin });
  const { data: suppliers = [] } = useQuery({ queryKey: ["suppliers", companyId], queryFn: () => companyId ? base44.entities.Supplier.filter({ company_id: companyId, is_active: true }) : base44.entities.Supplier.filter({ is_active: true }), enabled: !!user });
  const { data: spareParts = [] } = useQuery({ queryKey: ["spare-parts", companyId], queryFn: () => companyId ? base44.entities.SparePart.filter({ company_id: companyId, is_active: true }) : base44.entities.SparePart.filter({ is_active: true }), enabled: !!user });
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["purchase-orders", companyId],
    queryFn: () => companyId ? base44.entities.PurchaseOrder.filter({ company_id: companyId }, "-created_date") : base44.entities.PurchaseOrder.list("-created_date"),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PurchaseOrder.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }); setDeleting(null); },
  });

  const canEdit = user?.role === "admin" || user?.user_role === "super_admin" || user?.user_role === "almacen_admin";

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.order_number?.includes(search) || suppliers.find(s => s.id === o.supplier_id)?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className={cn("min-h-screen p-4 md:p-6", isDark ? "bg-black" : "bg-gray-50")}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>Órdenes de Compra</h1>
          <p className={cn("text-sm mt-1", isDark ? "text-zinc-400" : "text-gray-500")}>{orders.length} orden{orders.length !== 1 ? "es" : ""} registrada{orders.length !== 1 ? "s" : ""}</p>
        </div>
        {canEdit && (
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" /> Nueva OC
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
          <Input className={cn("pl-9", isDark ? "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500" : "")} placeholder="Buscar por N° de OC o proveedor..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className={cn("w-full sm:w-40", isDark ? "bg-zinc-900 border-zinc-700 text-white" : "")}>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="aprobada">Aprobada</SelectItem>
            <SelectItem value="recibida">Recibida</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className={cn("h-20 rounded-xl animate-pulse", isDark ? "bg-zinc-900" : "bg-gray-200")} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <ShoppingCart className={cn("w-12 h-12", isDark ? "text-zinc-700" : "text-gray-300")} />
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-gray-400")}>{search ? "No se encontraron órdenes" : "No hay órdenes de compra registradas"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => {
            const supplier = suppliers.find(s => s.id === o.supplier_id);
            const isExpanded = expanded === o.id;
            return (
              <div key={o.id} className={cn("rounded-xl border transition-all", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200 shadow-sm")}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("font-mono font-semibold text-sm", isDark ? "text-yellow-400" : "text-yellow-600")}>{o.order_number || "Sin número"}</span>
                        <Badge className={cn("text-xs border", STATUS_COLORS[o.status])}>{o.status}</Badge>
                      </div>
                      <p className={cn("text-sm truncate", isDark ? "text-zinc-300" : "text-gray-700")}>{supplier?.name || "Proveedor desconocido"}</p>
                      <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-500")}>{o.date ? format(new Date(o.date), "dd/MM/yyyy") : "-"} · {(o.items || []).length} ítem{(o.items || []).length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className={cn("font-bold", isDark ? "text-white" : "text-gray-900")}>${(o.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    {canEdit && <Button size="icon" variant="ghost" onClick={() => { setEditing(o); setDialogOpen(true); }} className={cn("w-8 h-8", isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800" : "text-gray-500 hover:text-gray-900")}><Edit2 className="w-4 h-4" /></Button>}
                    {canEdit && <Button size="icon" variant="ghost" onClick={() => setDeleting(o)} className="w-8 h-8 text-red-500 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button>}
                    <Button size="icon" variant="ghost" onClick={() => setExpanded(isExpanded ? null : o.id)} className={cn("w-8 h-8", isDark ? "text-zinc-400 hover:text-white" : "text-gray-500")}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {isExpanded && (o.items || []).length > 0 && (
                  <div className={cn("px-4 pb-4 border-t", isDark ? "border-zinc-800" : "border-gray-100")}>
                    <table className="w-full mt-3 text-xs">
                      <thead>
                        <tr className={isDark ? "text-zinc-500" : "text-gray-500"}>
                          <th className="text-left pb-1">Repuesto</th>
                          <th className="text-right pb-1">Cant.</th>
                          <th className="text-right pb-1">Precio U.</th>
                          <th className="text-right pb-1">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {o.items.map((item, i) => (
                          <tr key={i} className={cn(isDark ? "text-zinc-300" : "text-gray-700")}>
                            <td className="py-0.5">{item.spare_part_name || "-"}</td>
                            <td className="text-right py-0.5">{item.quantity}</td>
                            <td className="text-right py-0.5">${(item.unit_price || 0).toFixed(2)}</td>
                            <td className="text-right py-0.5">${(item.subtotal || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {o.notes && <p className={cn("text-xs mt-2 italic", isDark ? "text-zinc-500" : "text-gray-500")}>{o.notes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <PurchaseOrderDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); }} order={editing} companyId={companyId || user?.company_id} suppliers={suppliers} spareParts={spareParts} />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className={isDark ? "bg-zinc-900 border-zinc-700" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isDark ? "text-white" : ""}>¿Eliminar orden?</AlertDialogTitle>
            <AlertDialogDescription className={isDark ? "text-zinc-400" : ""}>Se eliminará la OC "{deleting?.order_number}". Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={isDark ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800" : ""}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteMutation.mutate(deleting.id)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}