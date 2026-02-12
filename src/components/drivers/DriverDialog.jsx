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
import { Loader2, Trash2, Upload, X, Download, ZoomIn } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { base44 } from "@/api/base44Client";

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
  photo_url: "",
  license_number: "",
  license_type: "B",
  license_expiry: "",
  license_front_url: "",
  license_back_url: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  company_id: "",
  location_id: "",
  vehicle_id: "",
  notes: "",
};

export default function DriverDialog({ 
  open, 
  onOpenChange, 
  driver, 
  onSave, 
  onDelete,
  isLoading,
  isDeleting,
  companies = [],
  locations = [],
  vehicles = [],
  currentUser
}) {
  const [form, setForm] = useState(initialState);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLicenseFront, setUploadingLicenseFront] = useState(false);
  const [uploadingLicenseBack, setUploadingLicenseBack] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const isSuperAdmin = !currentUser?.company_id;

  useEffect(() => {
    if (driver) {
      setForm({ ...initialState, ...driver });
    } else {
      setForm({
        ...initialState,
        company_id: currentUser?.company_id || "",
      });
    }
  }, [driver, open, currentUser]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file, field, setUploading) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange(field, file_url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const finalData = isSuperAdmin ? form : { 
      ...form, 
      company_id: currentUser?.company_id 
    };
    
    if (!finalData.company_id) {
      alert("Debes seleccionar una empresa");
      return;
    }
    if (!finalData.location_id) {
      alert("Debes seleccionar una ubicación");
      return;
    }
    
    onSave(finalData);
  };

  // Filtrar ubicaciones según la empresa seleccionada
  const filteredLocations = locations.filter(loc => 
    loc.company_id === form.company_id
  );

  // Filtrar vehículos según la ubicación seleccionada
  const filteredVehicles = vehicles.filter(veh => 
    veh.location_id === form.location_id
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{driver ? "Editar Conductor" : "Nuevo Conductor"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="bg-zinc-900 border-zinc-800 mb-4">
                <TabsTrigger value="personal" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400 data-[state=active]:border-yellow-500/30">Personal</TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400 data-[state=active]:border-yellow-500/30">Documentos</TabsTrigger>
                <TabsTrigger value="contact" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400 data-[state=active]:border-yellow-500/30">Contacto</TabsTrigger>
                <TabsTrigger value="assignment" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400 data-[state=active]:border-yellow-500/30">Asignación</TabsTrigger>
              </TabsList>

              {/* Pestaña Personal */}
              <TabsContent value="personal" className="space-y-4">
                {/* Foto del empleado */}
                <div className="space-y-2">
                  <Label>Foto del Empleado</Label>
                  <div className="flex items-center gap-4">
                    {form.photo_url ? (
                      <div className="relative">
                        <img 
                          src={form.photo_url} 
                          alt="Foto empleado" 
                          className="w-24 h-24 object-cover rounded-lg border-2 border-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => setImagePreview(form.photo_url)}
                          className="absolute top-1 right-1 p-1 bg-slate-800/90 rounded-full hover:bg-slate-700"
                        >
                          <ZoomIn className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange("photo_url", "")}
                          className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full hover:bg-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center">
                        <Upload className="w-6 h-6 text-slate-500" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e.target.files[0], "photo_url", setUploadingPhoto)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("photo-upload").click()}
                        disabled={uploadingPhoto}
                        className="border-slate-700"
                      >
                        {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        {form.photo_url ? "Cambiar" : "Cargar"} Foto
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre Completo *</Label>
                    <Input
                      value={form.full_name}
                      onChange={(e) => handleChange("full_name", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ID Empleado</Label>
                    <Input
                      value={form.employee_id}
                      onChange={(e) => handleChange("employee_id", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Documento *</Label>
                    <Input
                      value={form.document_id}
                      onChange={(e) => handleChange("document_id", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 transition-colors"
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
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Contratación</Label>
                    <Input
                      type="date"
                      value={form.hire_date}
                      onChange={(e) => handleChange("hire_date", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 transition-colors"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Pestaña Documentos */}
              <TabsContent value="documents" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número de Licencia *</Label>
                    <Input
                      value={form.license_number}
                      onChange={(e) => handleChange("license_number", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 transition-colors"
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

                <div className="space-y-2">
                  <Label>Vencimiento</Label>
                  <Input
                    type="date"
                    value={form.license_expiry}
                    onChange={(e) => handleChange("license_expiry", e.target.value)}
                    className="bg-zinc-900 border-zinc-700 hover:border-yellow-500/50 transition-colors"
                  />
                </div>

                {/* Licencia Lado A */}
                <div className="space-y-2 pt-4 border-t border-slate-700">
                  <Label>Licencia - Lado A (Frente)</Label>
                  {form.license_front_url ? (
                    <div className="flex items-center gap-3">
                      <img 
                        src={form.license_front_url} 
                        alt="Licencia frente" 
                        className="w-32 h-20 object-cover rounded border border-slate-700"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setImagePreview(form.license_front_url)}
                          className="border-slate-700"
                        >
                          <ZoomIn className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(form.license_front_url, '_blank')}
                          className="border-slate-700"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Descargar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleChange("license_front_url", "")}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id="license-front-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e.target.files[0], "license_front_url", setUploadingLicenseFront)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("license-front-upload").click()}
                        disabled={uploadingLicenseFront}
                        className="border-slate-700"
                      >
                        {uploadingLicenseFront ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        Cargar Lado A
                      </Button>
                    </div>
                  )}
                </div>

                {/* Licencia Lado B */}
                <div className="space-y-2">
                  <Label>Licencia - Lado B (Dorso)</Label>
                  {form.license_back_url ? (
                    <div className="flex items-center gap-3">
                      <img 
                        src={form.license_back_url} 
                        alt="Licencia dorso" 
                        className="w-32 h-20 object-cover rounded border border-slate-700"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setImagePreview(form.license_back_url)}
                          className="border-slate-700"
                        >
                          <ZoomIn className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(form.license_back_url, '_blank')}
                          className="border-slate-700"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Descargar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleChange("license_back_url", "")}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id="license-back-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e.target.files[0], "license_back_url", setUploadingLicenseBack)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("license-back-upload").click()}
                        disabled={uploadingLicenseBack}
                        className="border-slate-700"
                      >
                        {uploadingLicenseBack ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        Cargar Lado B
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Pestaña Contacto */}
              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className="bg-zinc-900 border-zinc-700 hover:border-yellow-500/50 transition-colors"
                  />
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400 mb-4">Contacto de Emergencia</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input
                        value={form.emergency_contact_name}
                        onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                        className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input
                        value={form.emergency_contact_phone}
                        onChange={(e) => handleChange("emergency_contact_phone", e.target.value)}
                        className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 transition-colors"
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

              {/* Pestaña Asignación */}
              <TabsContent value="assignment" className="space-y-4">
                {isSuperAdmin && (
                  <div className="space-y-2">
                    <Label>Empresa *</Label>
                    <Select value={form.company_id} onValueChange={(v) => {
                      handleChange("company_id", v);
                      handleChange("location_id", "");
                      handleChange("vehicle_id", "");
                    }}>
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

                <div className="space-y-2">
                  <Label>Ubicación *</Label>
                  <Select 
                    value={form.location_id} 
                    onValueChange={(v) => {
                      handleChange("location_id", v);
                      handleChange("vehicle_id", "");
                    }}
                    disabled={!form.company_id}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Seleccionar ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLocations.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-slate-400">
                          {form.company_id ? "No hay ubicaciones disponibles" : "Primero selecciona una empresa"}
                        </div>
                      ) : (
                        filteredLocations.map(location => (
                          <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Vehículo Asignado</Label>
                  <Select 
                    value={form.vehicle_id || ""} 
                    onValueChange={(v) => handleChange("vehicle_id", v === "" ? "" : v)}
                    disabled={!form.location_id}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Seleccionar vehículo (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Sin vehículo asignado</SelectItem>
                      {filteredVehicles.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-slate-400">
                          {form.location_id ? "No hay vehículos disponibles" : "Primero selecciona una ubicación"}
                        </div>
                      ) : (
                        filteredVehicles.map(vehicle => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.internal_number ? `#${vehicle.internal_number} - ` : ""}{vehicle.plate} - {vehicle.manufacturer} {vehicle.model}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
                  <AlertDialogContent className="bg-zinc-950 border-zinc-800 shadow-2xl shadow-black/50">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">¿Eliminar conductor?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente al conductor {driver.full_name}.
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
              <Button type="submit" disabled={isLoading} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isLoading ? "Guardando..." : (driver ? "Guardar" : "Crear")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      {imagePreview && (
        <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
          <DialogContent className="max-w-4xl bg-zinc-950 border-zinc-800 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>Vista Ampliada</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center">
              <img src={imagePreview} alt="Vista ampliada" className="max-w-full max-h-[70vh] object-contain" />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}