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
import { Loader2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const initialState = {
  vehicle_id: "",
  type: "preventive",
  status: "scheduled",
  description: "",
  scheduled_date: "",
  completed_date: "",
  mileage_at_service: 0,
  cost: 0,
  provider: "",
  invoice_number: "",
  parts_replaced: "",
  next_service_mileage: 0,
  next_service_date: "",
  notes: "",
};

export default function MaintenanceDialog({ 
  open, 
  onOpenChange, 
  maintenance, 
  vehicles = [],
  onSave, 
  onDelete,
  isLoading,
  isDeleting 
}) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (maintenance) {
      setForm({ ...initialState, ...maintenance });
    } else {
      setForm(initialState);
    }
  }, [maintenance, open]);

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
          <DialogTitle>{maintenance ? "Editar Mantenimiento" : "Nuevo Mantenimiento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vehículo *</Label>
              <Select value={form.vehicle_id} onValueChange={(v) => handleChange("vehicle_id", v)} required>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} - {vehicle.brand} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => handleChange("type", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Preventivo</SelectItem>
                  <SelectItem value="corrective">Correctivo</SelectItem>
                  <SelectItem value="inspection">Inspección</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="bg-slate-800 border-slate-700 min-h-20"
              placeholder="Descripción del mantenimiento..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Programado</SelectItem>
                  <SelectItem value="in_progress">En progreso</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Proveedor/Taller</Label>
              <Input
                value={form.provider}
                onChange={(e) => handleChange("provider", e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha Programada</Label>
              <Input
                type="date"
                value={form.scheduled_date}
                onChange={(e) => handleChange("scheduled_date", e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Completado</Label>
              <Input
                type="date"
                value={form.completed_date}
                onChange={(e) => handleChange("completed_date", e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Kilometraje</Label>
              <Input
                type="number"
                value={form.mileage_at_service}
                onChange={(e) => handleChange("mileage_at_service", parseInt(e.target.value) || 0)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Costo</Label>
              <Input
                type="number"
                value={form.cost}
                onChange={(e) => handleChange("cost", parseFloat(e.target.value) || 0)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Nº Factura</Label>
              <Input
                value={form.invoice_number}
                onChange={(e) => handleChange("invoice_number", e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Partes Reemplazadas</Label>
            <Textarea
              value={form.parts_replaced}
              onChange={(e) => handleChange("parts_replaced", e.target.value)}
              className="bg-slate-800 border-slate-700"
              placeholder="Lista de partes reemplazadas..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Próximo Servicio (km)</Label>
              <Input
                type="number"
                value={form.next_service_mileage}
                onChange={(e) => handleChange("next_service_mileage", parseInt(e.target.value) || 0)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Próximo Servicio (fecha)</Label>
              <Input
                type="date"
                value={form.next_service_date}
                onChange={(e) => handleChange("next_service_date", e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="bg-slate-800 border-slate-700"
              placeholder="Notas adicionales..."
            />
          </div>

          <DialogFooter className="mt-6 gap-2">
            {maintenance && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">¿Eliminar mantenimiento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer.
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
              {isLoading ? "Guardando..." : (maintenance ? "Guardar" : "Crear")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}