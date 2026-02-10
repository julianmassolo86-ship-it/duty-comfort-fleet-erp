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
import { Loader2, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const initialState = {
  name: "",
  company_id: "",
  type: "base",
  address: "",
  city: "",
  province: "",
  country: "Argentina",
  contact_name: "",
  contact_phone: "",
  status: "active",
  notes: "",
};

export default function LocationDialog({ 
  open, 
  onOpenChange, 
  location, 
  companies = [],
  isSuperAdmin,
  onSave, 
  onDelete,
  isLoading,
  isDeleting,
  hasVehicles
}) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (location) {
      setForm({ ...initialState, ...location });
    } else {
      setForm(initialState);
    }
  }, [location, open]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{location ? "Editar Locación" : "Nueva Locación"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la locación *</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="bg-slate-800 border-slate-700"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label>Empresa *</Label>
                <Select value={form.company_id} onValueChange={(v) => handleChange("company_id", v)} required>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Seleccionar empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => handleChange("type", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hangar">Hangar</SelectItem>
                  <SelectItem value="torre">Torre</SelectItem>
                  <SelectItem value="obrador">Obrador</SelectItem>
                  <SelectItem value="deposito">Depósito</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="oficina">Oficina</SelectItem>
                  <SelectItem value="taller">Taller</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!isSuperAdmin && (
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {isSuperAdmin && (
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Provincia</Label>
              <Input
                value={form.province}
                onChange={(e) => handleChange("province", e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contacto</Label>
              <Input
                value={form.contact_name}
                onChange={(e) => handleChange("contact_name", e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono contacto</Label>
              <Input
                value={form.contact_phone}
                onChange={(e) => handleChange("contact_phone", e.target.value)}
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

          {location && hasVehicles && (
            <Alert className="bg-amber-500/10 border-amber-500/30">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200">
                No se puede eliminar esta locación porque tiene vehículos asignados.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="mt-6 gap-2">
            {location && onDelete && !hasVehicles && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">¿Eliminar locación?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará la locación "{location.name}" permanentemente.
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
              {location ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}