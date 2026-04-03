import { useState, useContext } from "react";
import { Fuel, Car, Hash, ArrowLeft, Loader2, AlertTriangle, CheckCircle2, Camera, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ThemeContextValue } from "@/components/common/ThemeWrapper";
import { base44 } from "@/api/base44Client";

const FUEL_TYPES = [
    { value: "diesel",    label: "Diésel",    unit: "litros",  unitShort: "L",   unitLabel: "Litros cargados *",     priceLabel: "Precio / Litro" },
    { value: "gasoline",  label: "Nafta",     unit: "litros",  unitShort: "L",   unitLabel: "Litros cargados *",     priceLabel: "Precio / Litro" },
    { value: "gnc",       label: "GNC",       unit: "m³",      unitShort: "m³",  unitLabel: "Metros cúbicos cargados *", priceLabel: "Precio / m³" },
    { value: "gnv",       label: "GNV",       unit: "m³",      unitShort: "m³",  unitLabel: "Metros cúbicos cargados *", priceLabel: "Precio / m³" },
    { value: "biodiesel", label: "Biodiesel", unit: "litros",  unitShort: "L",   unitLabel: "Litros cargados *",     priceLabel: "Precio / Litro" },
    { value: "ethanol",   label: "Etanol",    unit: "litros",  unitShort: "L",   unitLabel: "Litros cargados *",     priceLabel: "Precio / Litro" },
    { value: "electric",  label: "Eléctrico", unit: "kWh",     unitShort: "kWh", unitLabel: "kWh cargados *",        priceLabel: "Precio / kWh" },
    { value: "otro",      label: "Otro",      unit: "litros",  unitShort: "L",   unitLabel: "Cantidad cargada *",    priceLabel: "Precio / Unidad" },
];

export default function FuelUpForm({ vehicle, user, onBack, onSuccess }) {
    const { theme } = useContext(ThemeContextValue) || { theme: 'light' };
    const isDark = theme === 'dark';

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const [fuelDate, setFuelDate] = useState(todayStr);
    const [km, setKm] = useState(vehicle.mileage || "");
    const [miles, setMiles] = useState(vehicle.miles || "");
    const [hours, setHours] = useState(vehicle.hours || "");
    const [fuelQuantity, setFuelQuantity] = useState("");
    const [pricePerUnit, setPricePerUnit] = useState("");
    const [totalPrice, setTotalPrice] = useState("");
    const [fuelType, setFuelType] = useState(vehicle.fuel_type || "diesel");
    const [isFullTank, setIsFullTank] = useState(false);
    const [notes, setNotes] = useState("");
    const [ticketPhoto, setTicketPhoto] = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [consumoInfo, setConsumoInfo] = useState(null);
    const [telemetriaError, setTelemetriaError] = useState("");
    const [fuelError, setFuelError] = useState("");

    const selectedFuelType = FUEL_TYPES.find(ft => ft.value === fuelType) || FUEL_TYPES[0];

    const vehicleUsesKm = vehicle.mileage != null && vehicle.mileage > 0;
    const vehicleUsesMiles = vehicle.miles != null && vehicle.miles > 0;
    const vehicleUsesHours = vehicle.hours != null && vehicle.hours > 0;

    const handlePricePerUnitChange = (val) => {
        setPricePerUnit(val);
        if (val && fuelQuantity) {
            setTotalPrice((parseFloat(val) * parseFloat(fuelQuantity)).toFixed(2));
        }
    };

    const handleTotalPriceChange = (val) => {
        setTotalPrice(val);
        if (val && fuelQuantity) {
            setPricePerUnit((parseFloat(val) / parseFloat(fuelQuantity)).toFixed(4));
        }
    };

    const handleFuelQuantityChange = (val) => {
        setFuelQuantity(val);
        if (val && pricePerUnit) {
            setTotalPrice((parseFloat(val) * parseFloat(pricePerUnit)).toFixed(2));
        } else if (val && totalPrice) {
            setPricePerUnit((parseFloat(totalPrice) / parseFloat(val)).toFixed(4));
        }
        setFuelError("");
    };

    const handlePhotoUpload = async (file) => {
        if (!file) return;
        setUploadingPhoto(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setTicketPhoto(file_url);
        setUploadingPhoto(false);
    };

    const handleSubmit = async () => {
        // Validar telemetría
        if (km && miles) {
            setTelemetriaError("No se pueden cargar kilómetros y millas al mismo tiempo.");
            return;
        }
        if (!km && !miles && !hours) {
            setTelemetriaError("Debe completar al menos un campo de telemetría.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setTelemetriaError("");

        // Validar combustible
        if (!fuelQuantity || parseFloat(fuelQuantity) <= 0) {
            setFuelError(`Debe ingresar la cantidad de ${selectedFuelType.unit} cargados.`);
            return;
        }
        setFuelError("");

        setLoading(true);
        const res = await base44.functions.invoke('submitFuelUp', {
            vehicle_id: vehicle.id,
            company_id: vehicle.company_id,
            location_id: vehicle.location_id,
            fuel_date: fuelDate,
            mileage: km ? Number(km) : null,
            miles: miles ? Number(miles) : null,
            hours: hours ? Number(hours) : null,
            fuel_quantity: Number(fuelQuantity),
            price_per_unit: pricePerUnit ? Number(pricePerUnit) : null,
            total_price: totalPrice ? Number(totalPrice) : null,
            fuel_type: fuelType,
            is_full_tank: isFullTank,
            ticket_photo_url: ticketPhoto || null,
            notes: notes || null,
        });
        setLoading(false);
        setConsumoInfo(res.data?.consumo || null);
        setDone(true);
    };

    if (done) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
                <div className={cn("w-20 h-20 rounded-full flex items-center justify-center", isDark ? "bg-green-500/10" : "bg-green-50")}>
                    <CheckCircle2 className={cn("w-10 h-10", isDark ? "text-green-400" : "text-green-500")} />
                </div>
                <div>
                    <h2 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>
                        Carga registrada
                    </h2>
                    <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-500")}>
                        {isFullTank ? "Se marcó como tanque lleno." : "Carga parcial registrada."}
                    </p>
                    {consumoInfo && (
                        <div className={cn("mt-4 p-4 rounded-2xl border text-left", isDark ? "bg-zinc-900 border-yellow-500/30" : "bg-yellow-50 border-yellow-200")}>
                            <p className={cn("text-xs font-bold uppercase tracking-wide mb-2", isDark ? "text-yellow-400" : "text-yellow-700")}>
                                ⚡ Consumo calculado
                            </p>
                            <p className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                                {consumoInfo.valor} {consumoInfo.unidad || "L/100km"}
                            </p>
                            <p className={cn("text-xs mt-1", isDark ? "text-zinc-400" : "text-gray-500")}>
                                {consumoInfo.litros_totales}{consumoInfo.unitShort || "L"} en {consumoInfo.distancia} {consumoInfo.distancia_unidad || "km"} ({consumoInfo.cargas_incluidas} carga{consumoInfo.cargas_incluidas > 1 ? 's' : ''} incluida{consumoInfo.cargas_incluidas > 1 ? 's' : ''})
                            </p>
                        </div>
                    )}
                </div>
                <Button onClick={onSuccess} className="h-12 px-8 text-base bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl">
                    Nueva carga
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header vehículo */}
            <div className={cn("flex items-center gap-3 p-4 rounded-2xl border", isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-gray-200")}>
                <button onClick={onBack} className={cn("p-2 rounded-lg", isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-gray-100 text-gray-500")}>
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
            </div>

            {/* Fecha de carga */}
            <div className={cn("p-4 rounded-2xl border space-y-2", isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-gray-200")}>
                <h3 className={cn("font-bold text-sm uppercase tracking-wide", isDark ? "text-zinc-400" : "text-gray-500")}>
                    Fecha de carga
                </h3>
                <div className={cn("flex items-center gap-3 p-3 rounded-xl border-2 transition-all", fuelDate ? (isDark ? "border-yellow-500/50 bg-yellow-500/5" : "border-yellow-400 bg-yellow-50") : (isDark ? "border-zinc-700" : "border-gray-200"))}>
                    <CalendarIcon className={cn("w-5 h-5 shrink-0", isDark ? "text-yellow-400" : "text-yellow-600")} />
                    <input
                        type="date"
                        value={fuelDate}
                        onChange={e => setFuelDate(e.target.value)}
                        className={cn(
                            "flex-1 bg-transparent border-0 outline-none text-base font-medium",
                            isDark ? "text-white" : "text-gray-900"
                        )}
                    />
                </div>
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
            </div>

            {/* Datos de la carga */}
            <div className={cn("p-4 rounded-2xl border space-y-4", isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-gray-200")}>
                <h3 className={cn("font-bold text-sm uppercase tracking-wide", isDark ? "text-zinc-400" : "text-gray-500")}>
                    Datos de la carga
                </h3>

                {/* Tipo de combustible */}
                <div>
                    <label className={cn("text-xs font-bold mb-2 block uppercase tracking-wide", isDark ? "text-zinc-400" : "text-gray-500")}>
                        Tipo de combustible
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {FUEL_TYPES.map(ft => (
                            <button
                                key={ft.value}
                                type="button"
                                onClick={() => setFuelType(ft.value)}
                                className={cn(
                                    "px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all",
                                    fuelType === ft.value
                                        ? (isDark ? "border-yellow-500 bg-yellow-500/10 text-yellow-400" : "border-yellow-500 bg-yellow-50 text-yellow-700")
                                        : (isDark ? "border-zinc-700 text-zinc-400 hover:border-zinc-500" : "border-gray-200 text-gray-600 hover:border-gray-300")
                                )}
                            >
                                {ft.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cantidad según tipo de combustible */}
                <div className={cn("p-3 rounded-xl border-2 transition-all", fuelQuantity ? (isDark ? "border-green-500/50 bg-green-500/5" : "border-green-400 bg-green-50") : (isDark ? "border-zinc-700" : "border-gray-200"))}>
                    <label className={cn("text-xs font-bold mb-1 block uppercase tracking-wide", fuelQuantity ? (isDark ? "text-green-400" : "text-green-600") : (isDark ? "text-zinc-400" : "text-gray-500"))}>
                        {selectedFuelType.unitLabel}
                    </label>
                    <Input
                        type="number"
                        placeholder="0.00"
                        value={fuelQuantity}
                        onChange={e => handleFuelQuantityChange(e.target.value)}
                        className={cn("h-12 text-center text-lg font-bold border-0 bg-transparent p-0 focus-visible:ring-0", isDark ? "text-white placeholder:text-zinc-600" : "text-gray-900 placeholder:text-gray-300")}
                    />
                </div>
                {fuelError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {fuelError}
                    </p>
                )}

                {/* Precio */}
                <div className="grid grid-cols-2 gap-3">
                    <div className={cn("p-3 rounded-xl border-2 transition-all", isDark ? "border-zinc-700" : "border-gray-200")}>
                        <label className={cn("text-xs font-bold mb-1 block uppercase tracking-wide", isDark ? "text-zinc-400" : "text-gray-500")}>
                            {selectedFuelType.priceLabel}
                        </label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={pricePerUnit}
                            onChange={e => handlePricePerUnitChange(e.target.value)}
                            className={cn("h-10 text-center text-base font-bold border-0 bg-transparent p-0 focus-visible:ring-0", isDark ? "text-white placeholder:text-zinc-600" : "text-gray-900 placeholder:text-gray-300")}
                        />
                    </div>
                    <div className={cn("p-3 rounded-xl border-2 transition-all", isDark ? "border-zinc-700" : "border-gray-200")}>
                        <label className={cn("text-xs font-bold mb-1 block uppercase tracking-wide", isDark ? "text-zinc-400" : "text-gray-500")}>
                            Precio total
                        </label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={totalPrice}
                            onChange={e => handleTotalPriceChange(e.target.value)}
                            className={cn("h-10 text-center text-base font-bold border-0 bg-transparent p-0 focus-visible:ring-0", isDark ? "text-white placeholder:text-zinc-600" : "text-gray-900 placeholder:text-gray-300")}
                        />
                    </div>
                </div>

                {/* Tanque lleno */}
                <button
                    type="button"
                    onClick={() => setIsFullTank(v => !v)}
                    className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                        isFullTank
                            ? (isDark ? "border-green-500/50 bg-green-500/10" : "border-green-400 bg-green-50")
                            : (isDark ? "border-zinc-700 bg-zinc-900/50" : "border-gray-200 bg-gray-50")
                    )}
                >
                    <div className="text-left">
                        <p className={cn("font-bold text-sm", isFullTank ? (isDark ? "text-green-400" : "text-green-700") : (isDark ? "text-zinc-200" : "text-gray-700"))}>
                            ¿Tanque lleno?
                        </p>
                        <p className={cn("text-xs mt-0.5", isDark ? "text-zinc-500" : "text-gray-400")}>
                            {isFullTank
                                ? `✓ Sí — se usará para calcular el consumo (${selectedFuelType.unitShort}/${fuelType === 'electric' ? 'kWh' : '100km'})`
                                : "No — carga parcial, no se calcula consumo"}
                        </p>
                    </div>
                    <div className={cn(
                        "w-12 h-6 rounded-full transition-all relative flex items-center",
                        isFullTank ? "bg-green-500" : (isDark ? "bg-zinc-700" : "bg-gray-300")
                    )}>
                        <div className={cn(
                            "w-5 h-5 rounded-full bg-white shadow transition-all absolute",
                            isFullTank ? "left-6" : "left-0.5"
                        )} />
                    </div>
                </button>

                {/* Foto del ticket */}
                <div>
                    <label className={cn("text-xs font-bold mb-2 block uppercase tracking-wide", isDark ? "text-zinc-400" : "text-gray-500")}>
                        Foto del ticket (opcional)
                    </label>
                    {ticketPhoto ? (
                        <div className="relative">
                            <img src={ticketPhoto} alt="Ticket" className="w-full h-40 object-cover rounded-xl" />
                            <button
                                type="button"
                                onClick={() => setTicketPhoto(null)}
                                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs"
                            >✕</button>
                        </div>
                    ) : (
                        <label className={cn(
                            "flex items-center justify-center gap-2 w-full h-16 rounded-xl border-2 border-dashed cursor-pointer transition-all",
                            isDark ? "border-zinc-700 hover:border-zinc-500 text-zinc-500" : "border-gray-300 hover:border-gray-400 text-gray-400"
                        )}>
                            {uploadingPhoto
                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                : <><Camera className="w-5 h-5" /><span className="text-sm">Subir foto del ticket</span></>
                            }
                            <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e.target.files[0])} />
                        </label>
                    )}
                </div>

                {/* Notas */}
                <div>
                    <label className={cn("text-xs font-bold mb-2 block uppercase tracking-wide", isDark ? "text-zinc-400" : "text-gray-500")}>
                        Observaciones (opcional)
                    </label>
                    <textarea
                        placeholder="Notas adicionales sobre la carga..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        className={cn(
                            "w-full p-3 rounded-xl border text-sm resize-none outline-none",
                            isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-yellow-400"
                        )}
                    />
                </div>
            </div>

            {/* Submit */}
            <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-14 text-lg font-bold bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Fuel className="w-5 h-5 mr-2" />}
                {loading ? "Guardando..." : "Confirmar carga"}
            </Button>
        </div>
    );
}