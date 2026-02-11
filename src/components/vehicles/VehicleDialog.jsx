import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const initialState = {
  internal_number: "",
  plate: "",
  company_id: "",
  location_id: "",
  manufacturer: "",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  chassis_number: "",
  engine_number: "",
  vin: "",
  type: "car",
  technical_description: "",
  status: "active",
  fuel_type: "diesel",
  mileage: 0,
  hours: 0,
  assigned_driver_id: "",
  purchase_date: "",
  last_service_date: "",
  next_service_date: "",
  insurance_expiry: "",
  technical_inspection_expiry: "",
  circulation_permit_expiry: "",
  notes: "",
};

export default function VehicleDialog({ 
  open, 
  onOpenChange, 
  vehicle, 
  drivers = [],
  locations = [],
  companies = [],
  isSuperAdmin,
  currentUser,
  onSave, 
  onDelete,
  isLoading,
  isDeleting 
}) {
  const [form, setForm] = useState(initialState);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setForm({ ...initialState, ...vehicle });
      setSelectedCompanyId(vehicle.company_id || "");
    } else {
      const defaultCompanyId = isSuperAdmin ? "" : (currentUser?.company_id || "");
      setForm({ ...initialState, company_id: defaultCompanyId });
      setSelectedCompanyId(defaultCompanyId);
    }
  }, [vehicle, open, isSuperAdmin, currentUser]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === "company_id") {
      setSelectedCompanyId(value);
      setForm(prev => ({ ...prev, location_id: "" })); // Reset location when company changes
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = {
      ...form,
      company_id: isSuperAdmin ? form.company_id : currentUser?.company_id
    };
    onSave(finalData);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      handleChange("image_url", result.file_url);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  // Filtrar locaciones por empresa seleccionada
  const filteredLocations = isSuperAdmin 
    ? locations.filter(l => l.company_id === selectedCompanyId)
    : locations;

  // Filtrar conductores por empresa
  const filteredDrivers = isSuperAdmin
    ? drivers.filter(d => d.company_id === selectedCompanyId)
    : drivers;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Editar Vehículo" : "Nuevo Vehículo"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="bg-zinc-900 border-zinc-800 mb-4">
              <TabsTrigger value="general" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400 data-[state=active]:border-yellow-500/30">General</TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400 data-[state=active]:border-yellow-500/30">Documentos</TabsTrigger>
              <TabsTrigger value="other" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400 data-[state=active]:border-yellow-500/30">Otros</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Interno (Calco ID)</Label>
                  <Input
                    value={form.internal_number}
                    onChange={(e) => handleChange("internal_number", e.target.value.slice(0, 10))}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                    placeholder="Ej: MTU736"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Imagen del vehículo</Label>
                  <div className="flex items-center gap-2">
                    {form.image_url && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-zinc-700">
                        <img src={form.image_url} alt="Vehículo" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleChange("image_url", "")}
                          className="absolute top-0 right-0 p-0.5 bg-zinc-900/80 rounded-full hover:bg-zinc-800"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 text-xs"
                    />
                  </div>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Empresa *</Label>
                    <Select value={form.company_id} onValueChange={(v) => handleChange("company_id", v)} required>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Seleccionar empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Locación *</Label>
                    <Select value={form.location_id} onValueChange={(v) => handleChange("location_id", v)} required disabled={!selectedCompanyId}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder={selectedCompanyId ? "Seleccionar locación" : "Primero seleccione empresa"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredLocations.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {!isSuperAdmin && (
                <div className="space-y-2">
                  <Label>Locación *</Label>
                  <Select value={form.location_id} onValueChange={(v) => handleChange("location_id", v)} required>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Seleccionar locación" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLocations.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Fabricante *</Label>
                  <Input
                    value={form.manufacturer}
                    onChange={(e) => handleChange("manufacturer", e.target.value.slice(0, 30))}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                    placeholder="Ej: FIAT, SCANIA, VW"
                    maxLength={30}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modelo *</Label>
                  <Input
                    value={form.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                    placeholder="Ej: Hilux 2.8 TDI"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Año</Label>
                  <Select value={form.year?.toString()} onValueChange={(v) => handleChange("year", parseInt(v))}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {Array.from({ length: 151 }, (_, i) => 2050 - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patente *</Label>
                  <Input
                    value={form.plate}
                    onChange={(e) => handleChange("plate", e.target.value.slice(0, 10).toUpperCase())}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                    placeholder="ABC123"
                    maxLength={10}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={form.type} onValueChange={(v) => handleChange("type", v)} required>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Auto</SelectItem>
                      <SelectItem value="truck">Camión</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="motorcycle">Moto</SelectItem>
                      <SelectItem value="machinery">Maquinaria</SelectItem>
                      <SelectItem value="trailer">Trailer</SelectItem>
                      <SelectItem value="pickup">Pickup</SelectItem>
                      <SelectItem value="semi_truck">Semi Camión</SelectItem>
                      <SelectItem value="crane">Grúa</SelectItem>
                      <SelectItem value="excavator">Excavadora</SelectItem>
                      <SelectItem value="loader">Cargadora</SelectItem>
                      <SelectItem value="grader">Motoniveladora</SelectItem>
                      <SelectItem value="roller">Rodillo</SelectItem>
                      <SelectItem value="tractor">Tractor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chasis</Label>
                  <Input
                    value={form.chassis_number}
                    onChange={(e) => handleChange("chassis_number", e.target.value.slice(0, 20).toUpperCase())}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                    placeholder="Número de chasis"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Motor</Label>
                  <Input
                    value={form.engine_number}
                    onChange={(e) => handleChange("engine_number", e.target.value.slice(0, 20).toUpperCase())}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                    placeholder="Número de motor"
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción Técnica</Label>
                <Input
                  value={form.technical_description}
                  onChange={(e) => handleChange("technical_description", e.target.value.slice(0, 50))}
                  className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                  placeholder="Funcionalidad técnica o utilidad del activo"
                  maxLength={50}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Combustible</Label>
                  <Select value={form.fuel_type} onValueChange={(v) => handleChange("fuel_type", v)}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasoline">Gasolina</SelectItem>
                      <SelectItem value="diesel">Diésel</SelectItem>
                      <SelectItem value="electric">Eléctrico</SelectItem>
                      <SelectItem value="hybrid">Híbrido</SelectItem>
                      <SelectItem value="gnc">GNC</SelectItem>
                      <SelectItem value="gnv">GNV</SelectItem>
                      <SelectItem value="biodiesel">Biodiésel</SelectItem>
                      <SelectItem value="ethanol">Etanol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="in_use">En Uso</SelectItem>
                      <SelectItem value="reserved">Reservado</SelectItem>
                      <SelectItem value="maintenance">Mantenimiento</SelectItem>
                      <SelectItem value="repair">Reparación</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kilómetros</Label>
                  <Input
                    type="number"
                    value={form.mileage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      handleChange("mileage", Math.min(val, 999999));
                    }}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                    max={999999}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horas</Label>
                  <Input
                    type="number"
                    value={form.hours}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      handleChange("hours", Math.min(val, 99999));
                    }}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                    max={99999}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Conductor Asignado</Label>
                <Select 
                  value={form.assigned_driver_id || "none"} 
                  onValueChange={(v) => handleChange("assigned_driver_id", v === "none" ? "" : v)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {filteredDrivers.filter(d => d.status === 'active').map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Último Servicio</Label>
                  <Input
                    type="date"
                    value={form.last_service_date}
                    onChange={(e) => handleChange("last_service_date", e.target.value)}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Próximo Servicio</Label>
                  <Input
                    type="date"
                    value={form.next_service_date}
                    onChange={(e) => handleChange("next_service_date", e.target.value)}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Compra</Label>
                  <Input
                    type="date"
                    value={form.purchase_date}
                    onChange={(e) => handleChange("purchase_date", e.target.value)}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimiento Seguro</Label>
                  <Input
                    type="date"
                    value={form.insurance_expiry}
                    onChange={(e) => handleChange("insurance_expiry", e.target.value)}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vencimiento VTV</Label>
                  <Input
                    type="date"
                    value={form.technical_inspection_expiry}
                    onChange={(e) => handleChange("technical_inspection_expiry", e.target.value)}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimiento Permiso Circulación</Label>
                  <Input
                    type="date"
                    value={form.circulation_permit_expiry}
                    onChange={(e) => handleChange("circulation_permit_expiry", e.target.value)}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="other" className="space-y-4">
              <div className="space-y-2">
                <Label>VIN (Opcional)</Label>
                <Input
                  value={form.vin}
                  onChange={(e) => handleChange("vin", e.target.value)}
                  className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                  placeholder="Número VIN si aplica"
                />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 min-h-32"
                  placeholder="Notas adicionales sobre el vehículo..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 gap-2">
            {vehicle && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800 shadow-2xl shadow-black/50">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">¿Eliminar vehículo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente el vehículo {vehicle.plate}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {vehicle ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}