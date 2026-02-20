import React, { useState, useEffect, useMemo } from "react";
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
import { Loader2, Trash2, X, Upload, Image as ImageIcon, UserPlus, UserMinus, ZoomIn, Download, Check } from "lucide-react";
import DocumentCard from "./DocumentCard";
import VehicleCardDocument from "./VehicleCardDocument";
import VehicleMaintenanceHistory from "./VehicleMaintenanceHistory";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const initialState = {
  internal_number: "",
  plate: "",
  company_id: "",
  location_id: "",
  manufacturer: "",
  manufacturer_logo_url: "",
  model: "",
  year: "",
  chassis_number: "",
  engine_number: "",
  vin: "",
  category_id: "",
  type_id: "",
  type: "",
  technical_description: "",
  status: "active",
  fuel_type: "diesel",
  mileage: 0,
  hours: 0,
  assigned_driver_ids: [],
  circulation_permit_url: "",
  last_service_date: "",
  last_service_mileage: 0,
  last_service_hours: 0,
  next_service_date: "",
  next_service_mileage: 0,
  next_service_hours: 0,
  insurance_expiry: "",
  technical_inspection_expiry: "",
  circulation_permit_expiry: "",
  notes: "",
  // Document fields added here for consistency, but managed by DocumentCard/VehicleCardDocument
  vehicle_card_front_url: "",
  vehicle_card_back_url: "",
  vehicle_card_front_expiry: "",
  title_url: "",
  title_expiry: "",
  license_plate_url: "",
  license_plate_expiry: "",
  technical_inspection_url: "",
  parts_engraving_url: "",
  parts_engraving_expiry: "",
  fire_extinguisher_url: "",
  fire_extinguisher_expiry: "",
  insurance_url: "",
};

export default function VehicleDialog({ 
  open, 
  onOpenChange, 
  vehicle, 
  prefilledData,
  drivers = [],
  locations = [],
  companies = [],
  manufacturers = [],
  vehicleTypes = [],
  vehicleCategories = [],
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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const { data: vehicleStatuses = [] } = useQuery({
    queryKey: ['vehicleStatuses'],
    queryFn: () => base44.entities.VehicleStatus.list(),
  });

  // Crear mapa de categorías
  const categoriesMap = new Map(vehicleCategories.map(cat => [cat.id, cat.name]));

  // Crear opciones combinadas de tipo con categoría
  const vehicleTypeOptions = vehicleTypes.map(vt => ({
    ...vt,
    category_name: categoriesMap.get(vt.category_id) || "Sin categoría",
    display_name: `${categoriesMap.get(vt.category_id) || "Sin categoría"} - ${vt.name}`
  }));

  useEffect(() => {
    if (open) {
      if (vehicle) {
        const driverIds = vehicle.assigned_driver_ids || (vehicle.assigned_driver_id ? [vehicle.assigned_driver_id] : []);
        const companyId = vehicle.company_id || "";
        const locationId = vehicle.location_id || "";
        
        setSelectedCompanyId(companyId);
        
        // IMPORTANTE: Mantener TODOS los datos del vehículo, incluido location_id
        setForm(prev => ({ 
          ...vehicle,
          assigned_driver_ids: driverIds,
          company_id: companyId,
          location_id: locationId,
          // Asegurar que campos numéricos no sean null/undefined
          year: vehicle.year || "",
          mileage: vehicle.mileage || 0,
          hours: vehicle.hours || 0,
          last_service_mileage: vehicle.last_service_mileage || 0,
          last_service_hours: vehicle.last_service_hours || 0,
          next_service_mileage: vehicle.next_service_mileage || 0,
          next_service_hours: vehicle.next_service_hours || 0,
        }));
      } else {
        const defaultCompanyId = isSuperAdmin ? "" : (currentUser?.company_id || "");
        setSelectedCompanyId(defaultCompanyId);
        
        // Si hay datos pre-llenados de la captura rápida, usarlos
        const baseForm = { ...initialState, company_id: defaultCompanyId, location_id: "" };
        if (prefilledData) {
          setForm({
            ...baseForm,
            plate: prefilledData.plate || baseForm.plate,
            internal_number: prefilledData.internal_number || baseForm.internal_number,
            manufacturer: prefilledData.manufacturer || baseForm.manufacturer,
            model: prefilledData.model || baseForm.model,
          });
        } else {
          setForm(baseForm);
        }
      }
    }
  }, [vehicle, prefilledData, open, isSuperAdmin, currentUser]);

  const handleChange = (field, value) => {
    if (field === "company_id") {
      setSelectedCompanyId(value);
      setForm(prev => ({ ...prev, [field]: value, location_id: "", assigned_driver_ids: [] }));
    } else if (field === "location_id") {
      setForm(prev => ({ ...prev, [field]: value, assigned_driver_ids: [] }));
    } else if (field === "type_id") {
      // Cuando se selecciona un tipo, también actualizar la categoría
      const selectedType = vehicleTypes.find(vt => vt.id === value);
      if (selectedType) {
        setForm(prev => ({ 
          ...prev, 
          type_id: value,
          category_id: selectedType.category_id
        }));
      } else {
        setForm(prev => ({ ...prev, [field]: value }));
      }
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevenir múltiples envíos
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    // Validar que al menos uno de los dos campos esté presente
    if (!form.internal_number && !form.plate) {
      alert("Debe completar al menos Interno o Patente");
      setIsSubmitting(false);
      return;
    }
    
    const currentVehicleId = vehicle?.id || form.id;
    
    // Validar patente duplicada globalmente (solo si cambió la patente)
    if (form.plate && form.plate !== vehicle?.plate) {
      const existingByPlate = await base44.entities.Vehicle.filter({ plate: form.plate });
      const duplicatePlate = existingByPlate.find(v => v.id !== currentVehicleId);
      if (duplicatePlate) {
        alert(`La patente "${form.plate}" ya existe en el sistema (Interno: ${duplicatePlate.internal_number})`);
        setIsSubmitting(false);
        return;
      }
    }
    
    // Validar número interno duplicado dentro de la misma empresa (solo si cambió el interno)
    if (form.internal_number && form.internal_number !== vehicle?.internal_number) {
      const companyId = isSuperAdmin ? form.company_id : currentUser?.company_id;
      const existingByInternal = await base44.entities.Vehicle.filter({ 
        internal_number: form.internal_number,
        company_id: companyId
      });
      const duplicateInternal = existingByInternal.find(v => v.id !== currentVehicleId);
      if (duplicateInternal) {
        alert(`El número interno "${form.internal_number}" ya existe en esta empresa (Patente: ${duplicateInternal.plate})`);
        setIsSubmitting(false);
        return;
      }
    }
    
    const finalData = {
      ...form,
      company_id: isSuperAdmin ? form.company_id : currentUser?.company_id,
      assigned_driver_id: undefined,
      year: form.year === "" || form.year === null ? null : Number(form.year)
    };
    
    // Si es una edición, incluir el ID para que Vehicles.js no lo trate como creación
    if (vehicle?.id) {
      finalData.id = vehicle.id;
    }
    
    try {
      await onSave(finalData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error al guardar el vehículo:", error);
      setSaveSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e, field = "image_url") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      handleChange(field, result.file_url);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  const filteredLocations = useMemo(() => {
    if (isSuperAdmin) {
      return selectedCompanyId ? locations.filter(l => l.company_id === selectedCompanyId) : locations;
    }
    return locations;
  }, [locations, selectedCompanyId, isSuperAdmin]);

  const selectedLocationName = useMemo(() => {
    const selected = locations.find(l => l.id === form.location_id);
    return selected ? selected.name : "";
  }, [locations, form.location_id]);

  const filteredDrivers = isSuperAdmin
    ? drivers.filter(d => d.company_id === selectedCompanyId)
    : drivers;

  const addDriver = () => {
    if (form.assigned_driver_ids.length < 3) {
      handleChange("assigned_driver_ids", [...form.assigned_driver_ids, ""]);
    }
  };

  const removeDriver = (index) => {
    const newDrivers = form.assigned_driver_ids.filter((_, i) => i !== index);
    handleChange("assigned_driver_ids", newDrivers);
  };

  const updateDriver = (index, driverId) => {
    const newDrivers = [...form.assigned_driver_ids];
    newDrivers[index] = driverId;
    handleChange("assigned_driver_ids", newDrivers);
  };

  const fileInputRef = React.useRef(null);

  const handleOpenChange = (newOpen) => {
    // Prevenir cerrar el modal si está guardando o borrando
    if (!newOpen && (isLoading || isDeleting)) {
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50 backdrop-blur-xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{vehicle ? "Editar Vehículo" : "Nuevo Vehículo"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Imagen destacada en la parte superior */}
          <div className="mb-6 relative">
            {form.image_url ? (
              <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-zinc-800 bg-zinc-900">
                <img src={form.image_url} alt="Vehículo" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => handleChange("image_url", "")}
                  className="absolute top-3 right-3 p-2 bg-zinc-900/90 rounded-full hover:bg-zinc-800 border border-zinc-700 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <div className="relative w-full h-64 rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 flex flex-col items-center justify-center gap-3">
                <ImageIcon className="w-16 h-16 text-zinc-700" />
                <p className="text-sm text-zinc-500">Foto del vehículo</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-3 right-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploading ? "Subiendo..." : "Seleccionar Archivo"}
            </Button>
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="bg-zinc-900 border-zinc-800 mb-4 w-full justify-start">
              <TabsTrigger value="general" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400 data-[state=active]:border-yellow-500/30">General</TabsTrigger>
              <TabsTrigger value="service" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400 data-[state=active]:border-yellow-500/30">Servicio</TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400 data-[state=active]:border-yellow-500/30">Documentos</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400 data-[state=active]:border-yellow-500/30">Historial</TabsTrigger>
              <TabsTrigger value="other" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400 data-[state=active]:border-yellow-500/30">Otros</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label>Interno (Calco ID) *</Label>
                <Input
                  value={form.internal_number}
                  onChange={(e) => handleChange("internal_number", e.target.value.slice(0, 10))}
                  className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                  placeholder="Ej: MTU736"
                  maxLength={10}
                />
                <p className="text-xs text-zinc-500">* Se requiere Interno o Patente</p>
              </div>

              {isSuperAdmin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Empresa *</Label>
                    <Select value={form.company_id || ""} onValueChange={(v) => handleChange("company_id", v)} required>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50">
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
                    <Select value={form.location_id || ""} onValueChange={(v) => handleChange("location_id", v)} required>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50">
                        <SelectValue placeholder={selectedCompanyId ? "Seleccionar locación" : "Primero seleccione empresa"}>
                          {selectedLocationName}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {filteredLocations.length > 0 ? (
                          filteredLocations.map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-zinc-500">No hay locaciones disponibles</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {!isSuperAdmin && (
                <div className="space-y-2">
                  <Label>Locación *</Label>
                  <Select value={form.location_id || ""} onValueChange={(v) => handleChange("location_id", v)} required>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50">
                      <SelectValue placeholder="Seleccionar locación">
                        {selectedLocationName}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLocations.length > 0 ? (
                        filteredLocations.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-zinc-500">No hay locaciones disponibles</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Fabricante *</Label>
                  <Select 
                    value={form.manufacturer || ""}
                    onValueChange={(value) => {
                      const selectedMan = manufacturers.find(m => m.name === value);
                      handleChange("manufacturer", value);
                      handleChange("manufacturer_logo_url", selectedMan ? selectedMan.logo_url : "");
                    }}
                    required
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50">
                      <SelectValue placeholder="Seleccionar fabricante" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturers.map(m => (
                        <SelectItem key={m.id} value={m.name}>
                          <div className="flex items-center gap-2">
                            {m.logo_url && <img src={m.logo_url} alt={m.name} className="h-5 w-auto object-contain" />}
                            {m.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select value={form.year?.toString() || ""} onValueChange={(v) => handleChange("year", v === "" ? null : parseInt(v))}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value={null}>Sin año</SelectItem>
                      {Array.from({ length: 151 }, (_, i) => 2050 - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Patente *</Label>
                <Input
                  value={form.plate}
                  onChange={(e) => handleChange("plate", e.target.value.slice(0, 10).toUpperCase())}
                  className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                  placeholder="ABC123"
                  maxLength={10}
                />
                <p className="text-xs text-zinc-500">* Se requiere Interno o Patente</p>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select 
                  value={form.type_id || ""} 
                  onValueChange={(v) => handleChange("type_id", v)}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Sin tipo</SelectItem>
                    {vehicleTypeOptions
                      .sort((a, b) => a.display_name.localeCompare(b.display_name))
                      .map(vt => (
                        <SelectItem key={vt.id} value={vt.id}>
                          {vt.display_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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
                      {vehicleStatuses
                        .filter(s => s.is_active)
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map(status => (
                          <SelectItem key={status.id} value={status.code}>
                            {status.name}
                          </SelectItem>
                        ))}
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
                <div className="flex items-center justify-between">
                  <Label>Conductores Asignados</Label>
                  {form.assigned_driver_ids.length < 3 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addDriver}
                      className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  )}
                </div>
                {form.assigned_driver_ids.length === 0 ? (
                  <div className="p-4 rounded-lg border-2 border-dashed border-zinc-800 text-center">
                    <p className="text-sm text-zinc-500">Sin conductores asignados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.assigned_driver_ids.map((driverId, index) => (
                      <div key={index} className="flex gap-2">
                        <Select 
                          value={driverId || ""} 
                          onValueChange={(v) => updateDriver(index, v)}
                        >
                          <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 flex-1">
                            <SelectValue placeholder={`Conductor ${index + 1}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={null}>Sin asignar</SelectItem>
                            {filteredDrivers
                              .filter(d => d.status === 'active' && (d.location_id === form.location_id || form.assigned_driver_ids.includes(d.id)))
                              .map(driver => (
                                <SelectItem key={driver.id} value={driver.id}>
                                  {driver.full_name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeDriver(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="service" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  Último Servicio
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Kilómetros</Label>
                    <Input
                      type="number"
                      value={form.last_service_mileage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        handleChange("last_service_mileage", Math.min(val, 999999));
                      }}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                      max={999999}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horas</Label>
                    <Input
                      type="number"
                      value={form.last_service_hours}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        handleChange("last_service_hours", Math.min(val, 99999));
                      }}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                      max={99999}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      value={form.last_service_date}
                      onChange={(e) => handleChange("last_service_date", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-zinc-800"></div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  Próximo Servicio
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Kilómetros</Label>
                    <Input
                      type="number"
                      value={form.next_service_mileage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        handleChange("next_service_mileage", Math.min(val, 999999));
                      }}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                      max={999999}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horas</Label>
                    <Input
                      type="number"
                      value={form.next_service_hours}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        handleChange("next_service_hours", Math.min(val, 99999));
                      }}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                      max={99999}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      value={form.next_service_date}
                      onChange={(e) => handleChange("next_service_date", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Cédula Vehículo */}
                <VehicleCardDocument
                  title="Cédula Vehículo"
                  document_front_url={form.vehicle_card_front_url}
                  document_back_url={form.vehicle_card_back_url}
                  document_expiry={form.vehicle_card_front_expiry}
                  expiry_field="vehicle_card_front_expiry"
                  front_url_field="vehicle_card_front_url"
                  back_url_field="vehicle_card_back_url"
                  uploading={uploading}
                  onExpiryChange={handleChange}
                  onFrontFileChange={(e) => handleImageUpload(e, "vehicle_card_front_url")}
                  onBackFileChange={(e) => handleImageUpload(e, "vehicle_card_back_url")}
                  onDelete={handleChange}
                  uploadFrontId="vehicle-card-front-upload"
                  uploadBackId="vehicle-card-back-upload"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Título Automotor */}
                <DocumentCard
                  title="Título Automotor"
                  document_url={form.title_url}
                  document_expiry={form.title_expiry}
                  expiry_field="title_expiry"
                  url_field="title_url"
                  uploading={uploading}
                  onExpiryChange={handleChange}
                  onFileChange={(e) => handleImageUpload(e, "title_url")}
                  onDelete={handleChange}
                  uploadId="title-upload"
                />

                {/* Patente */}
                <DocumentCard
                  title="Patente"
                  document_url={form.license_plate_url}
                  document_expiry={form.license_plate_expiry}
                  expiry_field="license_plate_expiry"
                  url_field="license_plate_url"
                  uploading={uploading}
                  onExpiryChange={handleChange}
                  onFileChange={(e) => handleImageUpload(e, "license_plate_url")}
                  onDelete={handleChange}
                  uploadId="license-plate-upload"
                />

                {/* Verificación Técnica (VTV) */}
                <DocumentCard
                  title="Verificación Técnica (VTV)"
                  document_url={form.technical_inspection_url}
                  document_expiry={form.technical_inspection_expiry}
                  expiry_field="technical_inspection_expiry"
                  url_field="technical_inspection_url"
                  uploading={uploading}
                  onExpiryChange={handleChange}
                  onFileChange={(e) => handleImageUpload(e, "technical_inspection_url")}
                  onDelete={handleChange}
                  uploadId="technical-inspection-upload"
                />

                {/* Grabado de Autopartes */}
                <DocumentCard
                  title="Grabado de Autopartes"
                  document_url={form.parts_engraving_url}
                  document_expiry={form.parts_engraving_expiry}
                  expiry_field="parts_engraving_expiry"
                  url_field="parts_engraving_url"
                  uploading={uploading}
                  onExpiryChange={handleChange}
                  onFileChange={(e) => handleImageUpload(e, "parts_engraving_url")}
                  onDelete={handleChange}
                  uploadId="parts-engraving-upload"
                />

                {/* Extintor */}
                <DocumentCard
                  title="Extintor"
                  document_url={form.fire_extinguisher_url}
                  document_expiry={form.fire_extinguisher_expiry}
                  expiry_field="fire_extinguisher_expiry"
                  url_field="fire_extinguisher_url"
                  uploading={uploading}
                  onExpiryChange={handleChange}
                  onFileChange={(e) => handleImageUpload(e, "fire_extinguisher_url")}
                  onDelete={handleChange}
                  uploadId="fire-extinguisher-upload"
                />

                {/* Póliza de Seguro */}
                <DocumentCard
                  title="Póliza de Seguro"
                  document_url={form.insurance_url}
                  document_expiry={form.insurance_expiry}
                  expiry_field="insurance_expiry"
                  url_field="insurance_url"
                  uploading={uploading}
                  onExpiryChange={handleChange}
                  onFileChange={(e) => handleImageUpload(e, "insurance_url")}
                  onDelete={handleChange}
                  uploadId="insurance-upload"
                />

                {/* Credencial de Circulación */}
                <DocumentCard
                  title="Credencial de Circulación"
                  document_url={form.circulation_permit_url}
                  document_expiry={form.circulation_permit_expiry}
                  expiry_field="circulation_permit_expiry"
                  url_field="circulation_permit_url"
                  uploading={uploading}
                  onExpiryChange={handleChange}
                  onFileChange={(e) => handleImageUpload(e, "circulation_permit_url")}
                  onDelete={handleChange}
                  uploadId="circulation-permit-upload"
                />
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {vehicle && <VehicleMaintenanceHistory vehicleId={vehicle.id} />}
              {!vehicle && (
                <div className="p-8 text-center">
                  <p className="text-zinc-500">Guarde el vehículo para ver el historial de mantenimiento.</p>
                </div>
              )}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed">
              Cancelar
            </Button>
            <Button 
  type="submit" 
  disabled={isLoading || isSubmitting || saveSuccess} 
  className={`transition-all min-w-[120px] font-semibold ${
    isLoading || isSubmitting
      ? 'bg-blue-600 hover:bg-blue-700' 
      : saveSuccess 
        ? 'bg-green-600 hover:bg-green-700' 
        : 'bg-yellow-500 hover:bg-yellow-600'
  }`}
>
  {isLoading || isSubmitting ? (
    <div className="flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Guardando...</span>
    </div>
  ) : saveSuccess ? (
    <div className="flex items-center gap-2">
      <Check className="w-4 h-4" />
      <span>¡Listo!</span>
    </div>
  ) : (
    <span>{vehicle ? "Guardar" : "Crear"}</span>
  )}
</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}