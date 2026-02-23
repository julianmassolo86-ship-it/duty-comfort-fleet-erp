import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";
import { Search, AlertCircle, Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function BulkACReportDialog({ open, onOpenChange, onSuccess }) {
  const { theme } = useTheme();
  const [vehicles, setVehicles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const [formData, setFormData] = useState({
    inspection_date: new Date().toISOString().split('T')[0],
    ambient_temperature: "",
    tipo_mantenimiento: "preventivo"
  });

  useEffect(() => {
    if (open) {
      base44.auth.me().then(setUser).catch(() => {});
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [vehiclesData, companiesData, locationsData] = await Promise.all([
        user?.company_id 
          ? base44.entities.Vehicle.filter({ company_id: user.company_id })
          : base44.entities.Vehicle.list(),
        user?.company_id
          ? base44.entities.Company.filter({ id: user.company_id })
          : base44.entities.Company.list(),
        user?.company_id
          ? base44.entities.Location.filter({ company_id: user.company_id })
          : base44.entities.Location.list()
      ]);
      
      setVehicles(vehiclesData);
      setCompanies(companiesData);
      setLocations(locationsData);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchTerm === "" || 
      vehicle.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.internal_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = companyFilter === "all" || vehicle.company_id === companyFilter;
    const matchesLocation = locationFilter === "all" || vehicle.location_id === locationFilter;
    
    return matchesSearch && matchesCompany && matchesLocation;
  });

  const handleToggleVehicle = (vehicleId) => {
    setSelectedVehicles(prev =>
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleSelectAll = () => {
    if (selectedVehicles.length === filteredVehicles.length) {
      setSelectedVehicles([]);
    } else {
      setSelectedVehicles(filteredVehicles.map(v => v.id));
    }
  };

  const handleGenerate = async () => {
    if (selectedVehicles.length === 0) return;
    
    setLoading(true);
    setShowResults(false);
    setProgress(0);
    const newResults = [];

    try {
      for (let i = 0; i < selectedVehicles.length; i++) {
        const vehicleId = selectedVehicles[i];
        const vehicle = vehicles.find(v => v.id === vehicleId);
        
        try {
          const { report_number } = await base44.functions.invoke('getNextReportNumber', {
            report_type: 'ac_maintenance'
          });

          const reportData = {
            vehicle_id: vehicleId,
            company_id: vehicle.company_id,
            location_id: vehicle.location_id,
            inspection_date: formData.inspection_date,
            ambient_temperature: formData.ambient_temperature || null,
            tipo_mantenimiento: formData.tipo_mantenimiento,
            kilometraje: vehicle.mileage || null,
            horas: vehicle.hours || null,
            report_number: report_number,
            status: 'en_proceso'
          };

          await base44.entities.AirConditioningMaintenance.create(reportData);
          
          newResults.push({
            vehicle: `${vehicle.internal_number} - ${vehicle.plate}`,
            success: true,
            reportNumber: report_number
          });
        } catch (err) {
          newResults.push({
            vehicle: `${vehicle.internal_number} - ${vehicle.plate}`,
            success: false,
            error: err.message
          });
        }

        setProgress(Math.round(((i + 1) / selectedVehicles.length) * 100));
      }

      setResults(newResults);
      setShowResults(true);
      
      if (newResults.every(r => r.success)) {
        setTimeout(() => {
          onSuccess?.();
          onOpenChange(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Error generating reports:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white')}>
        <DialogHeader>
          <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
            Generar Reportes A/C Masivamente
          </DialogTitle>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6">
            {/* Datos del reporte */}
            <div className={cn("p-4 rounded-lg border", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200')}>
              <h3 className={cn("font-semibold mb-4", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                Datos del Reporte
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Fecha de Inspección *</Label>
                  <Input
                    type="date"
                    value={formData.inspection_date}
                    onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                    className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Temperatura Ambiente (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.ambient_temperature}
                    onChange={(e) => setFormData({ ...formData, ambient_temperature: e.target.value })}
                    placeholder="Ej: 25"
                    className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Tipo de Mantenimiento *</Label>
                  <Select
                    value={formData.tipo_mantenimiento}
                    onValueChange={(value) => setFormData({ ...formData, tipo_mantenimiento: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                      <SelectItem value="preventivo">Preventivo</SelectItem>
                      <SelectItem value="correctivo">Correctivo</SelectItem>
                      <SelectItem value="inspeccion">Inspección</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Selección de vehículos */}
            <div className={cn("p-4 rounded-lg border", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200')}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  Seleccionar Vehículos ({selectedVehicles.length} seleccionados)
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={loading}
                  className={theme === 'dark' ? 'border-zinc-700 text-zinc-300' : ''}
                >
                  {selectedVehicles.length === filteredVehicles.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </Button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por patente, número interno, marca, modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn("pl-10", theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : '')}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select value={companyFilter} onValueChange={setCompanyFilter} disabled={loading}>
                    <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                      <SelectValue placeholder="Empresa" />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                      <SelectItem value="all">Todas las empresas</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={locationFilter} onValueChange={setLocationFilter} disabled={companyFilter === "all" || loading}>
                    <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                      <SelectValue placeholder="Ubicación" />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                      <SelectItem value="all">Todas las ubicaciones</SelectItem>
                      {locations.filter(l => companyFilter === "all" || l.company_id === companyFilter).map((location) => (
                        <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={cn("max-h-64 overflow-y-auto space-y-1 rounded-lg border p-2", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200')}>
                {filteredVehicles.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                      No se encontraron vehículos
                    </p>
                  </div>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <label
                      key={vehicle.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded cursor-pointer transition-colors",
                        theme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-50',
                        selectedVehicles.includes(vehicle.id) && (theme === 'dark' ? 'bg-zinc-800' : 'bg-blue-50')
                      )}
                    >
                      <Checkbox
                        checked={selectedVehicles.includes(vehicle.id)}
                        onCheckedChange={() => handleToggleVehicle(vehicle.id)}
                        disabled={loading}
                      />
                      <div className="flex-1">
                        <p className={cn("text-sm font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                          {vehicle.internal_number} - {vehicle.plate}
                        </p>
                        <p className={cn("text-xs", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                          {vehicle.manufacturer} {vehicle.model}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>
                    Generando reportes...
                  </span>
                  <span className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className={theme === 'dark' ? 'border-zinc-700 text-zinc-300' : ''}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={loading || selectedVehicles.length === 0}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  `Generar ${selectedVehicles.length} Reporte${selectedVehicles.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className={results.every(r => r.success) ? 'border-green-500 bg-green-500/10' : 'border-yellow-500 bg-yellow-500/10'}>
              <AlertDescription>
                {results.filter(r => r.success).length} de {results.length} reportes generados exitosamente
              </AlertDescription>
            </Alert>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border flex items-center gap-3",
                    theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200'
                  )}
                >
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={cn("text-sm font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                      {result.vehicle}
                    </p>
                    {result.success ? (
                      <p className={cn("text-xs", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                        Reporte #{result.reportNumber}
                      </p>
                    ) : (
                      <p className="text-xs text-red-600">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}