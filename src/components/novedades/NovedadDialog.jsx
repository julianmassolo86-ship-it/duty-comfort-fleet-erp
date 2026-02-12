import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const initialState = {
  vehicle_id: "",
  descripcion: "",
  prioridad: "media",
  kilometraje: "",
  horas: ""
};

export default function NovedadDialog({ open, onOpenChange, novedad, onSuccess, theme }) {
  const [formData, setFormData] = useState(initialState);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      loadVehicles();
      if (novedad) {
        setFormData({
          vehicle_id: novedad.vehicle_id || "",
          descripcion: novedad.descripcion || "",
          prioridad: novedad.prioridad || "media",
          kilometraje: "",
          horas: ""
        });
      } else {
        setFormData(initialState);
      }
      setError("");
    }
  }, [open, novedad]);

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
      const allVehicles = await base44.entities.Vehicle.list();
      setVehicles(allVehicles);
    } catch (err) {
      console.error("Error loading vehicles:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.vehicle_id) {
        throw new Error("Debe seleccionar un vehículo");
      }

      if (!formData.descripcion.trim()) {
        throw new Error("Debe ingresar una descripción de la novedad");
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

      const novedadData = {
        vehicle_id: formData.vehicle_id,
        company_id: selectedVehicle.company_id,
        location_id: selectedVehicle.location_id,
        descripcion: formData.descripcion,
        prioridad: formData.prioridad,
        fecha_reporte: new Date().toISOString().split('T')[0],
        estado: "pendiente",
        kilometraje_reportado: formData.kilometraje ? newKm : null,
        horas_reportadas: formData.horas ? newHours : null
      };

      if (novedad) {
        await base44.entities.Novedad.update(novedad.id, novedadData);
      } else {
        await base44.entities.Novedad.create(novedadData);
        
        // Actualizar kilometraje y/o horas del vehículo
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
          <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
            {novedad ? "Editar Novedad" : "Registrar Novedad Diaria"}
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
            <Select
              value={formData.vehicle_id}
              onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
              disabled={!!novedad}
            >
              <SelectTrigger className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}>
                <SelectValue placeholder="Seleccionar vehículo" />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id} className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>
                    {vehicle.internal_number} - {vehicle.plate} ({vehicle.manufacturer} {vehicle.model})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Nuevo Kilometraje</Label>
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
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Nuevas Horas</Label>
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

          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Descripción de la Novedad *</Label>
            <Textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Ej: Lámpara trasera derecha quemada"
              rows={3}
              className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}
            />
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
              ) : novedad ? "Actualizar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}