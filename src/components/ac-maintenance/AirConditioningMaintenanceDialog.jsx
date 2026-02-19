import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Search, X, Check, AlertTriangle, Eye, FileDown, Plus } from "lucide-react";
import jsPDF from "jspdf";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuickVehicleDialog from "../vehicles/QuickVehicleDialog";

const initialState = {
  vehicle_id: "",
  inspection_date: new Date().toISOString().split('T')[0],
  ambient_temperature: "",
  kilometraje: "",
  horas: "",
  tipo_mantenimiento: "preventivo",
  
  // Inspecciones iniciales (1-12)
  inspeccion_1_estado: "pendiente",
  inspeccion_1_observacion: "",
  inspeccion_2_estado: "pendiente",
  inspeccion_2_observacion: "",
  inspeccion_3_estado: "pendiente",
  inspeccion_3_observacion: "",
  inspeccion_4_estado: "pendiente",
  inspeccion_4_observacion: "",
  inspeccion_5_estado: "pendiente",
  inspeccion_5_observacion: "",
  inspeccion_6_estado: "pendiente",
  inspeccion_6_observacion: "",
  inspeccion_7_estado: "pendiente",
  inspeccion_7_observacion: "",
  inspeccion_8_estado: "pendiente",
  inspeccion_8_observacion: "",
  inspeccion_8_presion_estatica: "",
  inspeccion_9_estado: "pendiente",
  inspeccion_9_observacion: "",
  inspeccion_10_estado: "pendiente",
  inspeccion_10_observacion: "",
  inspeccion_10_lp: "",
  inspeccion_10_hp: "",
  inspeccion_11_estado: "pendiente",
  inspeccion_11_observacion: "",
  inspeccion_11_temperatura: "",
  inspeccion_12_estado: "pendiente",
  inspeccion_12_observacion: "",
  inspeccion_12_temperatura: "",
  
  // Componentes
  componente_compresor_estado: "pendiente",
  componente_compresor_observacion: "",
  componente_correa_estado: "pendiente",
  componente_correa_observacion: "",
  componente_poleas_estado: "pendiente",
  componente_poleas_observacion: "",
  componente_condensador_estado: "pendiente",
  componente_condensador_observacion: "",
  componente_evaporador_estado: "pendiente",
  componente_evaporador_observacion: "",
  componente_carga_gas_estado: "pendiente",
  componente_carga_gas_observacion: "",
  componente_filtro_estado: "pendiente",
  componente_filtro_observacion: "",
  componente_valvula_expansion_estado: "pendiente",
  componente_valvula_expansion_observacion: "",
  componente_calefaccion_estado: "pendiente",
  componente_calefaccion_observacion: "",
  componente_electronica_estado: "pendiente",
  componente_electronica_observacion: "",
  componente_mangueras_estado: "pendiente",
  componente_mangueras_observacion: "",
  componente_tapones_estado: "pendiente",
  componente_tapones_observacion: "",
  
  // Acciones realizadas
  acciones_realizadas: "",
  
  // Imágenes de muestra
  image_url_1: "",
  image_url_2: "",
  image_url_3: "",
  
  // Mediciones finales
  medicion_final_lp: "",
  medicion_final_hp: "",
  medicion_final_temp_frio_corte: "",
  medicion_final_temp_frio_acople: "",
  medicion_final_temp_calefaccion: "",
  
  estado_final_equipo: "",
  observaciones_finales: "",
  
  mecanico_responsable_name: "",
  planificador_mantenimiento_name: "",
  supervisor_mantenimiento_name: "",
  
  status: "en_proceso"
};

const inspecciones = [
  { num: 1, id: 6, label: "Comprobar el funcionamiento del forzador en todas las velocidades" },
  { num: 2, id: 7, label: "Revisar las direcciones del flujo de aire (parabrisas, pies, frente)" },
  { num: 3, id: 8, label: "Colocar manómetros en válvulas de servicio L/HP y verificar presión estática", hasPressure: true },
  { num: 4, id: 9, label: "Encender el motor y A/C, confirmar el acople del compresor y ventilaciones" },
  { num: 5, id: 10, label: "Registrar presiones LP y HP (PSI)", hasFields: true },
  { num: 6, id: 11, label: "Revisar el estado del rendimiento del sistema con un sensor de temperatura (FRÍO)", hasTemp: true },
  { num: 7, id: 12, label: "Revisar el estado del rendimiento del sistema con un sensor de temperatura (CALOR)", hasTemp: true },
  { num: 8, id: 1, label: "Tomar una muestra del estado de aceite" },
  { num: 9, id: 2, label: "Inspeccionar tuberías o mangueras en búsqueda de fugas de refrigerante o daños visibles" },
  { num: 10, id: 3, label: "Comprobar la limpieza del condensador, radiador e intercooler (si tiene)" },
  { num: 11, id: 4, label: "Examinar el estado de cableado y terminales o fichas" },
  { num: 12, id: 5, label: "Inspeccionar visualmente la correa, el embrague del compresor y ventilador del condensador" }
];

const componentes = [
  { key: "compresor", label: "Compresor" },
  { key: "correa", label: "Correa" },
  { key: "poleas", label: "Poleas" },
  { key: "condensador", label: "Condensador" },
  { key: "evaporador", label: "Evaporador" },
  { key: "carga_gas", label: "Carga de gas refrigerante" },
  { key: "filtro", label: "Filtro de aire y habitáculo" },
  { key: "valvula_expansion", label: "Válvula de expansión" },
  { key: "calefaccion", label: "Funcionamiento de la calefacción" },
  { key: "electronica", label: "Electrónica y controles" },
  { key: "mangueras", label: "Mangueras y tuberías" },
  { key: "tapones", label: "Tapones en válvulas de servicio alta y baja presión" }
];

const StatusIcon = ({ status }) => {
  switch (status) {
    case "ok":
      return <Check className="w-5 h-5 text-green-600" />;
    case "mal":
      return <X className="w-5 h-5 text-red-600" />;
    case "monitorear":
      return <Eye className="w-5 h-5 text-yellow-600" />;
    default:
      return <AlertTriangle className="w-5 h-5 text-gray-400" />;
  }
};

export default function AirConditioningMaintenanceDialog({ open, onOpenChange, maintenance, onSuccess }) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState(initialState);
  const [vehicles, setVehicles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [showQuickVehicleDialog, setShowQuickVehicleDialog] = useState(false);
  const [vehicleStatuses, setVehicleStatuses] = useState([]);
  const [uploadingImage, setUploadingImage] = useState({ 1: false, 2: false, 3: false });
  const [generatedReportNumber, setGeneratedReportNumber] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (open && user) {
      loadVehicles();
      loadCompanies();
      loadLocations();
      loadVehicleStatuses();
      if (maintenance) {
        setFormData({ ...initialState, ...maintenance });
        setGeneratedReportNumber(maintenance.report_number);
      } else {
        setFormData(initialState);
        generateReportNumber();
      }
      setError("");
      setSearchTerm("");
      setCompanyFilter("all");
      setLocationFilter("all");
      setShowVehicleSelector(!maintenance);
    }
  }, [open, maintenance, user]);



  useEffect(() => {
    if (formData.vehicle_id) {
      const vehicle = vehicles.find(v => v.id === formData.vehicle_id);
      if (vehicle) {
        // Obtener información adicional
        const company = companies.find(c => c.id === vehicle.company_id);
        const location = locations.find(l => l.id === vehicle.location_id);
        
        // Cargar categorías y tipos para obtener nombres
        Promise.all([
          vehicle.category_id ? base44.entities.VehicleCategory.filter({ id: vehicle.category_id }) : Promise.resolve([]),
          vehicle.type_id ? base44.entities.VehicleType.filter({ id: vehicle.type_id }) : Promise.resolve([])
        ]).then(([categories, types]) => {
          const category = categories[0];
          const type = types[0];
          
          setSelectedVehicle({
            ...vehicle,
            company_name: company?.name,
            location_name: location?.name,
            category_name: category?.name,
            type_name: type?.name
          });
        });
        
        if (!maintenance) {
          setFormData(prev => ({
            ...prev,
            kilometraje: vehicle.mileage || "",
            horas: vehicle.hours || ""
          }));
        }
      }
    }
  }, [formData.vehicle_id, vehicles, companies, locations, maintenance]);

  const loadVehicles = async () => {
    try {
      let allVehicles;
      if (user?.company_id) {
        allVehicles = await base44.entities.Vehicle.filter({ company_id: user.company_id });
      } else {
        allVehicles = await base44.entities.Vehicle.list();
      }
      setVehicles(allVehicles);
    } catch (err) {
      console.error("Error loading vehicles:", err);
    }
  };

  const loadCompanies = async () => {
    try {
      let allCompanies;
      if (user?.company_id) {
        allCompanies = await base44.entities.Company.filter({ id: user.company_id });
      } else {
        allCompanies = await base44.entities.Company.list();
      }
      setCompanies(allCompanies);
    } catch (err) {
      console.error("Error loading companies:", err);
    }
  };

  const loadLocations = async () => {
    try {
      let allLocations;
      if (user?.company_id) {
        allLocations = await base44.entities.Location.filter({ company_id: user.company_id });
      } else {
        allLocations = await base44.entities.Location.list();
      }
      setLocations(allLocations);
    } catch (err) {
      console.error("Error loading locations:", err);
    }
  };

  const loadVehicleStatuses = async () => {
    try {
      const statuses = await base44.entities.VehicleStatus.list();
      setVehicleStatuses(statuses.filter(s => s.is_active).sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (err) {
      console.error("Error loading vehicle statuses:", err);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchTerm === "" || 
      vehicle.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.internal_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = companyFilter === "all" || vehicle.company_id === companyFilter;
    const matchesLocation = locationFilter === "all" || vehicle.location_id === locationFilter;
    
    return matchesSearch && matchesCompany && matchesLocation;
  });

  const filteredLocations = locations.filter(loc => 
    companyFilter === "all" || loc.company_id === companyFilter
  );

  const handleSelectVehicle = (vehicle) => {
    setFormData({
      ...formData,
      vehicle_id: vehicle.id,
      company_id: vehicle.company_id,
      location_id: vehicle.location_id
    });
    setShowVehicleSelector(false);
    setSearchTerm("");
  };

  const handleQuickVehicleCreated = async (newVehicle) => {
    // Recargar vehículos
    await loadVehicles();
    // Seleccionar el nuevo vehículo
    handleSelectVehicle(newVehicle);
  };

  const handleImageUpload = async (file, imageNum) => {
    if (!file) return;
    
    setUploadingImage({ ...uploadingImage, [imageNum]: true });
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, [`image_url_${imageNum}`]: file_url });
    } catch (error) {
      console.error("Error uploading image:", error);
      setError(`Error al subir imagen ${imageNum}: ${error.message}`);
    } finally {
      setUploadingImage({ ...uploadingImage, [imageNum]: false });
    }
  };

  const handleSave = async (closeAfterSave = true) => {
    setError("");
    setLoading(true);

    try {
      if (!formData.vehicle_id) {
        throw new Error("Debe seleccionar un vehículo");
      }
      if (!formData.inspection_date) {
        throw new Error("Debe ingresar la fecha de inspección");
      }
      if (!formData.tipo_mantenimiento) {
        throw new Error("Debe seleccionar el tipo de mantenimiento");
      }

      const dataToSave = { ...formData };
      
      // Convertir strings vacíos a null para campos numéricos
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === "" && (
          key.includes("temperatura") || 
          key.includes("lp") || 
          key.includes("hp") ||
          key.includes("presion_estatica") ||
          key === "kilometraje" ||
          key === "horas"
        )) {
          dataToSave[key] = null;
        }
      });

      if (maintenance) {
        await base44.entities.AirConditioningMaintenance.update(maintenance.id, dataToSave);
      } else {
        // Asignar el número de reporte generado
        dataToSave.report_number = generatedReportNumber;
        const created = await base44.entities.AirConditioningMaintenance.create(dataToSave);
        // Si se acaba de crear, actualizar formData con el ID para futuras actualizaciones
        setFormData({ ...dataToSave, id: created.id });
      }

      // Actualizar vehículo si el estado final está definido o si hay kilometraje/horas
      if (formData.vehicle_id) {
        const vehicleUpdates = {};
        
        // Actualizar estado del vehículo si se definió estado final
        if (dataToSave.estado_final_equipo) {
          vehicleUpdates.status = dataToSave.estado_final_equipo;
        }
        
        // Actualizar kilometraje si se ingresó
        if (dataToSave.kilometraje) {
          vehicleUpdates.mileage = dataToSave.kilometraje;
        }
        
        // Actualizar horas si se ingresó
        if (dataToSave.horas) {
          vehicleUpdates.hours = dataToSave.horas;
        }
        
        // Solo hacer el update si hay algo que actualizar
        if (Object.keys(vehicleUpdates).length > 0) {
          await base44.entities.Vehicle.update(formData.vehicle_id, vehicleUpdates);
        }
      }

      onSuccess?.();
      if (closeAfterSave) {
        onOpenChange(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleSave(true);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = 20;

    const addHeader = () => {
      // Banda superior amarilla
      doc.setFillColor(234, 179, 8);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      // Título en blanco
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("INFORME DE INSPECCIÓN A/C", pageWidth / 2, 16, { align: "center" });
      
      // Línea divisoria
      doc.setDrawColor(234, 179, 8);
      doc.setLineWidth(0.5);
      doc.line(margin, 27, pageWidth - margin, 27);
      
      doc.setTextColor(0, 0, 0);
    };

    const addFooter = (pageNum) => {
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: "center" });
      doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    };

    const addSection = (title, resetY = false) => {
      if (resetY || y > pageHeight - 40) {
        doc.addPage();
        addHeader();
        y = 35;
      }
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y - 5, pageWidth - 2 * margin, 10, 'F');
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(title, margin + 3, y + 2);
      y += 12;
    };

    const addStatusBox = (label, status, obs = "", extraData = null) => {
      if (y > pageHeight - 30) {
        doc.addPage();
        addHeader();
        y = 35;
      }

      // Color según estado
      let bgColor, textColor;
      switch (status) {
        case 'ok':
          bgColor = [34, 197, 94]; textColor = [255, 255, 255];
          break;
        case 'mal':
          bgColor = [239, 68, 68]; textColor = [255, 255, 255];
          break;
        case 'monitorear':
          bgColor = [234, 179, 8]; textColor = [0, 0, 0];
          break;
        default:
          bgColor = [229, 231, 235]; textColor = [0, 0, 0];
      }

      // Caja principal
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, 'S');
      
      // Label
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(label, margin + 2, y + 5.5);
      
      // Estado badge
      doc.setFillColor(...bgColor);
      const statusText = status.toUpperCase();
      const statusWidth = 20;
      doc.roundedRect(pageWidth - margin - statusWidth - 2, y + 1.5, statusWidth, 5, 1, 1, 'F');
      doc.setTextColor(...textColor);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(statusText, pageWidth - margin - statusWidth / 2 - 2, y + 5, { align: "center" });
      doc.setTextColor(0, 0, 0);
      
      y += 8;

      // Observaciones y datos extra
      if (obs || extraData) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        
        if (obs) {
          const obsLines = doc.splitTextToSize(`• ${obs}`, pageWidth - 2 * margin - 4);
          doc.text(obsLines, margin + 2, y + 3);
          y += obsLines.length * 4 + 2;
        }
        
        if (extraData) {
          doc.text(extraData, margin + 2, y + 3);
          y += 5;
        }
        
        doc.setTextColor(0, 0, 0);
      }
      
      y += 2;
    };

    // Página 1: Encabezado
    addHeader();
    y = 35;

    // Información del Activo
    const boxHeight = selectedVehicle?.category_name || selectedVehicle?.type_name ? 55 : 45;
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, boxHeight, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL ACTIVO", margin + 3, y + 6);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    y += 12;
    if (selectedVehicle) {
      doc.text(`Vehículo: ${selectedVehicle.internal_number} - ${selectedVehicle.plate}`, margin + 3, y);
      y += 5;
      doc.text(`Marca/Modelo: ${selectedVehicle.manufacturer} ${selectedVehicle.model}`, margin + 3, y);
      y += 5;
      if (selectedVehicle.category_name || selectedVehicle.type_name) {
        const catType = [selectedVehicle.category_name, selectedVehicle.type_name].filter(Boolean).join(' - ');
        doc.text(`Categoría/Tipo: ${catType}`, margin + 3, y);
        y += 5;
      }
      if (selectedVehicle.company_name) {
        doc.text(`Empresa: ${selectedVehicle.company_name}`, margin + 3, y);
        y += 5;
      }
      if (selectedVehicle.location_name) {
        doc.text(`Ubicación: ${selectedVehicle.location_name}`, margin + 3, y);
        y += 5;
      }
    }
    doc.text(`Fecha de Inspección: ${formData.inspection_date.split('T')[0].split('-').reverse().join('/')}`, margin + 3, y);
    y += 5;
    doc.text(`Temperatura Ambiente: ${formData.ambient_temperature}°C`, margin + 3, y);
    doc.text(`Tipo: ${formData.tipo_mantenimiento.toUpperCase()}`, pageWidth - margin - 3, y, { align: "right" });
    y += 5;
    if (formData.kilometraje || formData.horas) {
      const kmsHrs = [
        formData.kilometraje ? `${formData.kilometraje} km` : '',
        formData.horas ? `${formData.horas} hs` : ''
      ].filter(Boolean).join(' / ');
      doc.text(`Lectura: ${kmsHrs}`, margin + 3, y);
      y += 5;
    }
    
    y += 10;

    // Inspecciones Iniciales
    addSection("1. INSPECCIONES INICIALES Y MEDICIONES");
    inspecciones.forEach((insp) => {
      const estado = formData[`inspeccion_${insp.id}_estado`] || "pendiente";
      const obs = formData[`inspeccion_${insp.id}_observacion`] || "";
      let extraData = null;
      
      if (insp.hasPressure && formData.inspeccion_8_presion_estatica) {
        extraData = `• Presión estática: ${formData.inspeccion_8_presion_estatica} PSI`;
      }
      if (insp.hasFields) {
        extraData = `• LP: ${formData.inspeccion_10_lp || 'N/A'} PSI | HP: ${formData.inspeccion_10_hp || 'N/A'} PSI`;
      }
      if (insp.hasTemp && formData[`inspeccion_${insp.id}_temperatura`]) {
        extraData = `• Temperatura: ${formData[`inspeccion_${insp.id}_temperatura`]}°C`;
      }
      
      addStatusBox(`${insp.num}. ${insp.label}`, estado, obs, extraData);
    });

    // Componentes
    addSection("2. ESTADO DE COMPONENTES", true);
    componentes.forEach((comp) => {
      const estado = formData[`componente_${comp.key}_estado`] || "pendiente";
      const obs = formData[`componente_${comp.key}_observacion`] || "";
      addStatusBox(comp.label, estado, obs);
    });

    // Acciones y Mediciones
    addSection("3. ACCIONES Y MEDICIONES FINALES", true);
    
    if (formData.acciones_realizadas) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Acciones Realizadas:", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const accionesLines = doc.splitTextToSize(formData.acciones_realizadas, pageWidth - 2 * margin);
      doc.text(accionesLines, margin, y);
      y += accionesLines.length * 5 + 5;
    }

    // Tabla de mediciones finales
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Mediciones Finales:", margin, y);
    y += 7;
    
    const mediciones = [
      { label: "Presión LP Final", value: formData.medicion_final_lp ? `${formData.medicion_final_lp} PSI` : 'N/A' },
      { label: "Presión HP Final", value: formData.medicion_final_hp ? `${formData.medicion_final_hp} PSI` : 'N/A' },
      { label: "Temp. Frío Corte", value: formData.medicion_final_temp_frio_corte ? `${formData.medicion_final_temp_frio_corte}°C` : 'N/A' },
      { label: "Temp. Frío Acople", value: formData.medicion_final_temp_frio_acople ? `${formData.medicion_final_temp_frio_acople}°C` : 'N/A' },
      { label: "Temp. Calefacción", value: formData.medicion_final_temp_calefaccion ? `${formData.medicion_final_temp_calefaccion}°C` : 'N/A' },
    ];

    mediciones.forEach((med, idx) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        addHeader();
        y = 35;
      }
      doc.setFillColor(idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 250 : 255);
      doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(med.label, margin + 2, y + 4.5);
      doc.setFont("helvetica", "bold");
      doc.text(med.value, pageWidth - margin - 2, y + 4.5, { align: "right" });
      y += 7;
    });

    y += 8;

    // Información Final
    addSection("4. INFORMACIÓN FINAL");
    
    if (formData.estado_final_equipo) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Estado Final del Equipo:", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.text(formData.estado_final_equipo, margin, y);
      y += 8;
    }

    if (formData.observaciones_finales) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Observaciones y Recomendaciones:", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const obsLines = doc.splitTextToSize(formData.observaciones_finales, pageWidth - 2 * margin);
      doc.text(obsLines, margin, y);
      y += obsLines.length * 5 + 8;
    }

    // Firmas
    y += 5;
    if (y > pageHeight - 50) {
      doc.addPage();
      addHeader();
      y = 35;
    }
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("RESPONSABLES", margin, y);
    y += 8;

    const firmas = [
      { label: "Mecánico Responsable", name: formData.mecanico_responsable_name },
      { label: "Planificador de Mantenimiento", name: formData.planificador_mantenimiento_name },
      { label: "Supervisor de Mantenimiento", name: formData.supervisor_mantenimiento_name }
    ].filter(f => f.name);

    const firmaWidth = (pageWidth - 2 * margin - 10) / Math.max(firmas.length, 1);
    firmas.forEach((firma, idx) => {
      const x = margin + idx * (firmaWidth + 5);
      doc.setDrawColor(200, 200, 200);
      doc.line(x, y + 20, x + firmaWidth, y + 20);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(firma.label, x + firmaWidth / 2, y + 25, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text(firma.name || '', x + firmaWidth / 2, y + 30, { align: "center" });
    });

    // Añadir footers a todas las páginas
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i);
    }

    doc.save(`Inspeccion_AC_${selectedVehicle?.plate || 'sin_patente'}_${formData.inspection_date.split('T')[0]}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn("max-w-5xl max-h-[90vh] overflow-y-auto", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white')}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-3", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            <span>{maintenance ? "Editar Inspección A/C" : "Nueva Inspección de Aire Acondicionado"}</span>
            {generatedReportNumber && (
              <span className="text-sm font-mono px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-600 border border-yellow-500/30">
                {generatedReportNumber}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Información del Activo */}
          <div className={cn("p-4 rounded-lg border", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200')}>
            <h3 className={cn("font-semibold mb-4", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
              Información del Activo
            </h3>

            {selectedVehicle && !maintenance ? (
              <div className={cn("flex items-center justify-between p-3 rounded-lg border mb-4", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200')}>
                <div className="flex items-center gap-3">
                  {selectedVehicle.image_url && (
                    <img src={selectedVehicle.image_url} alt={selectedVehicle.plate} className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className={cn("font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                      {selectedVehicle.internal_number} - {selectedVehicle.plate}
                    </p>
                    <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                      {selectedVehicle.manufacturer} {selectedVehicle.model}
                    </p>
                    {(selectedVehicle.category_name || selectedVehicle.type_name) && (
                      <p className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-400')}>
                        {[selectedVehicle.category_name, selectedVehicle.type_name].filter(Boolean).join(' - ')}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFormData({ ...formData, vehicle_id: "", company_id: "", location_id: "" });
                    setSelectedVehicle(null);
                    setShowVehicleSelector(true);
                  }}
                  className={theme === 'dark' ? 'text-zinc-400 hover:text-white' : ''}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : !maintenance && !selectedVehicle ? (
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowVehicleSelector(!showVehicleSelector)}
                  className={cn("flex-1 justify-start", theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white' : '')}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Buscar vehículo...
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuickVehicleDialog(true)}
                  className={cn("", theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-yellow-500 hover:text-yellow-400 hover:bg-zinc-800' : 'border-yellow-500 text-yellow-600 hover:bg-yellow-50')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Rápido
                </Button>
              </div>
            ) : maintenance && selectedVehicle ? (
              <div className={cn("p-3 rounded-lg border mb-4", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200')}>
                <p className={cn("font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  {selectedVehicle.internal_number} - {selectedVehicle.plate}
                </p>
                <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                  {selectedVehicle.manufacturer} {selectedVehicle.model}
                </p>
              </div>
            ) : null}

            {showVehicleSelector && !maintenance && (
              <div className={cn("border rounded-lg p-4 space-y-3 mb-4", theme === 'dark' ? 'bg-zinc-900/50 border-zinc-700' : 'bg-gray-50 border-gray-200')}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por patente, número interno, marca, modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn("pl-10", theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : '')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                      <SelectValue placeholder="Empresa" />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                      <SelectItem value="all" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>
                        Todas las empresas
                      </SelectItem>
                      {companies.map((company) => (
                        <SelectItem 
                          key={company.id} 
                          value={company.id}
                          className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}
                        >
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={locationFilter} 
                    onValueChange={setLocationFilter}
                    disabled={companyFilter === "all"}
                  >
                    <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                      <SelectValue placeholder="Ubicación" />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                      <SelectItem value="all" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>
                        Todas las ubicaciones
                      </SelectItem>
                      {filteredLocations.map((location) => (
                        <SelectItem 
                          key={location.id} 
                          value={location.id}
                          className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}
                        >
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className={cn("max-h-64 overflow-y-auto space-y-1 rounded-lg border", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200')}>
                  {filteredVehicles.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                        No se encontraron vehículos
                      </p>
                    </div>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() => handleSelectVehicle(vehicle)}
                        className={cn("w-full text-left p-3 hover:bg-opacity-80 transition-colors border-b last:border-b-0", theme === 'dark' ? 'hover:bg-zinc-800 border-zinc-700' : 'hover:bg-gray-50 border-gray-100')}
                      >
                        <div className="flex items-center gap-3">
                          {vehicle.image_url ? (
                            <img 
                              src={vehicle.image_url} 
                              alt={vehicle.plate}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                              theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'
                            )}>
                              <span className={cn("text-xs font-medium", theme === 'dark' ? 'text-zinc-500' : 'text-gray-400')}>
                                {vehicle.internal_number}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-medium truncate", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                              {vehicle.internal_number} - {vehicle.plate}
                            </p>
                            <p className={cn("text-sm truncate", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                              {vehicle.manufacturer} {vehicle.model}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-400')}>
                              {companies.find(c => c.id === vehicle.company_id)?.name}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <p className={cn("text-xs text-center", theme === 'dark' ? 'text-zinc-500' : 'text-gray-400')}>
                  {filteredVehicles.length} vehículo{filteredVehicles.length !== 1 ? 's' : ''} encontrado{filteredVehicles.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Fecha de Inspección *</Label>
                <Input
                  type="date"
                  value={formData.inspection_date}
                  onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                  className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Temperatura Ambiente (°C) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.ambient_temperature}
                  onChange={(e) => setFormData({ ...formData, ambient_temperature: e.target.value })}
                  placeholder="Ej: 25"
                  className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Tipo de Mantenimiento *</Label>
                <Select
                  value={formData.tipo_mantenimiento}
                  onValueChange={(value) => setFormData({ ...formData, tipo_mantenimiento: value })}
                >
                  <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                    <SelectItem value="preventivo" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Preventivo</SelectItem>
                    <SelectItem value="correctivo" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Correctivo</SelectItem>
                    <SelectItem value="inspeccion" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Inspección</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Kilómetros</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.kilometraje}
                  onChange={(e) => setFormData({ ...formData, kilometraje: e.target.value })}
                  placeholder="Km"
                  className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Horas</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.horas}
                  onChange={(e) => setFormData({ ...formData, horas: e.target.value })}
                  placeholder="Hs"
                  className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                />
              </div>
            </div>
          </div>

          {/* Tabs para Inspecciones, Componentes y Mediciones */}
          <Tabs defaultValue="inspecciones" className="w-full">
            <TabsList className={cn("grid w-full grid-cols-5", theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100')}>
              <TabsTrigger value="inspecciones" className={theme === 'dark' ? 'data-[state=active]:bg-zinc-900' : ''}>
                Inspecciones
              </TabsTrigger>
              <TabsTrigger value="componentes" className={theme === 'dark' ? 'data-[state=active]:bg-zinc-900' : ''}>
                Componentes
              </TabsTrigger>
              <TabsTrigger value="mediciones" className={theme === 'dark' ? 'data-[state=active]:bg-zinc-900' : ''}>
                Mediciones
              </TabsTrigger>
              <TabsTrigger value="imagenes" className={theme === 'dark' ? 'data-[state=active]:bg-zinc-900' : ''}>
                Imágenes
              </TabsTrigger>
              <TabsTrigger value="final" className={theme === 'dark' ? 'data-[state=active]:bg-zinc-900' : ''}>
                Final
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inspecciones" className="space-y-4 mt-4">
              <h3 className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                Inspección Inicial y Mediciones
              </h3>
              {inspecciones.map((insp) => (
                <div key={insp.id} className={cn("p-4 rounded-lg border", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200')}>
                  <div className="flex items-start gap-3 mb-3">
                    <StatusIcon status={formData[`inspeccion_${insp.id}_estado`]} />
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium mb-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                        {insp.num}. {insp.label}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Select
                          value={formData[`inspeccion_${insp.id}_estado`]}
                          onValueChange={(value) => setFormData({ ...formData, [`inspeccion_${insp.id}_estado`]: value })}
                        >
                          <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                            <SelectItem value="pendiente" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Pendiente</SelectItem>
                            <SelectItem value="ok" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>OK</SelectItem>
                            <SelectItem value="mal" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Mal</SelectItem>
                            <SelectItem value="monitorear" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Monitorear</SelectItem>
                          </SelectContent>
                        </Select>

                        <Textarea
                          value={formData[`inspeccion_${insp.id}_observacion`]}
                          onChange={(e) => setFormData({ ...formData, [`inspeccion_${insp.id}_observacion`]: e.target.value })}
                          placeholder="Observaciones..."
                          rows={1}
                          className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                        />
                      </div>

                      {insp.hasPressure && (
                        <div className="mt-3">
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.inspeccion_8_presion_estatica}
                            onChange={(e) => setFormData({ ...formData, inspeccion_8_presion_estatica: e.target.value })}
                            placeholder="Presión estática (PSI)"
                            className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                          />
                        </div>
                      )}

                      {insp.hasFields && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.inspeccion_10_lp}
                            onChange={(e) => setFormData({ ...formData, inspeccion_10_lp: e.target.value })}
                            placeholder="Presión LP (PSI)"
                            className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                          />
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.inspeccion_10_hp}
                            onChange={(e) => setFormData({ ...formData, inspeccion_10_hp: e.target.value })}
                            placeholder="Presión HP (PSI)"
                            className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                          />
                        </div>
                      )}

                      {insp.hasTemp && (
                        <div className="mt-3">
                          <Input
                            type="number"
                            step="0.1"
                            value={formData[`inspeccion_${insp.id}_temperatura`]}
                            onChange={(e) => setFormData({ ...formData, [`inspeccion_${insp.id}_temperatura`]: e.target.value })}
                            placeholder="Temperatura (°C)"
                            className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="componentes" className="space-y-4 mt-4">
              <h3 className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                Estado de Componentes
              </h3>
              {componentes.map((comp) => (
                <div key={comp.key} className={cn("p-4 rounded-lg border", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200')}>
                  <div className="flex items-start gap-3">
                    <StatusIcon status={formData[`componente_${comp.key}_estado`]} />
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium mb-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                        {comp.label}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Select
                          value={formData[`componente_${comp.key}_estado`]}
                          onValueChange={(value) => setFormData({ ...formData, [`componente_${comp.key}_estado`]: value })}
                        >
                          <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                            <SelectItem value="pendiente" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Pendiente</SelectItem>
                            <SelectItem value="ok" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>OK</SelectItem>
                            <SelectItem value="mal" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Mal</SelectItem>
                            <SelectItem value="monitorear" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Monitorear</SelectItem>
                          </SelectContent>
                        </Select>

                        <Textarea
                          value={formData[`componente_${comp.key}_observacion`]}
                          onChange={(e) => setFormData({ ...formData, [`componente_${comp.key}_observacion`]: e.target.value })}
                          placeholder="Observaciones..."
                          rows={1}
                          className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="mediciones" className="space-y-4 mt-4">
              <h3 className={cn("font-semibold mb-4", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                Acciones y Mediciones Finales
              </h3>
              
              <div className="space-y-2 mb-6">
                <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Acciones Realizadas sobre la Unidad</Label>
                <Textarea
                  value={formData.acciones_realizadas}
                  onChange={(e) => setFormData({ ...formData, acciones_realizadas: e.target.value })}
                  placeholder="Describa las acciones realizadas durante el mantenimiento (reparaciones, ajustes, reemplazos, etc.)"
                  rows={4}
                  className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                />
              </div>

              <h4 className={cn("font-semibold mb-3 text-sm", theme === 'dark' ? 'text-zinc-300' : 'text-gray-700')}>
                Mediciones Finales
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Presión LP Final (PSI)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.medicion_final_lp}
                    onChange={(e) => setFormData({ ...formData, medicion_final_lp: e.target.value })}
                    placeholder="LP (PSI)"
                    className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Presión HP Final (PSI)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.medicion_final_hp}
                    onChange={(e) => setFormData({ ...formData, medicion_final_hp: e.target.value })}
                    placeholder="HP (PSI)"
                    className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Temp. Frío Corte (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.medicion_final_temp_frio_corte}
                    onChange={(e) => setFormData({ ...formData, medicion_final_temp_frio_corte: e.target.value })}
                    placeholder="T° Frío Corte"
                    className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Temp. Frío Acople (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.medicion_final_temp_frio_acople}
                    onChange={(e) => setFormData({ ...formData, medicion_final_temp_frio_acople: e.target.value })}
                    placeholder="T° Frío Acople"
                    className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Temp. Calefacción (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.medicion_final_temp_calefaccion}
                    onChange={(e) => setFormData({ ...formData, medicion_final_temp_calefaccion: e.target.value })}
                    placeholder="T° Calefacción"
                    className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="imagenes" className="space-y-4 mt-4">
              <h3 className={cn("font-semibold mb-4", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                Imágenes de Muestra del Trabajo
              </h3>
              
              <p className={cn("text-sm mb-6", theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
                Sube hasta 3 imágenes del trabajo realizado en el equipo
              </p>

              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((num) => (
                  <div key={num} className={cn("space-y-2")}>
                    <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
                      Imagen {num}
                    </Label>
                    
                    {formData[`image_url_${num}`] ? (
                      <div className="relative">
                        <img 
                          src={formData[`image_url_${num}`]} 
                          alt={`Muestra ${num}`}
                          className="w-full h-40 object-cover rounded-lg border-2"
                          style={{ borderColor: theme === 'dark' ? 'rgb(63, 63, 70)' : 'rgb(229, 231, 235)' }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => setFormData({ ...formData, [`image_url_${num}`]: "" })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className={cn(
                        "flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                        theme === 'dark' ? 'border-zinc-700 hover:border-zinc-600 bg-zinc-900' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                      )}>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e.target.files[0], num)}
                          disabled={uploadingImage[num]}
                        />
                        {uploadingImage[num] ? (
                          <>
                            <Loader2 className={cn("w-8 h-8 mb-2 animate-spin", theme === 'dark' ? 'text-zinc-500' : 'text-gray-400')} />
                            <span className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
                              Subiendo...
                            </span>
                          </>
                        ) : (
                          <>
                            <Plus className={cn("w-8 h-8 mb-2", theme === 'dark' ? 'text-zinc-500' : 'text-gray-400')} />
                            <span className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
                              Subir imagen
                            </span>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="final" className="space-y-4 mt-4">
              <h3 className={cn("font-semibold mb-4", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                Información Final
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Estado Final del Equipo</Label>
                  <Select
                    value={formData.estado_final_equipo}
                    onValueChange={(value) => setFormData({ ...formData, estado_final_equipo: value })}
                  >
                    <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                      <SelectValue placeholder="Seleccionar estado..." />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                      {vehicleStatuses.map((status) => (
                        <SelectItem 
                          key={status.id} 
                          value={status.code}
                          className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: status.color }}
                            />
                            {status.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Observaciones Finales y Recomendaciones</Label>
                  <Textarea
                    value={formData.observaciones_finales}
                    onChange={(e) => setFormData({ ...formData, observaciones_finales: e.target.value })}
                    placeholder="Observaciones finales y recomendaciones..."
                    rows={4}
                    className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Mecánico Responsable</Label>
                    <Input
                      value={formData.mecanico_responsable_name}
                      onChange={(e) => setFormData({ ...formData, mecanico_responsable_name: e.target.value })}
                      placeholder="Nombre"
                      className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Planificador de Mantenimiento</Label>
                    <Input
                      value={formData.planificador_mantenimiento_name}
                      onChange={(e) => setFormData({ ...formData, planificador_mantenimiento_name: e.target.value })}
                      placeholder="Nombre"
                      className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Supervisor de Mantenimiento</Label>
                    <Input
                      value={formData.supervisor_mantenimiento_name}
                      onChange={(e) => setFormData({ ...formData, supervisor_mantenimiento_name: e.target.value })}
                      placeholder="Nombre"
                      className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Estado del Informe</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                      <SelectItem value="en_proceso" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>En Proceso</SelectItem>
                      <SelectItem value="completado" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Completado</SelectItem>
                      <SelectItem value="aprobado" className={theme === 'dark' ? 'text-white focus:bg-zinc-700' : ''}>Aprobado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between gap-3 pt-4 border-t" style={{ borderColor: theme === 'dark' ? 'rgb(63, 63, 70)' : 'rgb(229, 231, 235)' }}>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={loading}
                className={theme === 'dark' ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : ''}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Progreso"
                )}
              </Button>
              {maintenance && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExportPDF}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-none shadow-lg hover:shadow-xl transition-all"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className={theme === 'dark' ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : ''}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : maintenance ? "Actualizar y Cerrar" : "Guardar y Cerrar"}
              </Button>
            </div>
          </div>
        </form>

        <QuickVehicleDialog
          open={showQuickVehicleDialog}
          onOpenChange={setShowQuickVehicleDialog}
          onSuccess={handleQuickVehicleCreated}
          user={user}
        />
      </DialogContent>
    </Dialog>
  );
}