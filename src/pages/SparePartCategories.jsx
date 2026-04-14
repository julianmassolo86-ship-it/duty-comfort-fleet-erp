import React, { useState, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ThemeContextValue } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit2, ChevronRight, ChevronDown, Tag, FolderOpen } from "lucide-react";

// ── Dialog genérico para categoría o subcategoría ──────────────────────────────
function CategoryDialog({ open, onClose, item, parentId, isDark }) {
  const queryClient = useQueryClient();
  const isSubcat = !!parentId;
  const emptyForm = { name: "", notes: "", is_active: true };
  const [form, setForm] = useState(item || emptyForm);

  React.useEffect(() => { setForm(item || emptyForm); }, [item, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const Entity = isSubcat ? base44.entities.SparePartSubcategory : base44.entities.SparePartCategory;
  const qKey = isSubcat ? "spare-part-subcategories" : "spare-part-categories";

  const saveMutation = useMutation({
    mutationFn: (data) => item
      ? Entity.update(item.id, data)
      : Entity.create(isSubcat ? { ...data, category_id: parentId } : data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [qKey] });
      onClose();
    },
  });

  const inputClass = cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-md", isDark ? "bg-zinc-900 border-zinc-700" : "")}>
        <DialogHeader>
          <DialogTitle className={isDark ? "text-white" : ""}>
            {item ? "Editar" : "Nueva"} {isSubcat ? "Subcategoría" : "Categoría"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className={isDark ? "text-zinc-300" : ""}>Nombre *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} className={inputClass} placeholder={isSubcat ? "ej: Lámparas, Motor de arranque" : "ej: Sistema Eléctrico, Motor"} />
          </div>

          <div>
            <Label className={isDark ? "text-zinc-300" : ""}>Notas</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} className={cn("mt-1", isDark ? "bg-zinc-800 border-zinc-700 text-white" : "")} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className={isDark ? "border-zinc-600 text-zinc-300" : ""}>Cancelar</Button>
          <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
            {saveMutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Fila de subcategoría ────────────────────────────────────────────────────────
function SubcategoryRow({ sub, isDark, onEdit, onDelete }) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-2.5 rounded-lg ml-8 group", isDark ? "hover:bg-zinc-800/50" : "hover:bg-gray-50")}>
      <Tag className={cn("w-4 h-4 shrink-0", isDark ? "text-zinc-600" : "text-gray-300")} />
      <span className={cn("flex-1 text-sm", isDark ? "text-zinc-300" : "text-gray-700")}>{sub.name}</span>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
        <Button size="icon" variant="ghost" onClick={() => onEdit(sub)} className={cn("w-7 h-7", isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-gray-400 hover:text-gray-700")}>
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(sub)} className="w-7 h-7 text-red-500 hover:bg-red-500/10">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Fila de categoría con sus subcategorías ─────────────────────────────────────
function CategoryRow({ cat, subcategories, isDark, onEditCat, onDeleteCat, onAddSub, onEditSub, onDeleteSub }) {
  const [expanded, setExpanded] = useState(false);
  const subs = subcategories.filter(s => s.category_id === cat.id);

  return (
    <div className={cn("rounded-xl border overflow-hidden", isDark ? "border-zinc-800 bg-zinc-900" : "border-gray-200 bg-white shadow-sm")}>
      {/* Header categoría */}
      <div className={cn("flex items-center gap-3 px-4 py-3 group cursor-pointer", isDark ? "hover:bg-zinc-800/50" : "hover:bg-gray-50")} onClick={() => setExpanded(e => !e)}>
        <button type="button" className={cn("w-5 h-5 flex items-center justify-center shrink-0", isDark ? "text-zinc-500" : "text-gray-400")}>
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", isDark ? "bg-zinc-800" : "bg-gray-100")}>
          <FolderOpen className={cn("w-5 h-5", isDark ? "text-zinc-500" : "text-gray-400")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold text-sm", isDark ? "text-white" : "text-gray-900")}>{cat.name}</p>
          <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>{subs.length} subcategoría{subs.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity" onClick={e => e.stopPropagation()}>
          <Button size="icon" variant="ghost" onClick={() => onAddSub(cat)} className={cn("w-7 h-7", isDark ? "text-zinc-400 hover:text-yellow-400 hover:bg-zinc-700" : "text-gray-400 hover:text-yellow-600")} title="Agregar subcategoría">
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onEditCat(cat)} className={cn("w-7 h-7", isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-gray-400 hover:text-gray-700")}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDeleteCat(cat)} className="w-7 h-7 text-red-500 hover:bg-red-500/10">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Subcategorías */}
      {expanded && (
        <div className={cn("border-t pb-2", isDark ? "border-zinc-800" : "border-gray-100")}>
          {subs.length === 0
            ? <p className={cn("text-xs text-center py-3 ml-8", isDark ? "text-zinc-600" : "text-gray-400")}>Sin subcategorías. Hacé clic en + para agregar.</p>
            : subs.map(sub => (
                <SubcategoryRow key={sub.id} sub={sub} isDark={isDark} onEdit={onEditSub} onDelete={onDeleteSub} />
              ))
          }
          <div className="ml-8 mt-1 px-4">
            <Button size="sm" variant="ghost" onClick={() => onAddSub(cat)} className={cn("h-7 text-xs gap-1", isDark ? "text-zinc-500 hover:text-yellow-400" : "text-gray-400 hover:text-yellow-600")}>
              <Plus className="w-3 h-3" /> Agregar subcategoría
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────────────────────
export default function SparePartCategories() {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const [dialog, setDialog] = useState(null); // { mode: 'cat'|'sub', item?, parentId? }
  const [deleting, setDeleting] = useState(null); // { item, type: 'cat'|'sub' }

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ["spare-part-categories"],
    queryFn: () => base44.entities.SparePartCategory.list(),
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ["spare-part-subcategories"],
    queryFn: () => base44.entities.SparePartSubcategory.list(),
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id) => base44.entities.SparePartCategory.update(id, { is_active: false }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["spare-part-categories"] }); setDeleting(null); },
  });

  const deleteSubMutation = useMutation({
    mutationFn: (id) => base44.entities.SparePartSubcategory.update(id, { is_active: false }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["spare-part-subcategories"] }); setDeleting(null); },
  });

  const activeCats = categories.filter(c => c.is_active !== false);
  const activeSubs = subcategories.filter(s => s.is_active !== false);

  return (
    <div className={cn("min-h-screen p-4 md:p-6", isDark ? "bg-black" : "bg-gray-50")}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>Categorías de Repuestos</h1>
          <p className={cn("text-sm mt-1", isDark ? "text-zinc-400" : "text-gray-500")}>{activeCats.length} categoría{activeCats.length !== 1 ? "s" : ""} · {activeSubs.length} subcategoría{activeSubs.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setDialog({ mode: "cat" })} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
        </Button>
      </div>

      {loadingCats ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className={cn("h-16 rounded-xl animate-pulse", isDark ? "bg-zinc-900" : "bg-gray-200")} />)}</div>
      ) : activeCats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <FolderOpen className={cn("w-12 h-12", isDark ? "text-zinc-700" : "text-gray-300")} />
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-gray-400")}>No hay categorías aún. Creá la primera.</p>
          <Button onClick={() => setDialog({ mode: "cat" })} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold mt-2">
            <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeCats.sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              subcategories={activeSubs}
              isDark={isDark}
              onEditCat={(c) => setDialog({ mode: "cat", item: c })}
              onDeleteCat={(c) => setDeleting({ item: c, type: "cat" })}
              onAddSub={(c) => setDialog({ mode: "sub", parentId: c.id })}
              onEditSub={(s) => setDialog({ mode: "sub", item: s, parentId: s.category_id })}
              onDeleteSub={(s) => setDeleting({ item: s, type: "sub" })}
            />
          ))}
        </div>
      )}

      {/* Dialog crear/editar */}
      {dialog && (
        <CategoryDialog
          open={!!dialog}
          onClose={() => setDialog(null)}
          item={dialog.item}
          parentId={dialog.mode === "sub" ? dialog.parentId : null}
          isDark={isDark}
        />
      )}

      {/* Confirm delete */}
      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className={isDark ? "bg-zinc-900 border-zinc-700" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isDark ? "text-white" : ""}>
              ¿Eliminar {deleting?.type === "cat" ? "categoría" : "subcategoría"}?
            </AlertDialogTitle>
            <AlertDialogDescription className={isDark ? "text-zinc-400" : ""}>
              Se desactivará "{deleting?.item?.name}".
              {deleting?.type === "cat" && " Las subcategorías asociadas quedarán huérfanas."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={isDark ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800" : ""}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleting?.type === "cat"
                ? deleteCatMutation.mutate(deleting.item.id)
                : deleteSubMutation.mutate(deleting.item.id)
              }
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}