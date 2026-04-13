import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Package, Search, ChevronDown } from "lucide-react";

export default function SparePartsSelector({ companyId, value = [], onChange, isDark }) {
  const [spareParts, setSpareParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState("1");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    setLoading(true);
    base44.entities.SparePart.list()
      .then(all => {
        const filtered = all.filter(p => p.is_active !== false)
          .filter(p => !companyId || !p.company_id || p.company_id === companyId);
        setSpareParts(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [companyId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = spareParts.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.part_number?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (part) => {
    setSelected(part);
    setSearch(part.name);
    setOpen(false);
  };

  const handleAdd = () => {
    if (!selected) return;
    const quantity = parseFloat(qty) || 1;
    if (value.find(v => v.spare_part_id === selected.id)) {
      onChange(value.map(v => v.spare_part_id === selected.id ? { ...v, quantity: v.quantity + quantity } : v));
    } else {
      onChange([...value, {
        spare_part_id: selected.id,
        spare_part_name: selected.name,
        part_number: selected.part_number || "",
        quantity,
        unit_cost: selected.unit_cost || 0,
      }]);
    }
    setSelected(null);
    setSearch("");
    setQty("1");
  };

  const handleRemove = (id) => onChange(value.filter(v => v.spare_part_id !== id));

  const inputCls = isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" : "";
  const cardCls = isDark ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200";
  const dropdownCls = isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-gray-200";
  const itemHoverCls = isDark ? "hover:bg-zinc-700" : "hover:bg-gray-50";

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Package className="w-4 h-4" />
        Repuestos / Ítems Utilizados
      </Label>

      <div className={cn("p-3 rounded-lg border space-y-3", cardCls)}>
        <div className="flex gap-2 items-start">
          {/* Custom searchable dropdown */}
          <div className="flex-1 relative" ref={ref}>
            <div
              className={cn(
                "flex items-center gap-2 w-full rounded-md border px-3 h-10 cursor-text",
                inputCls,
                isDark ? "border-zinc-700" : "border-input"
              )}
              onClick={() => setOpen(true)}
            >
              <Search className="w-4 h-4 shrink-0 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setOpen(true); setSelected(null); }}
                onFocus={() => setOpen(true)}
                placeholder={loading ? "Cargando..." : "Buscar repuesto por nombre o N° pieza..."}
                className={cn(
                  "flex-1 bg-transparent outline-none text-sm",
                  isDark ? "text-white placeholder:text-zinc-500" : "text-gray-900 placeholder:text-gray-400"
                )}
              />
              <ChevronDown className="w-4 h-4 shrink-0 text-zinc-400" />
            </div>

            {open && (
              <div className={cn(
                "absolute z-50 top-full left-0 right-0 mt-1 rounded-md border shadow-lg max-h-52 overflow-y-auto",
                dropdownCls
              )}>
                {filtered.length === 0 ? (
                  <div className={cn("px-3 py-3 text-sm text-center", isDark ? "text-zinc-500" : "text-gray-400")}>
                    {loading ? "Cargando repuestos..." : "No se encontraron repuestos"}
                  </div>
                ) : (
                  filtered.map(p => (
                    <div
                      key={p.id}
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
                      className={cn("px-3 py-2.5 cursor-pointer transition-colors", itemHoverCls)}
                    >
                      <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{p.name}</p>
                      <p className={cn("text-xs mt-0.5", isDark ? "text-zinc-400" : "text-gray-400")}>
                        {p.part_number ? `#${p.part_number}` : "Sin N° pieza"} · Stock: {p.stock_quantity ?? 0} {p.unit_of_measure}
                        {p.unit_cost ? ` · $${p.unit_cost.toLocaleString()}` : ""}
                        {p.description ? ` · ${p.description}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Cantidad */}
          <Input
            type="number"
            min="1"
            value={qty}
            onChange={e => setQty(e.target.value)}
            placeholder="Cant."
            className={cn("w-20 shrink-0", inputCls)}
          />

          {/* Agregar */}
          <Button
            type="button"
            onClick={handleAdd}
            disabled={!selected}
            size="icon"
            className="bg-yellow-500 hover:bg-yellow-600 text-black shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {spareParts.length === 0 && !loading && (
          <p className={cn("text-xs text-center py-1", isDark ? "text-zinc-500" : "text-gray-400")}>
            No hay repuestos en el almacén para esta empresa.
          </p>
        )}
      </div>

      {/* Lista de seleccionados */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map(item => (
            <div key={item.spare_part_id} className={cn("flex items-center gap-3 p-2.5 rounded-lg border", cardCls)}>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", isDark ? "text-white" : "text-gray-900")}>
                  {item.spare_part_name}
                </p>
                <p className={cn("text-xs", isDark ? "text-zinc-400" : "text-gray-400")}>
                  {item.part_number ? `#${item.part_number}` : "Sin N° pieza"}
                  {item.unit_cost ? ` · $${item.unit_cost.toLocaleString()}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={e => onChange(value.map(v => v.spare_part_id === item.spare_part_id ? { ...v, quantity: parseFloat(e.target.value) || 1 } : v))}
                  className={cn("w-20 h-7 text-sm", inputCls)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(item.spare_part_id)}
                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <div className={cn("text-xs text-right pr-1", isDark ? "text-zinc-400" : "text-gray-500")}>
            {value.length} ítem{value.length !== 1 ? "s" : ""} seleccionado{value.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}