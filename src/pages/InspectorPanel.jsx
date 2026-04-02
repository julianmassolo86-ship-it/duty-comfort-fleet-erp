import { useState, useEffect, useContext } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { ThemeContextValue } from "@/components/common/ThemeWrapper";
import VehicleSearchPanel from "@/components/inspector/VehicleSearchPanel";
import InspectionForm from "@/components/inspector/InspectionForm";
import { ClipboardCheck, LogIn, LogOut } from "lucide-react";

export default function InspectorPanel() {
    const { theme } = useContext(ThemeContextValue) || { theme: 'light' };
    const isDark = theme === 'dark';

    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [inspectionType, setInspectionType] = useState(null); // 'pre_trip' | 'post_trip'
    const [user, setUser] = useState(null);

    useEffect(() => {
        base44.auth.me().then(setUser).catch(() => {});
        base44.entities.Vehicle.list().then(setVehicles).catch(() => {});
    }, []);

    const handleReset = () => {
        setSelectedVehicle(null);
        setInspectionType(null);
    };

    const step = !selectedVehicle ? 'search' : !inspectionType ? 'type' : 'form';

    return (
        <div className={cn("min-h-screen", isDark ? "bg-black" : "bg-gray-50")}>
            {/* Header */}
            <div className={cn("sticky top-0 z-10 border-b px-4 py-4", isDark ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-200")}>
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isDark ? "bg-yellow-500/10" : "bg-yellow-100")}>
                        <ClipboardCheck className={cn("w-5 h-5", isDark ? "text-yellow-400" : "text-yellow-600")} />
                    </div>
                    <div>
                        <h1 className={cn("font-bold text-lg leading-tight", isDark ? "text-white" : "text-gray-900")}>Panel Inspector</h1>
                        {user && <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>{user.full_name || user.email}</p>}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

                {/* STEP 1: Buscar vehículo */}
                {step === 'search' && (
                    <div className="space-y-4">
                        <h2 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                            Buscar vehículo
                        </h2>
                        <VehicleSearchPanel
                            vehicles={vehicles}
                            onSelectVehicle={setSelectedVehicle}
                        />
                    </div>
                )}

                {/* STEP 2: Tipo de inspección */}
                {step === 'type' && selectedVehicle && (
                    <div className="space-y-4">
                        <button
                            onClick={handleReset}
                            className={cn("text-sm flex items-center gap-1", isDark ? "text-zinc-400 hover:text-white" : "text-gray-500 hover:text-gray-800")}
                        >
                            ← Cambiar vehículo
                        </button>
                        <h2 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                            Tipo de inspección
                        </h2>
                        <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-500")}>
                            Vehículo: <strong className={isDark ? "text-white" : "text-gray-900"}>{selectedVehicle.plate}</strong>
                            {selectedVehicle.internal_number && ` — #${selectedVehicle.internal_number}`}
                        </p>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <button
                                onClick={() => setInspectionType('pre_trip')}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 transition-all active:scale-95",
                                    isDark ? "bg-zinc-900 border-zinc-700 hover:border-blue-500 hover:bg-blue-500/5 text-white" : "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-900"
                                )}
                            >
                                <LogOut className="w-10 h-10 text-blue-500" />
                                <div className="text-center">
                                    <p className="font-bold text-lg">Salida</p>
                                    <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-500")}>Pre-trip</p>
                                </div>
                            </button>
                            <button
                                onClick={() => setInspectionType('post_trip')}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 transition-all active:scale-95",
                                    isDark ? "bg-zinc-900 border-zinc-700 hover:border-purple-500 hover:bg-purple-500/5 text-white" : "bg-white border-gray-200 hover:border-purple-400 hover:bg-purple-50 text-gray-900"
                                )}
                            >
                                <LogIn className="w-10 h-10 text-purple-500" />
                                <div className="text-center">
                                    <p className="font-bold text-lg">Entrada</p>
                                    <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-500")}>Post-trip</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: Formulario */}
                {step === 'form' && selectedVehicle && inspectionType && (
                    <InspectionForm
                        vehicle={selectedVehicle}
                        inspectionType={inspectionType}
                        onBack={() => setInspectionType(null)}
                        onSuccess={handleReset}
                    />
                )}
            </div>
        </div>
    );
}