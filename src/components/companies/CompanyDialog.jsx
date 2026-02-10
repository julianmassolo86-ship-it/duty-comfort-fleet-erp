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
  tax_id: "",
  address: "",
  phone: "",
  email: "",
  status: "active",
  notes: "",
};

export default function CompanyDialog({ 
  open, 
  onOpenChange, 
  company, 
  onSave, 
  onDelete,
  isLoading,
  isDeleting,
  hasLocations
}) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (company) {
      setForm({ ...initialState, ...company });
    } else {
      setForm(initialState);
    }
  }, [company, open]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>{company ? "Editar Empresa" : "Nueva Empresa"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la empresa *</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="bg-slate-800 border-slate-700"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CUIT/RUT/NIF</Label>
              <Input
                value={form.tax_id}
                onChange={(e) => handleChange("tax_id", e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
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

          {company && hasLocations && (
            <Alert className="bg-amber-500/10 border-amber-500/30">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200">
                No se puede eliminar esta empresa porque tiene locaciones asociadas.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="mt-6 gap-2">
            {company && onDelete && !hasLocations && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">¿Eliminar empresa?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará la empresa "{company.name}" permanentemente.
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
              {company ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}