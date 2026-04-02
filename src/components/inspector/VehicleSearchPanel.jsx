import { useState, useContext } from "react";
import { Search, Car, Hash, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ThemeContextValue } from "@/components/common/ThemeWrapper";

export default function VehicleSearchPanel({ vehicles, onSelectVehicle }) {
    const { theme } = useContext(ThemeContextValue) || { theme: 'light' };
    const [query, setQuery] = useState("");

    const filtered = query.trim().length < 1 ? [] : vehicles.filter(v => {
        const q = query.toLowerCase();
        return (
            (v.internal_number && v.internal_number.toLowerCase().includes(q)) ||
            (v.plate && v.plate.toLowerCase().includes(q))
        );
    }).slice(0, 10);

    const isDark = theme === 'dark';

    return (
        <div className="w-full">
            {/* Buscador */}
            <div className="relative">
                <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6", isDark ? "text-zinc-400" : "text-gray-400")} />
                <Input
                    type="text"
                    placeholder="Buscar por número interno o patente..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                    className={cn(
                        "pl-12 h-14 text-lg rounded-2xl border-2 transition-all",
                        isDark
                            ? "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-500"
                            : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-yellow-500"
                    )}
                />
            </div>

            {/* Resultados */}
            {query.trim().length > 0 && (
                <div className="mt-3 space-y-2">
                    {filtered.length === 0 ? (
                        <div className={cn("flex items-center gap-3 p-4 rounded-xl border", isDark ? "bg-zinc-900 border-zinc-700 text-zinc-400" : "bg-gray-50 border-gray-200 text-gray-500")}>
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-sm">No se encontró ningún vehículo</span>
                        </div>
                    ) : (
                        filtered.map(vehicle => (
                            <button
                                key={vehicle.id}
                                onClick={() => { onSelectVehicle(vehicle); setQuery(""); }}
                                className={cn(
                                    "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-95",
                                    isDark
                                        ? "bg-zinc-900 border-zinc-700 hover:border-yellow-500 hover:bg-zinc-800"
                                        : "bg-white border-gray-200 hover:border-yellow-500 hover:bg-yellow-50"
                                )}
                            >
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", isDark ? "bg-zinc-800" : "bg-gray-100")}>
                                    {vehicle.image_url
                                        ? <img src={vehicle.image_url} className="w-full h-full object-cover rounded-xl" alt="" />
                                        : <Car className={cn("w-6 h-6", isDark ? "text-zinc-400" : "text-gray-500")} />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn("font-bold text-base", isDark ? "text-white" : "text-gray-900")}>
                                        {vehicle.plate || "Sin patente"}
                                    </p>
                                    <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-500")}>
                                        {vehicle.manufacturer} {vehicle.model}
                                    </p>
                                </div>
                                {vehicle.internal_number && (
                                    <div className={cn("flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-mono font-bold shrink-0", isDark ? "bg-yellow-500/10 text-yellow-400" : "bg-yellow-100 text-yellow-700")}>
                                        <Hash className="w-3 h-3" />
                                        {vehicle.internal_number}
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}