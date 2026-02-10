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
import { Loader2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const initialState = {
  plate: "",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  vin: "",
  type: "car",
  status: "active",
  fuel_type: "gasoline",
  mileage: 0,
  assigned_driver_id: "",
  purchase_date: "",
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
  onSave, 
  onDelete,
  isLoading,
  isDeleting 
}) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (vehicle) {
      setForm({ ...initialState, ...vehicle });
    } else {
      setForm(initialState);
    }
  }, [vehicle, open]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Editar Vehículo" : "Nuevo Vehículo"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="bg-slate-800 border-slate-700 mb-4">
              <TabsTrigger value="general" className="data-[state=active]:bg-slate-700">General</TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-slate-700">Documentos</TabsTrigger>
              <TabsTrigger value="other" className="data-[state=active]:bg-slate-700">Otros</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Matrícula *</Label>
                  <Input
                    value={form.plate}
                    onChange={(e) => handleChange("plate", e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={form.type} onValueChange={(v) => handleChange("type", v)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Auto</SelectItem>
                      <SelectItem value="truck">Camión</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="motorcycle">Moto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marca *</Label>
                  <Input
                    value={form.brand}
                    onChange={(e) => handleChange("brand", e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modelo *</Label>
                  <Input
                    value={form.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Año</Label>
                  <Input
                    type="number"
                    value={form.year}
                    onChange={(e) => handleChange("year", parseInt(e.target.value))}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Combustible</Label>
                  <Select value={form.fuel_type} onValueChange={(v) => handleChange("fuel_type", v)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasoline">Gasolina</SelectItem>
                      <SelectItem value="diesel">Diésel</SelectItem>
                      <SelectItem value="electric">Eléctrico</SelectItem>
                      <SelectItem value="hybrid">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="maintenance">En mantenimiento</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>VIN</Label>
                  <Input
                    value={form.vin}
                    onChange={(e) => handleChange("vin", e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kilometraje</Label>
                  <Input
                    type="number"
                    value={form.mileage}
                    onChange={(e) => handleChange("mileage", parseInt(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700"
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
                    {drivers.filter(d => d.status === 'active').map(driver => (
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
                  <Label>Fecha de Compra</Label>
                  <Input
                    type="date"
                    value={form.purchase_date}
                    onChange={(e) => handleChange("purchase_date", e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimiento Seguro</Label>
                  <Input
                    type="date"
                    value={form.insurance_expiry}
                    onChange={(e) => handleChange("insurance_expiry", e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vencimiento ITV</Label>
                  <Input
                    type="date"
                    value={form.technical_inspection_expiry}
                    onChange={(e) => handleChange("technical_inspection_expiry", e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimiento Permiso Circulación</Label>
                  <Input
                    type="date"
                    value={form.circulation_permit_expiry}
                    onChange={(e) => handleChange("circulation_permit_expiry", e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="other" className="space-y-4">
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  className="bg-slate-800 border-slate-700 min-h-32"
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
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">¿Eliminar vehículo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente el vehículo {vehicle.plate}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
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