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
import { Loader2, Trash2, AlertCircle, Upload, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
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
  image_url: "",
  notes: "",
};

export default function LocationDialog({ 
  open, 
  onOpenChange, 
  location, 
  companies = [],
  isSuperAdmin,
  currentUser,
  onSave, 
  onDelete,
  isLoading,
  isDeleting,
  hasVehicles
}) {
  const [form, setForm] = useState(initialState);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (location) {
      setForm({ ...initialState, ...location });
    } else {
      const defaultCompanyId = isSuperAdmin ? "" : (currentUser?.company_id || "");
      setForm({ ...initialState, company_id: defaultCompanyId });
    }
  }, [location, open, isSuperAdmin, currentUser]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const finalData = isSuperAdmin ? form : { ...form, company_id: currentUser?.company_id };
    
    // Validar que haya company_id
    if (!finalData.company_id) {
      alert("Debes seleccionar una empresa");
      return;
    }
    
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{location ? "Editar Locación" : "Nueva Locación"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Imagen</Label>
            <div className="flex items-center gap-4">
              {form.image_url && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-slate-700">
                  <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleChange("image_url", "")}
                    className="absolute top-1 right-1 p-1 bg-slate-900/80 rounded-full hover:bg-slate-800"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 transition-colors"
                />
                {uploading && <p className="text-xs text-slate-400 mt-1">Subiendo imagen...</p>}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nombre de la locación *</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="bg-slate-800 border-slate-700"
              required
            />
          </div>

          {isSuperAdmin && (
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <Select value={form.company_id} onValueChange={(v) => handleChange("company_id", v)} required>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-slate-400">No hay empresas disponibles</div>
                  ) : (
                    companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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
                <AlertDialogContent className="bg-zinc-950 border-zinc-800 shadow-2xl shadow-black/50">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">¿Eliminar locación?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará la locación "{location.name}" permanentemente.
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
              {isLoading ? "Guardando..." : (location ? "Guardar" : "Crear")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}