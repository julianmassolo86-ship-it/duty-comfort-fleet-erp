import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Search, X, Check, AlertTriangle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const initialState = {
  vehicle_id: "",
  inspection_date: new Date().toISOString().split('T')[0],
  ambient_temperature: "",
  odometer_reading: "",
  tipo_mantenimiento: "preventivo",
  
  // Inspecciones iniciales (1-12)
  inspeccion_1_estado: "pendiente",
  inspeccion_1_observacion: "",
  inspeccion_2_estado: "pendiente",
  inspeccion_2_observacion: "",
  inspeccion_3_estado: "pendiente",
  inspeccion_3_observacion: "",
  inspeccion_4_estado: "pendiente",
  inspeccion_4_observacion: "",
  inspeccion_5_estado: "pendiente",
  inspeccion_5_observacion: "",
  inspeccion_6_estado: "pendiente",
  inspeccion_6_observacion: "",
  inspeccion_7_estado: "pendiente",
  inspeccion_7_observacion: "",
  inspeccion_8_estado: "pendiente",
  inspeccion_8_observacion: "",
  inspeccion_8_presion_estatica: "",
  inspeccion_9_estado: "pendiente",
  inspeccion_9_observacion: "",
  inspeccion_10_estado: "pendiente",
  inspeccion_10_observacion: "",
  inspeccion_10_lp: "",
  inspeccion_10_hp: "",
  inspeccion_11_estado: "pendiente",
  inspeccion_11_observacion: "",
  inspeccion_11_temperatura: "",
  inspeccion_12_estado: "pendiente",
  inspeccion_12_observacion: "",
  inspeccion_12_temperatura: "",
  
  // Componentes
  componente_compresor_estado: "pendiente",
  componente_compresor_observacion: "",
  componente_correa_estado: "pendiente",
  componente_correa_observacion: "",
  componente_poleas_estado: "pendiente",
  componente_poleas_observacion: "",
  componente_condensador_estado: "pendiente",
  componente_condensador_observacion: "",
  componente_evaporador_estado: "pendiente",
  componente_evaporador_observacion: "",
  componente_carga_gas_estado: "pendiente",
  componente_carga_gas_observacion: "",
  componente_filtro_estado: "pendiente",
  componente_filtro_observacion: "",
  componente_valvula_expansion_estado: "pendiente",
  componente_valvula_expansion_observacion: "",
  componente_calefaccion_estado: "pendiente",
  componente_calefaccion_observacion: "",
  componente_electronica_estado: "pendiente",
  componente_electronica_observacion: "",
  componente_mangueras_estado: "pendiente",
  componente_mangueras_observacion: "",
  componente_tapones_estado: "pendiente",
  componente_tapones_observacion: "",
  
  // Mediciones finales
  medicion_final_lp: "",
  medicion_final_hp: "",
  medicion_final_temp_frio_corte: "",
  medicion_final_temp_frio_acople: "",
  medicion_final_temp_calefaccion: "",
  
  estado_final_equipo: "",
  observaciones_finales: "",
  
  mecanico_responsable_name: "",
  planificador_mantenimiento_name: "",
  supervisor_mantenimiento_name: "",
  
  status: "en_proceso"
};

const inspecciones = [
  { id: 6, label: "Comprobar el funcionamiento del forzador en todas las velocidades" },
  { id: 7, label: "Revisar las direcciones del flujo de aire (parabrisas, pies, frente)" },
  { id: 8, label: "Colocar manómetros en válvulas de servicio L/HP y verificar presión estática", hasPressure: true },
  { id: 9, label: "Encender el motor y A/C, confirmar el acople del compresor y ventilaciones" },
  { id: 10, label: "Registrar presiones LP y HP (PSI)", hasFields: true },
  { id: 11, label: "Revisar el estado del rendimiento del sistema con un sensor de temperatura (FRÍO)", hasTemp: true },
  { id: 12, label: "Revisar el estado del rendimiento del sistema con un sensor de temperatura (CALOR)", hasTemp: true },
  { id: 1, label: "Tomar una muestra del estado de aceite" },
  { id: 2, label: "Inspeccionar tuberías o mangueras en búsqueda de fugas de refrigerante o daños visibles" },
  { id: 3, label: "Comprobar la limpieza del condensador, radiador e intercooler (si tiene)" },
  { id: 4, label: "Examinar el estado de cableado y terminales o fichas" },
  { id: 5, label: "Inspeccionar visualmente la correa, el embrague del compresor y ventilador del condensador" }
];

const componentes = [
  { key: "compresor", label: "Compresor" },
  { key: "correa", label: "Correa" },
  { key: "poleas", label: "Poleas" },
  { key: "condensador", label: "Condensador" },
  { key: "evaporador", label: "Evaporador" },
  { key: "carga_gas", label: "Carga de gas refrigerante" },
  { key: "filtro", label: "Filtro de aire y habitáculo" },
  { key: "valvula_expansion", label: "Válvula de expansión" },
  { key: "calefaccion", label: "Funcionamiento de la calefacción" },
  { key: "electronica", label: "Electrónica y controles" },
  { key: "mangueras", label: "Mangueras y tuberías" },
  { key: "tapones", label: "Tapones en válvulas de servicio alta y baja presión" }
];

const StatusIcon = ({ status }) => {
  switch (status) {
    case "ok":
      return <Check className="w-5 h-5 text-green-600" />;
    case "mal":
      return <X className="w-5 h-5 text-red-600" />;
    case "monitorear":
      return <Eye className="w-5 h-5 text-yellow-600" />;
    default:
      return <AlertTriangle className="w-5 h-5 text-gray-400" />;
  }
};

export default function AirConditioningMaintenanceDialog({ open, onOpenChange, maintenance, onSuccess }) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState(initialState);
  const [vehicles, setVehicles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (open && user) {
      loadVehicles();
      loadCompanies();
      loadLocations();
      if (maintenance) {
        setFormData({ ...initialState, ...maintenance });
      } else {
        setFormData(initialState);
      }
      setError("");
      setSearchTerm("");
      setShowVehicleSelector(!maintenance);
    }
  }, [open, maintenance, user]);

  useEffect(() => {
    if (formData.vehicle_id) {
      const vehicle = vehicles.find(v => v.id === formData.vehicle_id);
      setSelectedVehicle(vehicle);
      if (vehicle && !maintenance) {
        setFormData(prev => ({
          ...prev,
          odometer_reading: vehicle.mileage || vehicle.hours || ""
        }));
      }
    }
  }, [formData.vehicle_id, vehicles, maintenance]);

  const loadVehicles = async () => {
    try {
      let allVehicles;
      if (user?.company_id) {
        allVehicles = await base44.entities.Vehicle.filter({ company_id: user.company_id });
      } else {
        allVehicles = await base44.entities.Vehicle.list();
      }
      setVehicles(allVehicles);
    } catch (err) {
      console.error("Error loading vehicles:", err);
    }
  };

  const loadCompanies = async () => {
    try {
      let allCompanies;
      if (user?.company_id) {
        allCompanies = await base44.entities.Company.filter({ id: user.company_id });
      } else {
        allCompanies = await base44.entities.Company.list();
      }
      setCompanies(allCompanies);
    } catch (err) {
      console.error("Error loading companies:", err);
    }
  };

  const loadLocations = async () => {
    try {
      let allLocations;
      if (user?.company_id) {
        allLocations = await base44.entities.Location.filter({ company_id: user.company_id });
      } else {
        allLocations = await base44.entities.Location.list();
      }
      setLocations(allLocations);
    } catch (err) {
      console.error("Error loading locations:", err);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    searchTerm === "" ||
    vehicle.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.internal_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectVehicle = (vehicle) => {
    setFormData({
      ...formData,
      vehicle_id: vehicle.id,
      company_id: vehicle.company_id,
      location_id: vehicle.location_id
    });
    setShowVehicleSelector(false);
    setSearchTerm("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.vehicle_id) {
        throw new Error("Debe seleccionar un vehículo");
      }
      if (!formData.ambient_temperature) {
        throw new Error("Debe ingresar la temperatura ambiente");
      }

      const dataToSave = { ...formData };
      
      // Convertir strings vacíos a null para campos numéricos
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === "" && (
          key.includes("temperatura") || 
          key.includes("lp") || 
          key.includes("hp") ||
          key.includes("presion_estatica") ||
          key === "odometer_reading"
        )) {
          dataToSave[key] = null;
        }
      });

      if (maintenance) {
        await base44.entities.AirConditioningMaintenance.update(maintenance.id, dataToSave);
      } else {
        await base44.entities.AirConditioningMaintenance.create(dataToSave);
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-5xl max-h-[90vh] overflow-y-auto", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white')}>
        <DialogHeader>
          <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
            {maintenance ? "Editar Inspección A/C" : "Nueva Inspección de Aire Acondicionado"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Información del Activo */}
          <div className={cn("p-4 rounded-lg border", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200')}>
            <h3 className={cn("font-semibold mb-4", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
              Información del Activo
            </h3>

            {selectedVehicle && !maintenance ? (
              <div className={cn("flex items-center justify-between p-3 rounded-lg border mb-4", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200')}>
                <div className="flex items-center gap-3">
                  {selectedVehicle.image_url && (
                    <img src={selectedVehicle.image_url} alt={selectedVehicle.plate} className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className={cn("font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                      {selectedVehicle.internal_number} - {selectedVehicle.plate}
                    </p>
                    <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                      {selectedVehicle.manufacturer} {selectedVehicle.model}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFormData({ ...formData, vehicle_id: "", company_id: "", location_id: "" });
                    setSelectedVehicle(null);
                    setShowVehicleSelector(true);
                  }}
                  className={theme === 'dark' ? 'text-zinc-400 hover:text-white' : ''}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : !maintenance && !selectedVehicle ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVehicleSelector(!showVehicleSelector)}
                className={cn("w-full justify-start mb-4", theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white' : '')}
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar vehículo...
              </Button>
            ) : maintenance && selectedVehicle ? (
              <div className={cn("p-3 rounded-lg border mb-4", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200')}>
                <p className={cn("font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  {selectedVehicle.internal_number} - {selectedVehicle.plate}
                </p>
                <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                  {selectedVehicle.manufacturer} {selectedVehicle.model}
                </p>
              </div>
            ) : null}

            {showVehicleSelector && !maintenance && (
              <div className={cn("border rounded-lg p-4 space-y-3 mb-4", theme === 'dark' ? 'bg-zinc-900/50 border-zinc-700' : 'bg-gray-50 border-gray-200')}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por patente, número interno, marca..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn("pl-10", theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : '')}
                  />
                </div>

                <div className={cn("max-h-48 overflow-y-auto space-y-1 rounded-lg border", theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200')}>
                  {filteredVehicles.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                        No se encontraron vehículos
                      </p>
                    </div>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() => handleSelectVehicle(vehicle)}
                        className={cn("w-full text-left p-3 hover:bg-opacity-80 transition-colors border-b last:border-b-0", theme === 'dark' ? 'hover:bg-zinc-700 border-zinc-700' : 'hover:bg-gray-50 border-gray-100')}
                      >
                        <div className="flex items-center gap-3">
                          {vehicle.image_url && (
                            <img src={vehicle.image_url} alt={vehicle.plate} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className={cn("font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                              {vehicle.internal_number} - {vehicle.plate}
                            </p>
                            <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                              {vehicle.manufacturer} {vehicle.model}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Fecha de Inspección *</Label>
                <Input
                  type="date"
                  value={formData.inspection_date}
                  onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                  className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Temperatura Ambiente (°C) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.ambient_temperature}
                  onChange={(e) => setFormData({ ...formData, ambient_temperature: e.target.value })}
                  placeholder="Ej: 25"
                  className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>KMS/HS</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.odometer_reading}
                  onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                  placeholder="Lectura actual"
                  className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Tipo de Mantenimiento</Label>
                <Select
                  value={formData.tipo_mantenimiento}
                  onValueChange={(value) => setFormData({ ...formData, tipo_mantenimiento: value })}
                >
                  <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                    <SelectItem value="preventivo" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Preventivo</SelectItem>
                    <SelectItem value="correctivo" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Correctivo</SelectItem>
                    <SelectItem value="inspeccion" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Inspección</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tabs para Inspecciones, Componentes y Mediciones */}
          <Tabs defaultValue="inspecciones" className="w-full">
            <TabsList className={cn("grid w-full grid-cols-4", theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100')}>
              <TabsTrigger value="inspecciones" className={theme === 'dark' ? 'data-[state=active]:bg-zinc-900' : ''}>
                Inspecciones
              </TabsTrigger>
              <TabsTrigger value="componentes" className={theme === 'dark' ? 'data-[state=active]:bg-zinc-900' : ''}>
                Componentes
              </TabsTrigger>
              <TabsTrigger value="mediciones" className={theme === 'dark' ? 'data-[state=active]:bg-zinc-900' : ''}>
                Mediciones
              </TabsTrigger>
              <TabsTrigger value="final" className={theme === 'dark' ? 'data-[state=active]:bg-zinc-900' : ''}>
                Final
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inspecciones" className="space-y-4 mt-4">
              <h3 className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                Inspección Inicial y Mediciones
              </h3>
              {inspecciones.map((insp) => (
                <div key={insp.id} className={cn("p-4 rounded-lg border", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200')}>
                  <div className="flex items-start gap-3 mb-3">
                    <StatusIcon status={formData[`inspeccion_${insp.id}_estado`]} />
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium mb-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                        {insp.id}. {insp.label}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Select
                          value={formData[`inspeccion_${insp.id}_estado`]}
                          onValueChange={(value) => setFormData({ ...formData, [`inspeccion_${insp.id}_estado`]: value })}
                        >
                          <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                            <SelectItem value="pendiente" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Pendiente</SelectItem>
                            <SelectItem value="ok" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>OK</SelectItem>
                            <SelectItem value="mal" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Mal</SelectItem>
                            <SelectItem value="monitorear" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Monitorear</SelectItem>
                          </SelectContent>
                        </Select>

                        <Textarea
                          value={formData[`inspeccion_${insp.id}_observacion`]}
                          onChange={(e) => setFormData({ ...formData, [`inspeccion_${insp.id}_observacion`]: e.target.value })}
                          placeholder="Observaciones..."
                          rows={1}
                          className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                        />
                      </div>

                      {insp.hasPressure && (
                        <div className="mt-3">
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.inspeccion_8_presion_estatica}
                            onChange={(e) => setFormData({ ...formData, inspeccion_8_presion_estatica: e.target.value })}
                            placeholder="Presión estática (PSI)"
                            className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                          />
                        </div>
                      )}

                      {insp.hasFields && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.inspeccion_10_lp}
                            onChange={(e) => setFormData({ ...formData, inspeccion_10_lp: e.target.value })}
                            placeholder="Presión LP (PSI)"
                            className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                          />
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.inspeccion_10_hp}
                            onChange={(e) => setFormData({ ...formData, inspeccion_10_hp: e.target.value })}
                            placeholder="Presión HP (PSI)"
                            className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                          />
                        </div>
                      )}

                      {insp.hasTemp && (
                        <div className="mt-3">
                          <Input
                            type="number"
                            step="0.1"
                            value={formData[`inspeccion_${insp.id}_temperatura`]}
                            onChange={(e) => setFormData({ ...formData, [`inspeccion_${insp.id}_temperatura`]: e.target.value })}
                            placeholder="Temperatura (°C)"
                            className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="componentes" className="space-y-4 mt-4">
              <h3 className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                Estado de Componentes
              </h3>
              {componentes.map((comp) => (
                <div key={comp.key} className={cn("p-4 rounded-lg border", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200')}>
                  <div className="flex items-start gap-3">
                    <StatusIcon status={formData[`componente_${comp.key}_estado`]} />
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium mb-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                        {comp.label}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Select
                          value={formData[`componente_${comp.key}_estado`]}
                          onValueChange={(value) => setFormData({ ...formData, [`componente_${comp.key}_estado`]: value })}
                        >
                          <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                            <SelectItem value="pendiente" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Pendiente</SelectItem>
                            <SelectItem value="ok" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>OK</SelectItem>
                            <SelectItem value="mal" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Mal</SelectItem>
                            <SelectItem value="monitorear" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Monitorear</SelectItem>
                          </SelectContent>
                        </Select>

                        <Textarea
                          value={formData[`componente_${comp.key}_observacion`]}
                          onChange={(e) => setFormData({ ...formData, [`componente_${comp.key}_observacion`]: e.target.value })}
                          placeholder="Observaciones..."
                          rows={1}
                          className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="mediciones" className="space-y-4 mt-4">
              <h3 className={cn("font-semibold mb-4", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                Mediciones Finales
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Presión LP Final (PSI)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.medicion_final_lp}
                    onChange={(e) => setFormData({ ...formData, medicion_final_lp: e.target.value })}
                    placeholder="LP (PSI)"
                    className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Presión HP Final (PSI)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.medicion_final_hp}
                    onChange={(e) => setFormData({ ...formData, medicion_final_hp: e.target.value })}
                    placeholder="HP (PSI)"
                    className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Temp. Frío Corte (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.medicion_final_temp_frio_corte}
                    onChange={(e) => setFormData({ ...formData, medicion_final_temp_frio_corte: e.target.value })}
                    placeholder="T° Frío Corte"
                    className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Temp. Frío Acople (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.medicion_final_temp_frio_acople}
                    onChange={(e) => setFormData({ ...formData, medicion_final_temp_frio_acople: e.target.value })}
                    placeholder="T° Frío Acople"
                    className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Temp. Calefacción (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.medicion_final_temp_calefaccion}
                    onChange={(e) => setFormData({ ...formData, medicion_final_temp_calefaccion: e.target.value })}
                    placeholder="T° Calefacción"
                    className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="final" className="space-y-4 mt-4">
              <h3 className={cn("font-semibold mb-4", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                Información Final
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Estado Final del Equipo</Label>
                  <Input
                    value={formData.estado_final_equipo}
                    onChange={(e) => setFormData({ ...formData, estado_final_equipo: e.target.value })}
                    placeholder="Ej: Equipo funcionando correctamente"
                    className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Observaciones Finales y Recomendaciones</Label>
                  <Textarea
                    value={formData.observaciones_finales}
                    onChange={(e) => setFormData({ ...formData, observaciones_finales: e.target.value })}
                    placeholder="Observaciones finales y recomendaciones..."
                    rows={4}
                    className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Mecánico Responsable</Label>
                    <Input
                      value={formData.mecanico_responsable_name}
                      onChange={(e) => setFormData({ ...formData, mecanico_responsable_name: e.target.value })}
                      placeholder="Nombre"
                      className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Planificador de Mantenimiento</Label>
                    <Input
                      value={formData.planificador_mantenimiento_name}
                      onChange={(e) => setFormData({ ...formData, planificador_mantenimiento_name: e.target.value })}
                      placeholder="Nombre"
                      className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Supervisor de Mantenimiento</Label>
                    <Input
                      value={formData.supervisor_mantenimiento_name}
                      onChange={(e) => setFormData({ ...formData, supervisor_mantenimiento_name: e.target.value })}
                      placeholder="Nombre"
                      className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Estado del Informe</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                      <SelectItem value="en_proceso" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>En Proceso</SelectItem>
                      <SelectItem value="completado" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Completado</SelectItem>
                      <SelectItem value="aprobado" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Aprobado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: theme === 'dark' ? 'rgb(63, 63, 70)' : 'rgb(229, 231, 235)' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className={theme === 'dark' ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : ''}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : maintenance ? "Actualizar" : "Guardar Inspección"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}