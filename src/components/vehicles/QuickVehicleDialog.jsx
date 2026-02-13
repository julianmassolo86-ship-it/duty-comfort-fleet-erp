import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Car } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";

export default function QuickVehicleDialog({ open, onOpenChange, onSuccess, user }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [formData, setFormData] = useState({
    plate: "",
    internal_number: "",
    company_id: "",
    location_id: "",
    manufacturer: "",
    model: ""
  });

  const isSuperAdmin = !user?.company_id || user?.user_role === 'super_admin';

  useEffect(() => {
    if (open) {
      loadData();
      // Reset form
      setFormData({
        plate: "",
        internal_number: "",
        company_id: isSuperAdmin ? "" : (user?.company_id || ""),
        location_id: "",
        manufacturer: "",
        model: ""
      });
    }
  }, [open, user]);

  const loadData = async () => {
    try {
      const [companiesData, locationsData, manufacturersData] = await Promise.all([
        user?.company_id 
          ? base44.entities.Company.filter({ id: user.company_id })
          : base44.entities.Company.list(),
        user?.company_id 
          ? base44.entities.Location.filter({ company_id: user.company_id })
          : base44.entities.Location.list(),
        base44.entities.Manufacturer.list()
      ]);
      
      setCompanies(companiesData);
      setLocations(locationsData);
      setManufacturers(manufacturersData);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const filteredLocations = isSuperAdmin 
    ? locations.filter(l => l.company_id === formData.company_id)
    : locations;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar que al menos uno de los dos campos obligatorios esté lleno
      if (!formData.plate && !formData.internal_number) {
        throw new Error("Debe ingresar al menos una Patente o Número Interno");
      }

      if (!formData.company_id) {
        throw new Error("Debe seleccionar una empresa");
      }

      if (!formData.location_id) {
        throw new Error("Debe seleccionar una locación");
      }

      if (!formData.manufacturer) {
        throw new Error("Debe seleccionar un fabricante");
      }

      if (!formData.model) {
        throw new Error("Debe ingresar un modelo");
      }

      const vehicleData = {
        plate: formData.plate || `SIN-${Date.now()}`, // Si no hay patente, generar una temporal
        internal_number: formData.internal_number,
        company_id: formData.company_id,
        location_id: formData.location_id,
        manufacturer: formData.manufacturer,
        model: formData.model,
        year: new Date().getFullYear(),
        status: "active"
      };

      const newVehicle = await base44.entities.Vehicle.create(vehicleData);
      onSuccess?.(newVehicle);
      onOpenChange(false);
    } catch (err) {
      alert(err.message || "Error al crear el vehículo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-md", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white')}>
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            <Car className="w-5 h-5 text-yellow-500" />
            Crear Vehículo Rápido
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
              Patente
            </Label>
            <Input
              value={formData.plate}
              onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
              placeholder="ABC123"
              className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
              Número Interno (Calco)
            </Label>
            <Input
              value={formData.internal_number}
              onChange={(e) => setFormData({ ...formData, internal_number: e.target.value })}
              placeholder="MTU736"
              className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}
              maxLength={10}
            />
          </div>

          <p className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
            * Debe ingresar al menos Patente o Número Interno
          </p>

          {isSuperAdmin && (
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
                Empresa *
              </Label>
              <Select 
                value={formData.company_id} 
                onValueChange={(v) => setFormData({ ...formData, company_id: v, location_id: "" })}
              >
                <SelectTrigger className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}>
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                  {companies.map(c => (
                    <SelectItem 
                      key={c.id} 
                      value={c.id}
                      className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}
                    >
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
              Locación *
            </Label>
            <Select 
              value={formData.location_id} 
              onValueChange={(v) => setFormData({ ...formData, location_id: v })}
              disabled={isSuperAdmin && !formData.company_id}
            >
              <SelectTrigger className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}>
                <SelectValue placeholder={isSuperAdmin && !formData.company_id ? "Primero seleccione empresa" : "Seleccionar locación"} />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                {filteredLocations.length > 0 ? (
                  filteredLocations.map(l => (
                    <SelectItem 
                      key={l.id} 
                      value={l.id}
                      className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}
                    >
                      {l.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-zinc-500">No hay locaciones disponibles</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
              Fabricante *
            </Label>
            <Select 
              value={formData.manufacturer} 
              onValueChange={(v) => setFormData({ ...formData, manufacturer: v })}
            >
              <SelectTrigger className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}>
                <SelectValue placeholder="Seleccionar fabricante" />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                {manufacturers.map(m => (
                  <SelectItem 
                    key={m.id} 
                    value={m.name}
                    className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}
                  >
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
              Modelo *
            </Label>
            <Input
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Ej: Hilux 2.8 TDI"
              className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}
            />
          </div>

          <DialogFooter className="gap-2">
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
                  Creando...
                </>
              ) : (
                <>
                  <Car className="w-4 h-4 mr-2" />
                  Crear Vehículo
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}