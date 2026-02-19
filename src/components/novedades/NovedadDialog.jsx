import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";

const initialState = {
  vehicle_id: "",
  descripcion: "",
  prioridad: "media",
  kilometraje: "",
  horas: ""
};

export default function NovedadDialog({ open, onOpenChange, novedad, onSuccess }) {
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
  const [companyFilter, setCompanyFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [generatedReportNumber, setGeneratedReportNumber] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (open && user) {
      loadVehicles();
      loadCompanies();
      loadLocations();
      if (novedad) {
        setFormData({
          vehicle_id: novedad.vehicle_id || "",
          descripcion: novedad.descripcion || "",
          prioridad: novedad.prioridad || "media",
          kilometraje: "",
          horas: ""
        });
        setGeneratedReportNumber(novedad.report_number);
      } else {
        setFormData(initialState);
        generateReportNumber();
      }
      setError("");
      setSearchTerm("");
      setCompanyFilter("all");
      setLocationFilter("all");
      setShowVehicleSelector(false);
    }
  }, [open, novedad, user]);

  const generateReportNumber = async () => {
    try {
      const { report_number } = await base44.functions.invoke('getNextReportNumber', {
        report_type: 'novedad'
      });
      setGeneratedReportNumber(report_number);
    } catch (err) {
      console.error("Error generating report number:", err);
    }
  };

  useEffect(() => {
    if (formData.vehicle_id) {
      const vehicle = vehicles.find(v => v.id === formData.vehicle_id);
      setSelectedVehicle(vehicle);
      if (vehicle && !novedad) {
        setFormData(prev => ({
          ...prev,
          kilometraje: vehicle.mileage || "",
          horas: vehicle.hours || ""
        }));
      }
    }
  }, [formData.vehicle_id, vehicles, novedad]);

  const loadVehicles = async () => {
    try {
      let allVehicles;
      if (user?.company_id) {
        // Admin de empresa: solo vehículos de su empresa
        allVehicles = await base44.entities.Vehicle.filter({ company_id: user.company_id });
      } else {
        // Super admin: todos los vehículos
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
        // Admin de empresa: solo su empresa
        allCompanies = await base44.entities.Company.filter({ id: user.company_id });
      } else {
        // Super admin: todas las empresas
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
        // Admin de empresa: solo ubicaciones de su empresa
        allLocations = await base44.entities.Location.filter({ company_id: user.company_id });
      } else {
        // Super admin: todas las ubicaciones
        allLocations = await base44.entities.Location.list();
      }
      setLocations(allLocations);
    } catch (err) {
      console.error("Error loading locations:", err);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchTerm === "" || 
      vehicle.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.internal_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = companyFilter === "all" || vehicle.company_id === companyFilter;
    const matchesLocation = locationFilter === "all" || vehicle.location_id === locationFilter;
    
    return matchesSearch && matchesCompany && matchesLocation;
  });

  const filteredLocations = locations.filter(loc => 
    companyFilter === "all" || loc.company_id === companyFilter
  );

  const handleSelectVehicle = (vehicle) => {
    setFormData({ ...formData, vehicle_id: vehicle.id });
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

      // Validar que al menos uno de los dos campos (kilometraje u horas) esté completado
      if (!formData.kilometraje && !formData.horas) {
        throw new Error("Debe ingresar al menos el kilometraje o las horas del vehículo");
      }

      // Validar kilometraje y horas
      const newKm = parseFloat(formData.kilometraje);
      const newHours = parseFloat(formData.horas);

      if (selectedVehicle) {
        if (formData.kilometraje && newKm < (selectedVehicle.mileage || 0)) {
          throw new Error(`El kilometraje no puede ser menor al actual (${selectedVehicle.mileage || 0} km)`);
        }
        if (formData.horas && newHours < (selectedVehicle.hours || 0)) {
          throw new Error(`Las horas no pueden ser menores a las actuales (${selectedVehicle.hours || 0} hs)`);
        }
      }

      // Solo crear novedad si hay descripción
      const shouldCreateNovedad = formData.descripcion && formData.descripcion.trim() !== "";

      // Obtener fecha actual en zona horaria de Buenos Aires (UTC-3)
      const now = new Date();
      // Ajustar a hora de Buenos Aires (UTC-3)
      const utcOffset = now.getTimezoneOffset() * 60000; // offset en milisegundos
      const buenosAiresOffset = -3 * 60 * 60000; // -3 horas en milisegundos
      const buenosAiresTime = new Date(now.getTime() + utcOffset + buenosAiresOffset);
      
      // Formatear como YYYY-MM-DD
      const year = buenosAiresTime.getFullYear();
      const month = String(buenosAiresTime.getMonth() + 1).padStart(2, '0');
      const day = String(buenosAiresTime.getDate()).padStart(2, '0');
      const fechaReporte = `${year}-${month}-${day}`;

      const novedadData = shouldCreateNovedad ? {
        vehicle_id: formData.vehicle_id,
        company_id: selectedVehicle.company_id,
        location_id: selectedVehicle.location_id,
        descripcion: formData.descripcion,
        prioridad: formData.prioridad,
        fecha_reporte: fechaReporte,
        estado: "pendiente",
        kilometraje_reportado: formData.kilometraje ? newKm : null,
        horas_reportadas: formData.horas ? newHours : null,
        report_number: generatedReportNumber
      } : null;

      if (novedad) {
        if (shouldCreateNovedad) {
          await base44.entities.Novedad.update(novedad.id, novedadData);
        }
      } else {
        // Solo crear novedad si hay descripción
        if (shouldCreateNovedad) {
          await base44.entities.Novedad.create(novedadData);
        }
        
        // Siempre actualizar kilometraje y/o horas del vehículo
        const vehicleUpdate = {};
        if (formData.kilometraje) vehicleUpdate.mileage = newKm;
        if (formData.horas) vehicleUpdate.hours = newHours;
        
        if (Object.keys(vehicleUpdate).length > 0) {
          await base44.entities.Vehicle.update(formData.vehicle_id, vehicleUpdate);
        }
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
      <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white')}>
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-3", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            <span>{novedad ? "Editar Novedad" : "Registrar Novedad Diaria"}</span>
            {generatedReportNumber && (
              <span className="text-sm font-mono px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-600 border border-yellow-500/30">
                {generatedReportNumber}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Vehículo *</Label>
            
            {selectedVehicle && !novedad ? (
              <div className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-200'
              )}>
                <div>
                  <p className={cn("font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                    {selectedVehicle.internal_number} - {selectedVehicle.plate}
                  </p>
                  <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                    {selectedVehicle.manufacturer} {selectedVehicle.model}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFormData({ ...formData, vehicle_id: "" });
                    setSelectedVehicle(null);
                  }}
                  className={theme === 'dark' ? 'text-zinc-400 hover:text-white' : ''}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : !novedad ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVehicleSelector(!showVehicleSelector)}
                className={cn(
                  "w-full justify-start",
                  theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white' : ''
                )}
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar vehículo...
              </Button>
            ) : (
              <div className={cn(
                "p-3 rounded-lg border",
                theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-200'
              )}>
                <p className={cn("font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  {selectedVehicle?.internal_number} - {selectedVehicle?.plate}
                </p>
              </div>
            )}

            {showVehicleSelector && !novedad && (
              <div className={cn(
                "border rounded-lg p-4 space-y-3",
                theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200'
              )}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por patente, número interno, marca, modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                      "pl-10",
                      theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                      <SelectValue placeholder="Empresa" />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                      <SelectItem value="all" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>
                        Todas las empresas
                      </SelectItem>
                      {companies.map((company) => (
                        <SelectItem 
                          key={company.id} 
                          value={company.id}
                          className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}
                        >
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={locationFilter} 
                    onValueChange={setLocationFilter}
                    disabled={companyFilter === "all"}
                  >
                    <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                      <SelectValue placeholder="Ubicación" />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                      <SelectItem value="all" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>
                        Todas las ubicaciones
                      </SelectItem>
                      {filteredLocations.map((location) => (
                        <SelectItem 
                          key={location.id} 
                          value={location.id}
                          className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}
                        >
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className={cn(
                  "max-h-64 overflow-y-auto space-y-1 rounded-lg border",
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'
                )}>
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
                        className={cn(
                          "w-full text-left p-3 hover:bg-opacity-80 transition-colors border-b last:border-b-0",
                          theme === 'dark' 
                            ? 'hover:bg-zinc-800 border-zinc-700' 
                            : 'hover:bg-gray-50 border-gray-100'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {vehicle.image_url ? (
                            <img 
                              src={vehicle.image_url} 
                              alt={vehicle.plate}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                              theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'
                            )}>
                              <span className={cn("text-xs font-medium", theme === 'dark' ? 'text-zinc-500' : 'text-gray-400')}>
                                {vehicle.internal_number}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-medium truncate", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                              {vehicle.internal_number} - {vehicle.plate}
                            </p>
                            <p className={cn("text-sm truncate", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                              {vehicle.manufacturer} {vehicle.model}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-400')}>
                              {companies.find(c => c.id === vehicle.company_id)?.name}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <p className={cn("text-xs text-center", theme === 'dark' ? 'text-zinc-500' : 'text-gray-400')}>
                  {filteredVehicles.length} vehículo{filteredVehicles.length !== 1 ? 's' : ''} encontrado{filteredVehicles.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          {selectedVehicle && (
            <div className={cn("grid grid-cols-2 gap-4 p-3 rounded-lg", theme === 'dark' ? 'bg-zinc-800/50' : 'bg-gray-50')}>
              <div>
                <Label className={cn("text-xs", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>Kilometraje Actual</Label>
                <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  {selectedVehicle.mileage || 0} km
                </p>
              </div>
              <div>
                <Label className={cn("text-xs", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>Horas Actuales</Label>
                <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  {selectedVehicle.hours || 0} hs
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Nuevo Kilometraje *</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.kilometraje}
                onChange={(e) => setFormData({ ...formData, kilometraje: e.target.value })}
                placeholder="Ej: 15000"
                className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}
                disabled={!!novedad}
              />
            </div>

            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Nuevas Horas *</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.horas}
                onChange={(e) => setFormData({ ...formData, horas: e.target.value })}
                placeholder="Ej: 500"
                className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}
                disabled={!!novedad}
              />
            </div>
            </div>

            <p className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
            * Debe completar al menos uno de estos campos
            </p>

            <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Descripción de la Novedad</Label>
            <Textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Opcional: Ej: Lámpara trasera derecha quemada"
              rows={3}
              className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}
            />
            <p className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
              Si no hay novedades, dejar vacío
            </p>
          </div>

          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Prioridad</Label>
            <Select
              value={formData.prioridad}
              onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
            >
              <SelectTrigger className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                <SelectItem value="baja" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Baja</SelectItem>
                <SelectItem value="media" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Media</SelectItem>
                <SelectItem value="alta" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Alta</SelectItem>
                <SelectItem value="critica" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className={theme === 'dark' ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed' : 'disabled:opacity-50 disabled:cursor-not-allowed'}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600 text-black disabled:bg-yellow-500/50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : novedad ? "Actualizar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}