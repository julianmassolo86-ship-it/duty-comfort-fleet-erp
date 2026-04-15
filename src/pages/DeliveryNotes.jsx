import React, { useState, useEffect, useContext } from "react";
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
import { Plus, Search, FileText, Upload, CheckCircle, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  pendiente: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  completo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  parcial: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

function DeliveryNoteDialog({ open, onClose, deliveryNote, companyId, purchaseOrders, spareParts }) {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const emptyForm = { delivery_number: "", purchase_order_id: "", reception_date: new Date().toISOString().split("T")[0], items: [], notes: "", photo_url: "", status: "pendiente" };
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setForm(deliveryNote || emptyForm); }, [deliveryNote, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // When PO is selected, prefill items from the PO
  const handlePOSelect = (poId) => {
    const realId = poId === "__none__" ? "" : poId;
    set("purchase_order_id", realId);
    const po = purchaseOrders.find(p => p.id === realId);
    if (po?.items) {
      setForm(f => ({
        ...f,
        purchase_order_id: realId,
        items: po.items.map(item => ({ ...item, quantity_ordered: item.quantity, quantity_received: item.quantity })),
      }));
    }
  };

  const updateItemQty = (idx, val) => {
    setForm(f => {
      const items = [...(f.items || [])];
      items[idx] = { ...items[idx], quantity_received: parseFloat(val) || 0 };
      return { ...f, items };
    });
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("photo_url", file_url);
    setUploading(false);
  };

  // Resolve company_id: use prop, or fall back to the linked PO's company_id
  const resolvedCompanyId = companyId ||
    purchaseOrders.find(p => p.id === form.purchase_order_id)?.company_id;

  const saveMutation = useMutation({
    mutationFn: (data) => deliveryNote ? base44.entities.DeliveryNote.update(deliveryNote.id, data) : base44.entities.DeliveryNote.create({ ...data, company_id: resolvedCompanyId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["delivery-notes"] }); onClose(); },
  });

  const confirmMutation = useMutation({
    mutationFn: async (data) => {
      const created = await base44.entities.DeliveryNote.create({ ...data, company_id: resolvedCompanyId });
      return base44.functions.invoke("confirmDeliveryNote", { delivery_note_id: created.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-notes"] });
      queryClient.invalidateQueries({ queryKey: ["spare-parts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", isDark ? "bg-zinc-900 border-zinc-700" : "")}>
        <DialogHeader>
          <DialogTitle className={isDark ? "text-white" : ""}>{deliveryNote ? `Remito ${deliveryNote.delivery_number}` : "Nuevo Remito de Entrada"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className={isDark ? "text-zinc-300" : ""}>N° de Remito *</Label>
              <Input value={form.delivery_number} onChange={e => set("delivery_number", e.target.value)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} placeholder="Ej: REM-001234" />
            </div>
            <div>
              <Label className={isDark ? "text-zinc-300" : ""}>Fecha de Recepción *</Label>
              <Input type="date" value={form.reception_date} onChange={e => set("reception_date", e.target.value)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} />
            </div>
            <div className="col-span-2">
              <Label className={isDark ? "text-zinc-300" : ""}>Orden de Compra Vinculada</Label>
              <Select value={form.purchase_order_id} onValueChange={handlePOSelect}>
                <SelectTrigger className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")}>
                  <SelectValue placeholder="Seleccionar OC (opcional)" />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                  <SelectItem value="__none__">Sin OC vinculada</SelectItem>
                  {purchaseOrders.filter(p => p.status === "aprobada").map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.order_number} – {p.date}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items */}
          {(form.items || []).length > 0 && (
            <div>
              <Label className={isDark ? "text-zinc-300" : ""}>Ítems recibidos</Label>
              <div className={cn("rounded-lg border mt-2 overflow-hidden", isDark ? "border-zinc-700" : "border-gray-200")}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className={cn("border-b", isDark ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-gray-50 text-gray-500 border-gray-200")}>
                      <th className="text-left px-3 py-2">Repuesto</th>
                      <th className="text-right px-3 py-2">Pedido</th>
                      <th className="text-right px-3 py-2">Recibido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => {
                      const hasShortage = (item.quantity_received || 0) < (item.quantity_ordered || 0);
                      return (
                        <tr key={idx} className={cn("border-b last:border-0", isDark ? "border-zinc-800" : "border-gray-100")}>
                          <td className={cn("px-3 py-2", isDark ? "text-zinc-300" : "text-gray-700")}>{item.spare_part_name || "-"}</td>
                          <td className={cn("px-3 py-2 text-right", isDark ? "text-zinc-400" : "text-gray-500")}>{item.quantity_ordered}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1">
                              {hasShortage && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                              <Input
                                type="number"
                                value={item.quantity_received}
                                onChange={e => updateItemQty(idx, e.target.value)}
                                className={cn("w-20 h-7 text-xs text-right", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "", hasShortage ? "border-yellow-500/50" : "")}
                                min="0"
                                max={item.quantity_ordered}
                              />
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

          {/* Photo */}
          <div>
            <Label className={isDark ? "text-zinc-300" : ""}>Foto del Remito</Label>
            <div className="mt-1 flex items-center gap-3">
              {form.photo_url ? (
                <img src={form.photo_url} alt="Remito" className="w-20 h-20 object-cover rounded-lg border" />
              ) : (
                <div className={cn("w-20 h-20 rounded-lg border flex items-center justify-center", isDark ? "border-zinc-700 bg-zinc-800" : "border-gray-200 bg-gray-50")}>
                  <FileText className={cn("w-8 h-8", isDark ? "text-zinc-600" : "text-gray-300")} />
                </div>
              )}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e.target.files[0])} disabled={uploading} />
                <Button type="button" variant="outline" size="sm" className={isDark ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800" : ""} asChild>
                  <span><Upload className="w-3.5 h-3.5 mr-1" />{uploading ? "Subiendo..." : "Subir foto"}</span>
                </Button>
              </label>
            </div>
          </div>

          <div>
            <Label className={isDark ? "text-zinc-300" : ""}>Notas</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className={isDark ? "border-zinc-600 text-zinc-300" : ""}>Cancelar</Button>
          {!deliveryNote && (
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.delivery_number || saveMutation.isPending} variant="outline" className={isDark ? "border-zinc-600 text-zinc-300" : ""}>
              {saveMutation.isPending ? "Guardando..." : "Guardar borrador"}
            </Button>
          )}
          {!deliveryNote && (
            <Button onClick={() => confirmMutation.mutate(form)} disabled={!form.delivery_number || confirmMutation.isPending || (form.items || []).length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              <CheckCircle className="w-4 h-4 mr-1" />{confirmMutation.isPending ? "Confirmando..." : "Confirmar y actualizar stock"}
            </Button>
          )}
          {deliveryNote && (
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
              {saveMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DeliveryNotes() {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const isSuperAdmin = !user?.company_id || user?.user_role === "super_admin";
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const companyId = isSuperAdmin ? selectedCompanyId : user?.company_id;

  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list(), enabled: isSuperAdmin });
  const { data: purchaseOrders = [] } = useQuery({ queryKey: ["purchase-orders", companyId], queryFn: () => companyId ? base44.entities.PurchaseOrder.filter({ company_id: companyId }) : base44.entities.PurchaseOrder.list(), enabled: !!user });
  const { data: spareParts = [] } = useQuery({ queryKey: ["spare-parts", companyId], queryFn: () => companyId ? base44.entities.SparePart.filter({ company_id: companyId, is_active: true }) : base44.entities.SparePart.filter({ is_active: true }), enabled: !!user });
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["delivery-notes", companyId],
    queryFn: () => companyId ? base44.entities.DeliveryNote.filter({ company_id: companyId }, "-reception_date") : base44.entities.DeliveryNote.list("-reception_date"),
    enabled: !!user,
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke("confirmDeliveryNote", { delivery_note_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-notes"] });
      queryClient.invalidateQueries({ queryKey: ["spare-parts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });

  const canEdit = user?.role === "admin" || user?.user_role === "super_admin" || user?.user_role === "almacen_admin";

  const filtered = notes.filter(n => {
    const matchSearch = !search || n.delivery_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || n.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className={cn("min-h-screen p-4 md:p-6", isDark ? "bg-black" : "bg-gray-50")}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>Remitos de Entrada</h1>
          <p className={cn("text-sm mt-1", isDark ? "text-zinc-400" : "text-gray-500")}>{notes.length} remito{notes.length !== 1 ? "s" : ""} registrado{notes.length !== 1 ? "s" : ""}</p>
        </div>
        {canEdit && (
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Remito
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {isSuperAdmin && (
          <Select value={selectedCompanyId || "__all__"} onValueChange={v => setSelectedCompanyId(v === "__all__" ? "" : v)}>
            <SelectTrigger className={cn("w-full sm:w-48", isDark ? "bg-zinc-900 border-zinc-700 text-white" : "")}>
              <SelectValue placeholder="Todas las empresas" />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
              <SelectItem value="__all__">Todas las empresas</SelectItem>
              {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="relative flex-1">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-zinc-500" : "text-gray-400")} />
          <Input className={cn("pl-9", isDark ? "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500" : "")} placeholder="Buscar por N° de remito..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className={cn("w-full sm:w-40", isDark ? "bg-zinc-900 border-zinc-700 text-white" : "")}>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="completo">Completo</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className={cn("h-20 rounded-xl animate-pulse", isDark ? "bg-zinc-900" : "bg-gray-200")} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <FileText className={cn("w-12 h-12", isDark ? "text-zinc-700" : "text-gray-300")} />
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-gray-400")}>{search ? "No se encontraron remitos" : "No hay remitos registrados"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(note => {
            const po = purchaseOrders.find(p => p.id === note.purchase_order_id);
            const isExpanded = expanded === note.id;
            return (
              <div key={note.id} className={cn("rounded-xl border transition-all", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200 shadow-sm")}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("font-mono font-semibold text-sm", isDark ? "text-yellow-400" : "text-yellow-600")}>{note.delivery_number}</span>
                        <Badge className={cn("text-xs border", STATUS_COLORS[note.status])}>{note.status}</Badge>
                      </div>
                      <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-600")}>
                        {note.reception_date ? format(new Date(note.reception_date), "dd/MM/yyyy") : "-"}
                        {po && <span className="ml-2 text-xs opacity-60">· OC: {po.order_number}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    {canEdit && note.status === "pendiente" && (
                      <Button size="sm" onClick={() => confirmMutation.mutate(note.id)} disabled={confirmMutation.isPending} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Confirmar
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => setExpanded(isExpanded ? null : note.id)} className={cn("w-8 h-8", isDark ? "text-zinc-400 hover:text-white" : "text-gray-500")}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {isExpanded && (
                  <div className={cn("px-4 pb-4 border-t", isDark ? "border-zinc-800" : "border-gray-100")}>
                    {(note.items || []).length > 0 ? (
                      <table className="w-full mt-3 text-xs">
                        <thead>
                          <tr className={isDark ? "text-zinc-500" : "text-gray-500"}>
                            <th className="text-left pb-1">Repuesto</th>
                            <th className="text-right pb-1">Pedido</th>
                            <th className="text-right pb-1">Recibido</th>
                          </tr>
                        </thead>
                        <tbody>
                          {note.items.map((item, i) => {
                            const partial = (item.quantity_received || 0) < (item.quantity_ordered || 0);
                            return (
                              <tr key={i} className={cn(isDark ? "text-zinc-300" : "text-gray-700")}>
                                <td className="py-0.5">{item.spare_part_name || "-"}</td>
                                <td className="text-right py-0.5">{item.quantity_ordered}</td>
                                <td className={cn("text-right py-0.5 font-semibold", partial ? "text-yellow-500" : "text-emerald-400")}>{item.quantity_received || 0}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : <p className={cn("text-xs mt-3", isDark ? "text-zinc-600" : "text-gray-400")}>Sin ítems registrados</p>}
                    {note.photo_url && (
                      <div className="mt-3">
                        <a href={note.photo_url} target="_blank" rel="noopener noreferrer">
                          <img src={note.photo_url} alt="Remito" className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80" />
                        </a>
                      </div>
                    )}
                    {note.notes && <p className={cn("text-xs mt-2 italic", isDark ? "text-zinc-500" : "text-gray-500")}>{note.notes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DeliveryNoteDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); }} deliveryNote={editing} companyId={companyId || user?.company_id} purchaseOrders={purchaseOrders} spareParts={spareParts} />
    </div>
  );
}