import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SparePartSearch({ onSelectPart, selectedParts = [], companyId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: spareParts = [] } = useQuery({
    queryKey: ['spareParts', companyId],
    queryFn: () => base44.entities.SparePart.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const filteredParts = spareParts.filter(part => {
    if (!searchTerm.trim()) return false;
    const search = searchTerm.toLowerCase();
    return (
      part.name?.toLowerCase().includes(search) ||
      part.part_number?.toLowerCase().includes(search) ||
      part.alternative_part_number?.toLowerCase().includes(search) ||
      part.description?.toLowerCase().includes(search)
    );
  });

  const handleSelectPart = (part) => {
    onSelectPart(part);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleRemove = (partId) => {
    // Notify parent to remove this part
    onSelectPart(null, partId);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Repuestos Requeridos</Label>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => searchTerm && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Buscar repuesto por nombre, N/P OEM..."
              className="bg-zinc-900 border-zinc-700 focus:border-blue-500/50 pl-10"
            />
          </div>

          {/* Dropdown de resultados */}
          {showDropdown && filteredParts.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {filteredParts.map(part => (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => handleSelectPart(part)}
                  className="w-full px-3 py-2.5 text-left hover:bg-zinc-800 border-b border-zinc-800 last:border-b-0 transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-white">{part.name}</span>
                    <div className="text-xs text-zinc-500 flex gap-2">
                      {part.part_number && <span>N/P: {part.part_number}</span>}
                      {part.alternative_part_number && <span>Alt: {part.alternative_part_number}</span>}
                    </div>
                    {part.specifications && (
                      <span className="text-xs text-zinc-600">{part.specifications}</span>
                    )}
                    {part.manufacturer && (
                      <span className="text-xs text-blue-400">Fab: {part.manufacturer}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista de repuestos seleccionados */}
      {selectedParts.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-zinc-500">Seleccionados ({selectedParts.length})</Label>
          <div className="space-y-1.5">
            {selectedParts.map(part => (
              <div key={part.id} className="flex items-start justify-between gap-2 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{part.name}</p>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {part.part_number && <span>N/P: {part.part_number}</span>}
                    {part.specifications && <span className="ml-2">{part.specifications}</span>}
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemove(part.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}