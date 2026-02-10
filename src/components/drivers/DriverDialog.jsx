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
  full_name: "",
  employee_id: "",
  document_id: "",
  phone: "",
  email: "",
  address: "",
  birth_date: "",
  hire_date: "",
  status: "active",
  license_number: "",
  license_type: "B",
  license_expiry: "",
  medical_certificate_expiry: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  notes: "",
};

export default function DriverDialog({ 
  open, 
  onOpenChange, 
  driver, 
  onSave, 
  onDelete,
  isLoading,
  isDeleting 
}) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (driver) {
      setForm({ ...initialState, ...driver });
    } else {
      setForm(initialState);
    }
  }, [driver, open]);

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
          <DialogTitle>{driver ? "Editar Conductor" : "Nuevo Conductor"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="bg-slate-800 border-slate-700 mb-4">
              <TabsTrigger value="personal" className="data-[state=active]:bg-slate-700">Personal</TabsTrigger>
              <TabsTrigger value="license" className="data-[state=active]:bg-slate-700">Licencia</TabsTrigger>
              <TabsTrigger value="contact" className="data-[state=active]:bg-slate-700">Contacto</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre Completo *</Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID Empleado</Label>
                  <Input
                    value={form.employee_id}
                    onChange={(e) => handleChange("employee_id", e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Documento de Identidad *</Label>
                  <Input
                    value={form.document_id}
                    onChange={(e) => handleChange("document_id", e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    required
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
                      <SelectItem value="on_leave">De baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Nacimiento</Label>
                  <Input
                    type="date"
                    value={form.birth_date}
                    onChange={(e) => handleChange("birth_date", e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Contratación</Label>
                  <Input
                    type="date"
                    value={form.hire_date}
                    onChange={(e) => handleChange("hire_date", e.target.value)}
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
            </TabsContent>

            <TabsContent value="license" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Licencia *</Label>
                  <Input
                    value={form.license_number}
                    onChange={(e) => handleChange("license_number", e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Licencia</Label>
                  <Select value={form.license_type} onValueChange={(v) => handleChange("license_type", v)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Tipo A - Motos</SelectItem>
                      <SelectItem value="B">Tipo B - Autos</SelectItem>
                      <SelectItem value="C">Tipo C - Camiones</SelectItem>
                      <SelectItem value="D">Tipo D - Buses</SelectItem>
                      <SelectItem value="E">Tipo E - Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vencimiento Licencia</Label>
                  <Input
                    type="date"
                    value={form.license_expiry}
                    onChange={(e) => handleChange("license_expiry", e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimiento Certificado Médico</Label>
                  <Input
                    type="date"
                    value={form.medical_certificate_expiry}
                    onChange={(e) => handleChange("medical_certificate_expiry", e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
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

              <div className="pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400 mb-4">Contacto de Emergencia</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      value={form.emergency_contact_name}
                      onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      value={form.emergency_contact_phone}
                      onChange={(e) => handleChange("emergency_contact_phone", e.target.value)}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  className="bg-slate-800 border-slate-700 min-h-24"
                  placeholder="Notas adicionales..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 gap-2">
            {driver && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">¿Eliminar conductor?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente al conductor {driver.full_name}.
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
              {driver ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}