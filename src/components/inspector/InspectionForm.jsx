import { useState, useContext } from "react";
import { CheckCircle2, XCircle, MinusCircle, Car, Hash, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ThemeContextValue } from "@/components/common/ThemeWrapper";
import { base44 } from "@/api/base44Client";

const CHECKLIST_ITEMS = [
    { key: "luces_delanteras", label: "Luces delanteras" },
    { key: "luces_traseras", label: "Luces traseras" },
    { key: "frenos", label: "Frenos" },
    { key: "nivel_aceite", label: "Nivel de aceite" },
    { key: "nivel_agua", label: "Nivel de agua/refrigerante" },
    { key: "neumaticos", label: "Neumáticos" },
    { key: "limpieza_cabina", label: "Limpieza de cabina" },
    { key: "documentacion", label: "Documentación en regla" },
    { key: "extintor", label: "Extintor" },
    { key: "cinturon_seguridad", label: "Cinturón de seguridad" },
    { key: "espejos", label: "Espejos" },
    { key: "carroceria", label: "Carrocería" },
];

const defaultChecklist = () => Object.fromEntries(CHECKLIST_ITEMS.map(i => [i.key, "n/a"]));

function ChecklistItem({ label, value, onChange, isDark }) {
    const options = [
        { val: "ok", icon: CheckCircle2, color: isDark ? "text-green-400 bg-green-500/10 border-green-500/30" : "text-green-600 bg-green-50 border-green-300" },
        { val: "mal", icon: XCircle, color: isDark ? "text-red-400 bg-red-500/10 border-red-500/30" : "text-red-600 bg-red-50 border-red-300" },
        { val: "n/a", icon: MinusCircle, color: isDark ? "text-zinc-400 bg-zinc-800 border-zinc-600" : "text-gray-400 bg-gray-100 border-gray-300" },
    ];

    return (
        <div className={cn("flex items-center justify-between p-3 rounded-xl border", isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-gray-50 border-gray-200")}>
            <span className={cn("text-sm font-medium", isDark ? "text-zinc-200" : "text-gray-700")}>{label}</span>
            <div className="flex gap-2">
                {options.map(({ val, icon: Icon, color }) => (
                    <button
                        key={val}
                        type="button"
                        onClick={() => onChange(val)}
                        className={cn(
                            "w-9 h-9 rounded-lg border flex items-center justify-center transition-all active:scale-90",
                            value === val ? color : isDark ? "border-zinc-700 text-zinc-600 hover:text-zinc-400" : "border-gray-200 text-gray-300 hover:text-gray-500"
                        )}
                    >
                        <Icon className="w-5 h-5" />
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function InspectionForm({ vehicle, inspectionType, onBack, onSuccess }) {
    const { theme } = useContext(ThemeContextValue) || { theme: 'light' };
    const isDark = theme === 'dark';

    const [checklist, setChecklist] = useState(defaultChecklist());
    const [km, setKm] = useState(vehicle.mileage || "");
    const [miles, setMiles] = useState(vehicle.miles || "");
    const [hours, setHours] = useState(vehicle.hours || "");
    const [novedadesDesc, setNovedadesDesc] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [createdNovedad, setCreatedNovedad] = useState(false);
    const [telemetriaError, setTelemetriaError] = useState("");
    const [checklistError, setChecklistError] = useState("");

    // Detectar qué tipo de distancia usa el vehículo según sus datos
    const vehicleUsesKm = vehicle.mileage != null && vehicle.mileage > 0;
    const vehicleUsesMiles = vehicle.miles != null && vehicle.miles > 0;
    const vehicleUsesHours = vehicle.hours != null && vehicle.hours > 0;

    const hasIssues = Object.values(checklist).some(v => v === 'mal') || novedadesDesc.trim().length > 0;

    const validateTelemetria = () => {
        if (km && miles) {
            setTelemetriaError("No se pueden cargar kilómetros y millas al mismo tiempo.");
            return false;
        }
        if (!km && !miles && !hours) {
            setTelemetriaError("Debe completar al menos un campo: kilómetros, millas u horas.");
            return false;
        }
        setTelemetriaError("");
        return true;
    };

    const handleBack = () => {
        if (!km && !miles && !hours) {
            setTelemetriaError("Debe completar la telemetría antes de salir.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        onBack();
    };

    const handleSubmit = async () => {
        if (!validateTelemetria()) return;

        const allNA = Object.values(checklist).every(v => v === 'n/a');
        if (allNA) {
            setChecklistError("Debe revisar el checklist. No puede confirmar con todos los ítems en N/A.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setChecklistError("");
        setLoading(true);
        const res = await base44.functions.invoke('submitVehicleInspection', {
            vehicle_id: vehicle.id,
            company_id: vehicle.company_id,
            location_id: vehicle.location_id,
            type: inspectionType,
            mileage: km ? Number(km) : null,
            miles: miles ? Number(miles) : null,
            hours: hours ? Number(hours) : null,
            checklist,
            novedades_descripcion: novedadesDesc,
        });
        setLoading(false);
        setCreatedNovedad(!!res.data?.novedad_id);
        setDone(true);
    };

    if (done) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
                <div className={cn("w-20 h-20 rounded-full flex items-center justify-center", createdNovedad ? (isDark ? "bg-orange-500/10" : "bg-orange-50") : (isDark ? "bg-green-500/10" : "bg-green-50"))}>
                    {createdNovedad
                        ? <AlertTriangle className={cn("w-10 h-10", isDark ? "text-orange-400" : "text-orange-500")} />
                        : <CheckCircle2 className={cn("w-10 h-10", isDark ? "text-green-400" : "text-green-500")} />
                    }
                </div>
                <div>
                    <h2 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>
                        {createdNovedad ? "Inspección con novedades" : "Inspección completada"}
                    </h2>
                    <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-500")}>
                        {createdNovedad
                            ? "Se generó automáticamente una novedad para el administrador de la flota."
                            : "La inspección fue guardada correctamente."}
                    </p>
                </div>
                <Button onClick={onSuccess} className="h-12 px-8 text-base bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl">
                    Nueva inspección
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header vehículo */}
            <div className={cn("flex items-center gap-3 p-4 rounded-2xl border", isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-gray-200")}>
                <button onClick={handleBack} className={cn("p-2 rounded-lg", isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-gray-100 text-gray-500")}>
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isDark ? "bg-zinc-800" : "bg-gray-100")}>
                    <Car className={cn("w-5 h-5", isDark ? "text-zinc-400" : "text-gray-500")} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={cn("font-bold", isDark ? "text-white" : "text-gray-900")}>{vehicle.plate}</p>
                    <p className={cn("text-xs", isDark ? "text-zinc-400" : "text-gray-500")}>{vehicle.manufacturer} {vehicle.model}</p>
                </div>
                {vehicle.internal_number && (
                    <div className={cn("px-3 py-1 rounded-lg text-sm font-mono font-bold flex items-center gap-1", isDark ? "bg-yellow-500/10 text-yellow-400" : "bg-yellow-100 text-yellow-700")}>
                        <Hash className="w-3 h-3" />
                        {vehicle.internal_number}
                    </div>
                )}
                <span className={cn("text-xs font-bold px-3 py-1 rounded-full", inspectionType === 'pre_trip' ? (isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-100 text-blue-700") : (isDark ? "bg-purple-500/10 text-purple-400" : "bg-purple-100 text-purple-700"))}>
                    {inspectionType === 'pre_trip' ? '🚀 Salida' : '🏁 Entrada'}
                </span>
            </div>

            {/* Telemetría */}
            <div className={cn("p-4 rounded-2xl border space-y-3", isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-gray-200")}>
                <h3 className={cn("font-bold text-sm uppercase tracking-wide", isDark ? "text-zinc-400" : "text-gray-500")}>
                    Telemetría <span className={cn("normal-case font-normal text-xs ml-1", isDark ? "text-zinc-500" : "text-gray-400")}>(al menos un campo obligatorio)</span>
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Kilómetros */}
                    <div className={cn("p-3 rounded-xl border-2 transition-all", km ? (isDark ? "border-blue-500/50 bg-blue-500/5" : "border-blue-400 bg-blue-50") : (isDark ? "border-zinc-700" : "border-gray-200"))}>
                        <label className={cn("text-xs font-bold mb-1 block uppercase tracking-wide", km ? (isDark ? "text-blue-400" : "text-blue-600") : (isDark ? "text-zinc-400" : "text-gray-500"))}>
                            Kilómetros
                        </label>
                        <Input
                            type="number"
                            placeholder={vehicleUsesKm ? String(vehicle.mileage) : "—"}
                            value={km}
                            onChange={e => { setKm(e.target.value); if (e.target.value) setMiles(""); setTelemetriaError(""); }}
                            disabled={!!miles}
                            className={cn("h-12 text-center text-lg font-bold border-0 bg-transparent p-0 focus-visible:ring-0", isDark ? "text-white placeholder:text-zinc-600" : "text-gray-900 placeholder:text-gray-300", miles ? "opacity-30 cursor-not-allowed" : "")}
                        />
                    </div>

                    {/* Millas */}
                    <div className={cn("p-3 rounded-xl border-2 transition-all", miles ? (isDark ? "border-indigo-500/50 bg-indigo-500/5" : "border-indigo-400 bg-indigo-50") : (isDark ? "border-zinc-700" : "border-gray-200"))}>
                        <label className={cn("text-xs font-bold mb-1 block uppercase tracking-wide", miles ? (isDark ? "text-indigo-400" : "text-indigo-600") : (isDark ? "text-zinc-400" : "text-gray-500"))}>
                            Millas
                        </label>
                        <Input
                            type="number"
                            placeholder={vehicleUsesMiles ? String(vehicle.miles) : "—"}
                            value={miles}
                            onChange={e => { setMiles(e.target.value); if (e.target.value) setKm(""); setTelemetriaError(""); }}
                            disabled={!!km}
                            className={cn("h-12 text-center text-lg font-bold border-0 bg-transparent p-0 focus-visible:ring-0", isDark ? "text-white placeholder:text-zinc-600" : "text-gray-900 placeholder:text-gray-300", km ? "opacity-30 cursor-not-allowed" : "")}
                        />
                    </div>

                    {/* Horas */}
                    <div className={cn("p-3 rounded-xl border-2 transition-all", hours ? (isDark ? "border-amber-500/50 bg-amber-500/5" : "border-amber-400 bg-amber-50") : (isDark ? "border-zinc-700" : "border-gray-200"))}>
                        <label className={cn("text-xs font-bold mb-1 block uppercase tracking-wide", hours ? (isDark ? "text-amber-400" : "text-amber-600") : (isDark ? "text-zinc-400" : "text-gray-500"))}>
                            Horas
                        </label>
                        <Input
                            type="number"
                            placeholder={vehicleUsesHours ? String(vehicle.hours) : "—"}
                            value={hours}
                            onChange={e => { setHours(e.target.value); setTelemetriaError(""); }}
                            className={cn("h-12 text-center text-lg font-bold border-0 bg-transparent p-0 focus-visible:ring-0", isDark ? "text-white placeholder:text-zinc-600" : "text-gray-900 placeholder:text-gray-300")}
                        />
                    </div>
                </div>

                {telemetriaError && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" /> {telemetriaError}
                    </p>
                )}

                {km && miles && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> No se pueden cargar kilómetros y millas al mismo tiempo.
                    </p>
                )}
            </div>

            {/* Checklist */}
            <div className={cn("p-4 rounded-2xl border space-y-3", isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-gray-200")}>
                {checklistError && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mb-2">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {checklistError}
                    </p>
                )}
                <div className="flex items-center justify-between mb-1">
                    <h3 className={cn("font-bold text-sm uppercase tracking-wide", isDark ? "text-zinc-400" : "text-gray-500")}>Checklist</h3>
                    <div className="flex items-center gap-3 text-xs">
                        <span className={isDark ? "text-green-400" : "text-green-600"}>✓ OK</span>
                        <span className={isDark ? "text-red-400" : "text-red-600"}>✗ MAL</span>
                        <span className={isDark ? "text-zinc-500" : "text-gray-400"}>— N/A</span>
                    </div>
                </div>
                <div className="space-y-2">
                    {CHECKLIST_ITEMS.map(item => (
                        <ChecklistItem
                            key={item.key}
                            label={item.label}
                            value={checklist[item.key]}
                            onChange={val => setChecklist(prev => ({ ...prev, [item.key]: val }))}
                            isDark={isDark}
                        />
                    ))}
                </div>
            </div>

            {/* Novedades */}
            {(inspectionType === 'post_trip' || hasIssues) && (
                <div className={cn("p-4 rounded-2xl border space-y-3", isDark ? "bg-orange-500/5 border-orange-500/20" : "bg-orange-50 border-orange-200")}>
                    <h3 className={cn("font-bold text-sm uppercase tracking-wide flex items-center gap-2", isDark ? "text-orange-400" : "text-orange-600")}>
                        <AlertTriangle className="w-4 h-4" />
                        Novedades / Observaciones
                    </h3>
                    <textarea
                        placeholder="Describa cualquier problema, daño o novedad detectada..."
                        value={novedadesDesc}
                        onChange={e => setNovedadesDesc(e.target.value)}
                        rows={3}
                        className={cn(
                            "w-full p-3 rounded-xl border text-sm resize-none outline-none",
                            isDark ? "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500" : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-400"
                        )}
                    />
                    {hasIssues && (
                        <p className={cn("text-xs", isDark ? "text-orange-400" : "text-orange-600")}>
                            ⚠ Se generará una novedad automáticamente para el administrador de la flota.
                        </p>
                    )}
                </div>
            )}

            {/* Submit */}
            <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-14 text-lg font-bold bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {loading ? "Guardando..." : "Confirmar inspección"}
            </Button>
        </div>
    );
}