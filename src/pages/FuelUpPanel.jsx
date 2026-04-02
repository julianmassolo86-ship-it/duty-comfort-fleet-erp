import { useState, useEffect, useContext } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { ThemeContextValue } from "@/components/common/ThemeWrapper";
import VehicleSearchPanel from "@/components/inspector/VehicleSearchPanel";
import FuelUpForm from "@/components/fuelup/FuelUpForm";
import { Fuel } from "lucide-react";

export default function FuelUpPanel() {
    const { theme } = useContext(ThemeContextValue) || { theme: 'light' };
    const isDark = theme === 'dark';

    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        base44.auth.me().then(setUser).catch(() => {});
        base44.entities.Vehicle.list().then(setVehicles).catch(() => {});
    }, []);

    const handleReset = () => {
        setSelectedVehicle(null);
    };

    return (
        <div className={cn("min-h-screen", isDark ? "bg-black" : "bg-gray-50")}>
            {/* Header */}
            <div className={cn("sticky top-0 z-10 border-b px-4 py-4", isDark ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-200")}>
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isDark ? "bg-yellow-500/10" : "bg-yellow-100")}>
                        <Fuel className={cn("w-5 h-5", isDark ? "text-yellow-400" : "text-yellow-600")} />
                    </div>
                    <div>
                        <h1 className={cn("font-bold text-lg leading-tight", isDark ? "text-white" : "text-gray-900")}>Carga de Combustible</h1>
                        {user && <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>{user.full_name || user.email}</p>}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* STEP 1: Buscar vehículo */}
                {!selectedVehicle && (
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

                {/* STEP 2: Formulario de carga */}
                {selectedVehicle && (
                    <FuelUpForm
                        vehicle={selectedVehicle}
                        user={user}
                        onBack={handleReset}
                        onSuccess={handleReset}
                    />
                )}
            </div>
        </div>
    );
}