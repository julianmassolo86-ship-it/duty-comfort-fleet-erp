import React, { useState, useEffect, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ThemeContextValue } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Truck, Phone, Mail, MapPin, Edit2, Trash2 } from "lucide-react";

const CATEGORY_LABELS = { repuestos: "Repuestos", servicios: "Servicios", ambos: "Repuestos y Servicios" };
const CATEGORY_COLORS = { repuestos: "bg-blue-500/10 text-blue-400 border-blue-500/20", servicios: "bg-purple-500/10 text-purple-400 border-purple-500/20", ambos: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };

function SupplierDialog({ open, onClose, supplier, companyId }) {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [form, setForm] = useState(supplier || { name: "", cuit: "", phone: "", email: "", address: "", category: "repuestos", notes: "", is_active: true });

  React.useEffect(() => { setForm(supplier || { name: "", cuit: "", phone: "", email: "", address: "", category: "repuestos", notes: "", is_active: true }); }, [supplier, open]);

  const saveMutation = useMutation({
    mutationFn: (data) => supplier ? base44.entities.Supplier.update(supplier.id, data) : base44.entities.Supplier.create({ ...data, company_id: companyId || data.company_id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); onClose(); },
    onError: (e) => console.error("Error guardando proveedor:", e),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-lg", isDark ? "bg-zinc-900 border-zinc-700" : "")}>
        <DialogHeader>
          <DialogTitle className={isDark ? "text-white" : ""}>{supplier ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className={isDark ? "text-zinc-300" : ""}>Nombre *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} placeholder="Nombre del proveedor" />
            </div>
            <div>
              <Label className={isDark ? "text-zinc-300" : ""}>CUIT</Label>
              <Input value={form.cuit} onChange={e => set("cuit", e.target.value)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} placeholder="20-12345678-9" />
            </div>
            <div>
              <Label className={isDark ? "text-zinc-300" : ""}>Categoría</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                  <SelectItem value="repuestos">Repuestos</SelectItem>
                  <SelectItem value="servicios">Servicios</SelectItem>
                  <SelectItem value="ambos">Repuestos y Servicios</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={isDark ? "text-zinc-300" : ""}>Teléfono</Label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} placeholder="+54 9 11 1234-5678" />
            </div>
            <div>
              <Label className={isDark ? "text-zinc-300" : ""}>Email</Label>
              <Input value={form.email} onChange={e => set("email", e.target.value)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} placeholder="contacto@empresa.com" />
            </div>
            <div className="col-span-2">
              <Label className={isDark ? "text-zinc-300" : ""}>Dirección</Label>
              <Input value={form.address} onChange={e => set("address", e.target.value)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} placeholder="Calle, número, ciudad" />
            </div>
            <div className="col-span-2">
              <Label className={isDark ? "text-zinc-300" : ""}>Notas</Label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} rows={2} />
            </div>
          </div>
        </div>
        {!companyId && !supplier && (
          <p className="text-xs text-red-400 mb-2">Seleccioná una empresa antes de crear un proveedor.</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className={isDark ? "border-zinc-600 text-zinc-300" : ""}>Cancelar</Button>
          <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending || (!companyId && !supplier)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
            {saveMutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Suppliers() {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const isSuperAdmin = !user?.company_id || user?.user_role === "super_admin";
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const companyId = isSuperAdmin ? selectedCompanyId : user?.company_id;

  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list(), enabled: isSuperAdmin });
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers", companyId],
    queryFn: () => companyId ? base44.entities.Supplier.filter({ company_id: companyId, is_active: true }) : base44.entities.Supplier.filter({ is_active: true }),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Supplier.update(id, { is_active: false }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); setDeleting(null); },
  });

  const filtered = suppliers.filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.cuit?.includes(search) || s.email?.toLowerCase().includes(search.toLowerCase()));

  const canEdit = user?.role === "admin" || user?.user_role === "super_admin" || user?.user_role === "almacen_admin";

  return (
    <div className={cn("min-h-screen p-4 md:p-6", isDark ? "bg-black" : "bg-gray-50")}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>Proveedores</h1>
          <p className={cn("text-sm mt-1", isDark ? "text-zinc-400" : "text-gray-500")}>{suppliers.length} proveedor{suppliers.length !== 1 ? "es" : ""} registrado{suppliers.length !== 1 ? "s" : ""}</p>
        </div>
        {canEdit && (
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Proveedor
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
          <Input className={cn("pl-9", isDark ? "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500" : "")} placeholder="Buscar por nombre, CUIT, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className={cn("h-40 rounded-xl animate-pulse", isDark ? "bg-zinc-900" : "bg-gray-200")} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Truck className={cn("w-12 h-12", isDark ? "text-zinc-700" : "text-gray-300")} />
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-gray-400")}>{search ? "No se encontraron proveedores" : "No hay proveedores registrados"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id} className={cn("rounded-xl border p-4 transition-all", isDark ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700" : "bg-white border-gray-200 hover:border-gray-300 shadow-sm")}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className={cn("font-semibold truncate", isDark ? "text-white" : "text-gray-900")}>{s.name}</h3>
                  {s.cuit && <p className={cn("text-xs mt-0.5", isDark ? "text-zinc-500" : "text-gray-500")}>CUIT: {s.cuit}</p>}
                </div>
                <Badge className={cn("text-xs border ml-2 flex-shrink-0", CATEGORY_COLORS[s.category] || CATEGORY_COLORS.repuestos)}>
                  {CATEGORY_LABELS[s.category] || s.category}
                </Badge>
              </div>
              <div className="space-y-1.5">
                {s.phone && <div className="flex items-center gap-2"><Phone className={cn("w-3.5 h-3.5", isDark ? "text-zinc-500" : "text-gray-400")} /><span className={cn("text-xs", isDark ? "text-zinc-400" : "text-gray-600")}>{s.phone}</span></div>}
                {s.email && <div className="flex items-center gap-2"><Mail className={cn("w-3.5 h-3.5", isDark ? "text-zinc-500" : "text-gray-400")} /><span className={cn("text-xs truncate", isDark ? "text-zinc-400" : "text-gray-600")}>{s.email}</span></div>}
                {s.address && <div className="flex items-center gap-2"><MapPin className={cn("w-3.5 h-3.5", isDark ? "text-zinc-500" : "text-gray-400")} /><span className={cn("text-xs truncate", isDark ? "text-zinc-400" : "text-gray-600")}>{s.address}</span></div>}
              </div>
              {canEdit && (
                <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: isDark ? "#27272a" : "#f3f4f6" }}>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setDialogOpen(true); }} className={cn("flex-1 h-8 text-xs", isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800" : "text-gray-600 hover:text-gray-900")}>
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(s)} className="h-8 text-xs text-red-500 hover:bg-red-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <SupplierDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); }} supplier={editing} companyId={companyId || user?.company_id} />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className={isDark ? "bg-zinc-900 border-zinc-700" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isDark ? "text-white" : ""}>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription className={isDark ? "text-zinc-400" : ""}>Se desactivará "{deleting?.name}".</AlertDialogDescription>
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