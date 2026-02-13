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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";

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
  const { theme } = useTheme();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");

  useEffect(() => {
    if (maintenance) {
      setForm({ ...initialState, ...maintenance });
    } else {
      setForm(initialState);
    }
    setError("");
  }, [maintenance, open]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    
    if (!form.vehicle_id) {
      setError("Debe seleccionar un vehículo");
      return;
    }
    if (!form.description) {
      setError("Debe ingresar una descripción");
      return;
    }
    
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white')}>
        <DialogHeader>
          <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
            {maintenance ? "Editar Mantenimiento" : "Nuevo Mantenimiento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Vehículo *</Label>
              <Select value={form.vehicle_id} onValueChange={(v) => handleChange("vehicle_id", v)} required>
                <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id} className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>
                      {vehicle.plate} - {vehicle.manufacturer || vehicle.brand} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => handleChange("type", v)}>
                <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                  <SelectItem value="preventive" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Preventivo</SelectItem>
                  <SelectItem value="corrective" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Correctivo</SelectItem>
                  <SelectItem value="inspection" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Inspección</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Descripción *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className={cn("min-h-20", theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : '')}
              placeholder="Descripción del mantenimiento..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Estado</Label>
              <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                  <SelectItem value="scheduled" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Programado</SelectItem>
                  <SelectItem value="in_progress" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>En progreso</SelectItem>
                  <SelectItem value="completed" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Completado</SelectItem>
                  <SelectItem value="cancelled" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Proveedor/Taller</Label>
              <Input
                value={form.provider}
                onChange={(e) => handleChange("provider", e.target.value)}
                className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Fecha Programada</Label>
              <Input
                type="date"
                value={form.scheduled_date}
                onChange={(e) => handleChange("scheduled_date", e.target.value)}
                className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Fecha Completado</Label>
              <Input
                type="date"
                value={form.completed_date}
                onChange={(e) => handleChange("completed_date", e.target.value)}
                className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Kilometraje</Label>
              <Input
                type="number"
                value={form.mileage_at_service}
                onChange={(e) => handleChange("mileage_at_service", parseInt(e.target.value) || 0)}
                className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Costo</Label>
              <Input
                type="number"
                value={form.cost}
                onChange={(e) => handleChange("cost", parseFloat(e.target.value) || 0)}
                className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Nº Factura</Label>
              <Input
                value={form.invoice_number}
                onChange={(e) => handleChange("invoice_number", e.target.value)}
                className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Partes Reemplazadas</Label>
            <Textarea
              value={form.parts_replaced}
              onChange={(e) => handleChange("parts_replaced", e.target.value)}
              className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
              placeholder="Lista de partes reemplazadas..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Próximo Servicio (km)</Label>
              <Input
                type="number"
                value={form.next_service_mileage}
                onChange={(e) => handleChange("next_service_mileage", parseInt(e.target.value) || 0)}
                className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Próximo Servicio (fecha)</Label>
              <Input
                type="date"
                value={form.next_service_date}
                onChange={(e) => handleChange("next_service_date", e.target.value)}
                className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Notas</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
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
                <AlertDialogContent className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white'}>
                  <AlertDialogHeader>
                    <AlertDialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>¿Eliminar mantenimiento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700' : ''}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isLoading}
              className={theme === 'dark' ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : ''}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : maintenance ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}