import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Package } from "lucide-react";

export default function SparePartsSelector({ companyId, value = [], onChange, isDark }) {
  const [spareParts, setSpareParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState("1");

  useEffect(() => {
    setLoading(true);
    base44.entities.SparePart.list()
      .then(all => {
        // Filter by company if provided, exclude inactive (but include if field missing)
        const filtered = all.filter(p =>
          (!companyId || p.company_id === companyId) &&
          p.is_active !== false
        );
        setSpareParts(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [companyId]);

  const handleAdd = () => {
    const part = spareParts.find(p => p.id === selectedId);
    if (!part) return;
    const quantity = parseFloat(qty) || 1;
    // No duplicados
    if (value.find(v => v.spare_part_id === selectedId)) {
      onChange(value.map(v => v.spare_part_id === selectedId ? { ...v, quantity: v.quantity + quantity } : v));
    } else {
      onChange([...value, {
        spare_part_id: part.id,
        spare_part_name: part.name,
        part_number: part.part_number || "",
        quantity,
        unit_cost: part.unit_cost || 0,
      }]);
    }
    setSelectedId("");
    setQty("1");
  };

  const handleRemove = (id) => {
    onChange(value.filter(v => v.spare_part_id !== id));
  };

  const inputCls = isDark ? "bg-zinc-800 border-zinc-700 text-white" : "";
  const cardCls = isDark ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200";

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Package className="w-4 h-4" />
        Repuestos / Ítems Utilizados
      </Label>

      {/* Selector */}
      <div className={cn("p-3 rounded-lg border space-y-3", cardCls)}>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={selectedId} onValueChange={setSelectedId} disabled={loading}>
              <SelectTrigger className={cn(inputCls)}>
                <SelectValue placeholder={loading ? "Cargando repuestos..." : "Seleccionar repuesto del almacén..."} />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-zinc-900 border-zinc-700" : ""}>
                {spareParts.map(p => (
                  <SelectItem key={p.id} value={p.id} className={isDark ? "text-white focus:bg-zinc-700" : ""}>
                    <div className="flex flex-col">
                      <span className="font-medium">{p.name}</span>
                      <span className={cn("text-xs", isDark ? "text-zinc-400" : "text-gray-400")}>
                        {p.part_number ? `#${p.part_number}` : "Sin N° pieza"} · Stock: {p.stock_quantity ?? 0} {p.unit_of_measure}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-24">
            <Input
              type="number"
              min="1"
              value={qty}
              onChange={e => setQty(e.target.value)}
              placeholder="Cant."
              className={inputCls}
            />
          </div>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={!selectedId}
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