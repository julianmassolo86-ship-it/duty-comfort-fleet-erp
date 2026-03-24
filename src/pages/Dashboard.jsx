import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Car, Users, Wrench, FileText, AlertTriangle, 
  TrendingUp, Calendar, ArrowRight, Building2, MapPin, BarChart3, Wind, FileWarning, Plus, Eye
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import StatCard from "../components/dashboard/StatCard";
import AlertCard from "../components/dashboard/AlertCard";
import MaintenanceAlertCard from "../components/dashboard/MaintenanceAlertCard";
import FollowUpAlertCard from "../components/dashboard/FollowUpAlertCard";
import PageHeader from "../components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "../components/common/ThemeWrapper";
import ExpiryListDialog from "../components/dashboard/ExpiryListDialog";
import VehicleStatusPieChart from "../components/dashboard/VehicleStatusPieChart";
import VehicleTypePieChart from "../components/dashboard/VehicleTypePieChart";
import VehiclesByCompanyChart from "../components/dashboard/VehiclesByCompanyChart";
import MaintenanceDialog from "../components/maintenance/MaintenanceDialog";
import NovedadDialog from "../components/novedades/NovedadDialog";
import AirConditioningMaintenanceDialog from "../components/ac-maintenance/AirConditioningMaintenanceDialog";
import NovedadesSummaryCard from "../components/dashboard/NovedadesSummaryCard";

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showExpiryList, setShowExpiryList] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showNovedadDialog, setShowNovedadDialog] = useState(false);
  const [showACDialog, setShowACDialog] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Si el usuario no tiene company_id, es super admin
  const isSuperAdmin = !currentUser?.company_id;

  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const { data: drivers = [], isLoading: loadingDrivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list(),
  });

  const { data: maintenances = [], isLoading: loadingMaintenance } = useQuery({
    queryKey: ['maintenances'],
    queryFn: () => base44.entities.Maintenance.list(),
  });

  const { data: documents = [], isLoading: loadingDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list(),
  });

  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: () => base44.entities.VehicleType.list(),
  });

  const { data: vehicleCategories = [] } = useQuery({
    queryKey: ['vehicleCategories'],
    queryFn: () => base44.entities.VehicleCategory.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    enabled: isSuperAdmin,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const { data: novedades = [], isLoading: loadingNovedades } = useQuery({
    queryKey: ['novedades'],
    queryFn: () => base44.entities.Novedad.list('-fecha_reporte'),
  });

  const { data: maintenanceSchedules = [] } = useQuery({
    queryKey: ['vehicleMaintenanceSchedules'],
    queryFn: () => base44.entities.VehicleMaintenanceSchedule.list(),
  });

  const { data: maintenanceTaskDefinitions = [] } = useQuery({
    queryKey: ['maintenanceTaskDefinitions'],
    queryFn: () => base44.entities.MaintenanceTaskDefinition.list(),
  });

  const { data: acReports = [] } = useQuery({
    queryKey: ['airConditioningReports'],
    queryFn: () => base44.entities.AirConditioningMaintenance.list('-inspection_date'),
  });

  const isLoading = loadingVehicles || loadingDrivers || loadingMaintenance || loadingDocuments || loadingNovedades;

  // Enriquecer vehículos con nombre del tipo y categoría
  const enrichedVehicles = vehicles.map(vehicle => {
    if (vehicle.type_id) {
      const vehicleType = vehicleTypes.find(vt => vt.id === vehicle.type_id);
      const category = vehicleType ? vehicleCategories.find(vc => vc.id === vehicleType.category_id) : null;
      return {
        ...vehicle,
        type_name: vehicleType?.name || 'Sin tipo',
        category_id: vehicleType?.category_id,
        category_name: category?.name || 'Sin categoría'
      };
    }
    return vehicle;
  });

  // Filtrar datos según rol
  const accessibleVehicles = isSuperAdmin 
    ? enrichedVehicles 
    : enrichedVehicles.filter(v => v.company_id === currentUser?.company_id);
  
  const accessibleDrivers = isSuperAdmin 
    ? drivers 
    : drivers.filter(d => d.company_id === currentUser?.company_id);

  const accessibleMaintenances = isSuperAdmin 
    ? maintenances 
    : maintenances.filter(m => m.company_id === currentUser?.company_id);

  const accessibleLocations = isSuperAdmin 
    ? locations 
    : locations.filter(l => l.company_id === currentUser?.company_id);

  const accessibleNovedades = isSuperAdmin 
    ? novedades 
    : novedades.filter(n => n.company_id === currentUser?.company_id);

  const accessibleACReports = isSuperAdmin 
    ? acReports 
    : acReports.filter(r => r.company_id === currentUser?.company_id);

  // Calculate maintenance alerts
  const getMaintenanceAlerts = () => {
    const alerts = [];
    
    maintenanceSchedules.forEach(schedule => {
      const vehicle = accessibleVehicles.find(v => v.id === schedule.vehicle_id);
      if (!vehicle) return;
      
      const taskDef = maintenanceTaskDefinitions.find(t => t.id === schedule.maintenance_task_definition_id);
      if (!taskDef) return;

      let status = 'on_track';
      let dueInfo = '';
      
      // Calcular estado según el tipo de intervalo
      if (taskDef.interval_type === 'mileage' || taskDef.interval_type === 'miles') {
        if (schedule.next_due_mileage && vehicle.mileage) {
          const remaining = schedule.next_due_mileage - vehicle.mileage;
          const warningThreshold = taskDef.warning_interval_type === 'mileage' || taskDef.warning_interval_type === 'miles' 
            ? taskDef.warning_interval_value || 500 
            : 500;
          
          if (remaining <= 0) {
            status = 'overdue';
            dueInfo = `Vencido (${Math.abs(remaining)} km pasados)`;
          } else if (remaining <= warningThreshold) {
            status = 'due_soon';
            dueInfo = `Faltan ${remaining} km`;
          } else {
            return; // No mostrar si está muy lejos
          }
        }
      } else if (taskDef.interval_type === 'hours') {
        if (schedule.next_due_hours && vehicle.hours) {
          const remaining = schedule.next_due_hours - vehicle.hours;
          const warningThreshold = taskDef.warning_interval_type === 'hours' 
            ? taskDef.warning_interval_value || 50 
            : 50;
          
          if (remaining <= 0) {
            status = 'overdue';
            dueInfo = `Vencido (${Math.abs(remaining)} hs pasadas)`;
          } else if (remaining <= warningThreshold) {
            status = 'due_soon';
            dueInfo = `Faltan ${remaining} hs`;
          } else {
            return;
          }
        }
      } else if (taskDef.interval_type === 'months' || taskDef.interval_type === 'years') {
        if (schedule.next_due_date) {
          const daysRemaining = differenceInDays(new Date(schedule.next_due_date), new Date());
          const warningThreshold = taskDef.warning_interval_type === 'days' 
            ? taskDef.warning_interval_value || 7 
            : 7;
          
          if (daysRemaining < 0) {
            status = 'overdue';
            dueInfo = `Vencido hace ${Math.abs(daysRemaining)} días`;
          } else if (daysRemaining <= warningThreshold) {
            status = 'due_soon';
            dueInfo = daysRemaining === 0 ? 'Vence hoy' : `Vence en ${daysRemaining} días`;
          } else {
            return;
          }
        }
      }

      alerts.push({
        id: schedule.id,
        vehiclePlate: vehicle.plate || vehicle.internal_number,
        vehicleModel: `${vehicle.manufacturer} ${vehicle.model}`,
        taskName: taskDef.name,
        status,
        dueInfo
      });
    });

    return alerts.sort((a, b) => {
      const order = { overdue: 0, due_soon: 1, on_track: 2 };
      return order[a.status] - order[b.status];
    }).slice(0, 10);
  };

  // Calculate alerts
  const getAlerts = () => {
    const alerts = [];
    const today = new Date();
    const warningDays = 30;

    // Vehicle document alerts - incluir TODOS los campos de vencimiento
    const vehicleFields = [
      { key: 'insurance_expiry', label: 'Seguro' },
      { key: 'technical_inspection_expiry', label: 'VTV' },
      { key: 'circulation_permit_expiry', label: 'Permiso de circulación' },
      { key: 'vehicle_card_front_expiry', label: 'Cédula del vehículo' },
      { key: 'title_expiry', label: 'Título automotor' },
      { key: 'license_plate_expiry', label: 'Patente' },
      { key: 'parts_engraving_expiry', label: 'Grabado de autopartes' },
      { key: 'fire_extinguisher_expiry', label: 'Extintor' },
      { key: 'next_service_date', label: 'Próximo service' }
    ];

    accessibleVehicles.forEach(v => {
      vehicleFields.forEach(({ key, label }) => {
        if (v[key]) {
          const days = differenceInDays(new Date(v[key]), today);
          // Incluir vencidos (días negativos) y próximos a vencer
          if (days <= warningDays) {
            alerts.push({
              id: `${v.id}-${key}`,
              title: `${label} - ${v.plate}`,
              description: `${v.manufacturer} ${v.model}`,
              date: v[key],
              severity: days < 0 ? 'critical' : days <= 7 ? 'critical' : 'warning',
              entityType: 'vehicle',
              daysRemaining: days
            });
          }
        }
      });
    });

    // Driver license alerts
    accessibleDrivers.forEach(d => {
      if (d.license_expiry) {
        const days = differenceInDays(new Date(d.license_expiry), today);
        if (days <= warningDays) {
          alerts.push({
            id: `${d.id}-license`,
            title: `Licencia de conducir - ${d.full_name}`,
            description: `Licencia tipo ${d.license_type || 'N/A'}`,
            date: d.license_expiry,
            severity: days < 0 ? 'critical' : days <= 7 ? 'critical' : 'warning',
            entityType: 'driver',
            daysRemaining: days
          });
        }
      }
    });

    return alerts.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 10);
  };

  const alerts = isLoading ? [] : getAlerts();
  const maintenanceAlerts = isLoading ? [] : getMaintenanceAlerts();

  // Obtener vehículos que requieren seguimiento
  const getFollowUpVehicles = () => {
    // Buscar reportes A/C con requiere_seguimiento marcado
    const reportsRequiringFollowUp = accessibleACReports.filter(r => 
      r.requiere_seguimiento && (r.status === 'completado' || r.status === 'aprobado')
    );
    
    // Agrupar por vehículo y obtener el más reciente
    const vehicleReportMap = new Map();
    reportsRequiringFollowUp.forEach(report => {
      const existing = vehicleReportMap.get(report.vehicle_id);
      if (!existing || new Date(report.inspection_date) > new Date(existing.inspection_date)) {
        vehicleReportMap.set(report.vehicle_id, report);
      }
    });
    
    return Array.from(vehicleReportMap.entries()).map(([vehicleId, report]) => {
      const vehicle = accessibleVehicles.find(v => v.id === vehicleId);
      return vehicle ? { vehicle, report } : null;
    }).filter(Boolean);
  };

  const followUpVehicles = isLoading ? [] : getFollowUpVehicles();
  const activeVehicles = accessibleVehicles.filter(v => v.status === 'active').length;
  const activeDrivers = accessibleDrivers.filter(d => d.status === 'active').length;
  const pendingMaintenance = accessibleMaintenances.filter(m => m.status === 'scheduled' || m.status === 'in_progress').length;
  const pendingNovedades = accessibleNovedades.filter(n => n.estado === 'pendiente' || n.estado === 'en_proceso').length;

  // Preparar datos para gráficos - Solo para Super Admin
  const getCompaniesData = () => {
    const active = companies.filter(c => c.status === 'active').length;
    const inactive = companies.filter(c => c.status === 'inactive').length;
    return [
      { name: 'Activas', value: active, color: '#10b981' },
      { name: 'Inactivas', value: inactive, color: '#6b7280' }
    ];
  };

  const getLocationsData = () => {
    const active = locations.filter(l => l.status === 'active').length;
    const inactive = locations.filter(l => l.status === 'inactive').length;
    return [
      { name: 'Activas', value: active, color: '#10b981' },
      { name: 'Inactivas', value: inactive, color: '#6b7280' }
    ];
  };

  const getVehiclesData = () => {
    const active = accessibleVehicles.filter(v => v.status === 'active').length;
    const available = accessibleVehicles.filter(v => v.status === 'available').length;
    const inUse = accessibleVehicles.filter(v => v.status === 'in_use').length;
    const maintenance = accessibleVehicles.filter(v => v.status === 'maintenance').length;
    const reserved = accessibleVehicles.filter(v => v.status === 'reserved').length;
    const inTransit = accessibleVehicles.filter(v => v.status === 'in_transit').length;
    const retired = accessibleVehicles.filter(v => v.status === 'retired').length;
    
    return [
      { name: 'Activo', value: active, color: '#10b981' },
      { name: 'Disponible', value: available, color: '#3b82f6' },
      { name: 'En Uso', value: inUse, color: '#8b5cf6' },
      { name: 'En Mantenimiento', value: maintenance, color: '#eab308' },
      { name: 'Reservado', value: reserved, color: '#f59e0b' },
      { name: 'En Tránsito', value: inTransit, color: '#06b6d4' },
      { name: 'Retirado', value: retired, color: '#6b7280' }
    ].filter(item => item.value > 0);
  };

  return (
    <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Dashboard" 
          description={isSuperAdmin ? "Vista general del sistema" : "Vista general de tu flota"}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className={cn("h-36 rounded-2xl", theme === 'dark' ? 'bg-zinc-900/50' : 'bg-gray-200')} />
            ))
          ) : (
            <>
              {isSuperAdmin && (
                <Link to={createPageUrl("Companies")} className="block">
                  <StatCard 
                    title="Empresas" 
                    value={companies.length}
                    subtitle={`${companies.filter(c => c.status === 'active').length} activas`}
                    icon={Building2}
                  />
                </Link>
              )}
              {isSuperAdmin && (
                <Link to={createPageUrl("Locations")} className="block">
                  <StatCard 
                    title="Locaciones" 
                    value={locations.length}
                    subtitle={`${locations.filter(l => l.status === 'active').length} activas`}
                    icon={MapPin}
                  />
                </Link>
              )}
              {!isSuperAdmin && (
                <Link to={createPageUrl("Locations")} className="block">
                  <StatCard 
                    title="Locaciones" 
                    value={accessibleLocations.length}
                    subtitle={`${accessibleLocations.filter(l => l.status === 'active').length} activas`}
                    icon={MapPin}
                  />
                </Link>
              )}
              <Link to={createPageUrl("Vehicles")} className="block">
                <StatCard 
                  title="Vehículos Activos" 
                  value={activeVehicles}
                  subtitle={`de ${accessibleVehicles.length} totales`}
                  icon={Car}
                />
              </Link>
              {!isSuperAdmin && (
                <Link to={createPageUrl("Drivers")} className="block">
                  <StatCard 
                    title="Conductores Activos" 
                    value={activeDrivers}
                    subtitle={`de ${accessibleDrivers.length} totales`}
                    icon={Users}
                  />
                </Link>
              )}
              <Link to={createPageUrl("Maintenance")} className="block">
                <StatCard 
                  title="Mantenimientos Pendientes" 
                  value={pendingMaintenance}
                  subtitle="programados o en progreso"
                  icon={Wrench}
                />
              </Link>
              <Link to={`${createPageUrl("Maintenance")}?tab=novedades`} className="block">
                <StatCard 
                  title="Novedades Pendientes" 
                  value={pendingNovedades}
                  subtitle="pendientes o en proceso"
                  icon={AlertTriangle}
                />
              </Link>
              <button 
                onClick={() => setShowExpiryList(true)}
                className="block w-full text-left"
              >
                <StatCard 
                  title="Alertas Activas" 
                  value={alerts.length}
                  subtitle="documentos por vencer"
                  icon={AlertTriangle}
                />
              </button>
            </>
          )}
        </div>



        {/* Pie Charts Section - Para todos los usuarios */}
        {!isLoading && accessibleVehicles.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Vehicle Status Pie Chart */}
              <div className={cn("rounded-2xl border p-6 backdrop-blur-xl shadow-2xl", theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800/50 shadow-black/20' : 'bg-white border-gray-200 shadow-gray-200/50')}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/20">
                    <BarChart3 className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className={cn("text-lg font-bold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Estados de Vehículos</h3>
                </div>
                <VehicleStatusPieChart vehicles={accessibleVehicles} />
              </div>

              {/* Vehicle Type Pie Chart */}
              <div className={cn("rounded-2xl border p-6 backdrop-blur-xl shadow-2xl", theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800/50 shadow-black/20' : 'bg-white border-gray-200 shadow-gray-200/50')}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
                    <Car className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className={cn("text-lg font-bold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Categorías de Vehículos</h3>
                </div>
                <VehicleTypePieChart vehicles={accessibleVehicles} vehicleCategories={vehicleCategories} />
              </div>
            </div>

            {/* Vehicles by Company Chart - Solo para Super Admin */}
            {isSuperAdmin && companies.length > 1 && (
              <div className="mb-8">
                <div className={cn("rounded-2xl border p-6 backdrop-blur-xl shadow-2xl", theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800/50 shadow-black/20' : 'bg-white border-gray-200 shadow-gray-200/50')}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20">
                      <Building2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className={cn("text-lg font-bold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Vehículos por Empresa</h3>
                  </div>
                  <VehiclesByCompanyChart vehicles={accessibleVehicles} companies={companies} />
                </div>
              </div>
            )}
          </>
        )}

        {/* Novedades Summary Card */}
        <div className="mb-8">
          <NovedadesSummaryCard
            novedades={accessibleNovedades}
            vehicles={accessibleVehicles}
            locations={accessibleLocations}
            companies={companies}
          />
        </div>

        {/* Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Document Alerts */}
            <div className={cn("rounded-2xl border p-6 backdrop-blur-xl shadow-2xl", theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800/50 shadow-black/20' : 'bg-white border-gray-200 shadow-gray-200/50')}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <FileWarning className="w-6 h-6 text-rose-400" />
                  </div>
                  <h2 className={cn("text-xl font-bold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Documentación</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                  onClick={() => setShowExpiryList(true)}
                >
                  Ver todos <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              
              {isLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className={cn("h-20 rounded-xl", theme === 'dark' ? 'bg-zinc-800/30' : 'bg-gray-200')} />
                  ))}
                </div>
              ) : alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <AlertCard key={alert.id} {...alert} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 inline-block mb-4">
                    <TrendingUp className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>No hay alertas pendientes</p>
                  <p className={cn("text-sm", theme === 'dark' ? 'text-slate-500' : 'text-gray-500')}>Todos los documentos están al día</p>
                </div>
              )}
            </div>

            {/* Follow Up Alerts */}
            {followUpVehicles.length > 0 && (
              <div className={cn("rounded-2xl border p-6 backdrop-blur-xl shadow-2xl", theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800/50 shadow-black/20' : 'bg-white border-gray-200 shadow-gray-200/50')}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 shadow-lg shadow-amber-500/10">
                      <Eye className="w-6 h-6 text-amber-400" />
                    </div>
                    <h2 className={cn("text-xl font-bold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Requieren Seguimiento</h2>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                    asChild
                  >
                    <Link to={createPageUrl("Vehicles")}>
                      Ver todos <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {followUpVehicles.slice(0, 5).map(({ vehicle, report }) => (
                    <FollowUpAlertCard key={vehicle.id} vehicle={vehicle} report={report} />
                  ))}
                </div>
              </div>
            )}

            {/* Maintenance Alerts */}
            <div className={cn("rounded-2xl border p-6 backdrop-blur-xl shadow-2xl", theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800/50 shadow-black/20' : 'bg-white border-gray-200 shadow-gray-200/50')}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 shadow-lg shadow-amber-500/10">
                    <Wrench className="w-6 h-6 text-amber-400" />
                  </div>
                  <h2 className={cn("text-xl font-bold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Mantenimientos</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                  asChild
                >
                  <Link to={createPageUrl("MaintenancePrograms")}>
                    Ver programas <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
              
              {isLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className={cn("h-20 rounded-xl", theme === 'dark' ? 'bg-zinc-800/30' : 'bg-gray-200')} />
                  ))}
                </div>
              ) : maintenanceAlerts.length > 0 ? (
                <div className="space-y-3">
                  {maintenanceAlerts.map(alert => (
                    <MaintenanceAlertCard key={alert.id} {...alert} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 inline-block mb-4">
                    <TrendingUp className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>No hay mantenimientos próximos</p>
                  <p className={cn("text-sm", theme === 'dark' ? 'text-slate-500' : 'text-gray-500')}>Todos los vehículos están al día</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={cn("rounded-2xl border p-6 backdrop-blur-xl shadow-2xl", theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800/50 shadow-black/20' : 'bg-white border-gray-200 shadow-gray-200/50')}>
            <h2 className={cn("text-xl font-bold mb-6", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Accesos Rápidos</h2>
            <div className="space-y-3">
              {/* Quick Create Actions */}
              <button onClick={() => setShowMaintenanceDialog(true)} className="block w-full group">
                <div className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all duration-300", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-yellow-500/30')}>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/10 group-hover:from-amber-500/20 group-hover:to-amber-600/10 transition-all duration-300">
                    <Plus className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-left">
                    <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Nuevo Mantenimiento</p>
                    <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>Registrar mantenimiento</p>
                  </div>
                </div>
              </button>
              <button onClick={() => setShowNovedadDialog(true)} className="block w-full group">
                <div className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all duration-300", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-yellow-500/30')}>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/10 group-hover:from-orange-500/20 group-hover:to-orange-600/10 transition-all duration-300">
                    <Plus className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="text-left">
                    <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Nueva Novedad Diaria</p>
                    <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>Reportar novedad</p>
                  </div>
                </div>
              </button>
              <button onClick={() => setShowACDialog(true)} className="block w-full group">
                <div className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all duration-300", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-yellow-500/30')}>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500/10 to-sky-600/5 border border-sky-500/10 group-hover:from-sky-500/20 group-hover:to-sky-600/10 transition-all duration-300">
                    <Plus className="w-5 h-5 text-sky-400" />
                  </div>
                  <div className="text-left">
                    <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Informe A/C</p>
                    <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>Nuevo informe AC</p>
                  </div>
                </div>
              </button>
              {isSuperAdmin && (
                <Link to={createPageUrl("Companies")} className="block group">
                  <div className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all duration-300", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-yellow-500/30')}>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/10 group-hover:from-purple-500/20 group-hover:to-purple-600/10 transition-all duration-300">
                      <Building2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Empresas</p>
                      <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>{companies.length} registradas</p>
                    </div>
                  </div>
                </Link>
              )}
              <Link to={createPageUrl("Locations")} className="block group">
                <div className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all duration-300", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-yellow-500/30')}>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/10 group-hover:from-emerald-500/20 group-hover:to-emerald-600/10 transition-all duration-300">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Locaciones</p>
                    <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>{accessibleLocations.length} registradas</p>
                  </div>
                </div>
              </Link>
              <Link to={createPageUrl("Vehicles")} className="block group">
                <div className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all duration-300", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-yellow-500/30')}>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/10 group-hover:from-yellow-500/20 group-hover:to-yellow-600/10 transition-all duration-300">
                    <Car className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Vehículos</p>
                    <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>{accessibleVehicles.length} registrados</p>
                  </div>
                </div>
              </Link>
              <Link to={createPageUrl("Drivers")} className="block group">
                <div className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all duration-300", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-yellow-500/30')}>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/10 group-hover:from-cyan-500/20 group-hover:to-cyan-600/10 transition-all duration-300">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Conductores</p>
                    <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>{accessibleDrivers.length} registrados</p>
                  </div>
                </div>
              </Link>
              <Link to={createPageUrl("Maintenance")} className="block group">
                <div className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all duration-300", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-yellow-500/30')}>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/10 group-hover:from-amber-500/20 group-hover:to-amber-600/10 transition-all duration-300">
                    <Wrench className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Mantenimiento</p>
                    <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>{accessibleMaintenances.length} registros</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Expiry List Dialog */}
      <ExpiryListDialog 
        open={showExpiryList}
        onOpenChange={setShowExpiryList}
        vehicles={accessibleVehicles}
        drivers={accessibleDrivers}
      />

      {/* Maintenance Dialog */}
      <MaintenanceDialog
        open={showMaintenanceDialog}
        onOpenChange={setShowMaintenanceDialog}
        onSave={async (data) => {
          await base44.entities.Maintenance.create(data);
          setShowMaintenanceDialog(false);
        }}
      />

      {/* Novedad Dialog */}
      <NovedadDialog
        open={showNovedadDialog}
        onOpenChange={setShowNovedadDialog}
        onSave={async (data) => {
          await base44.entities.Novedad.create(data);
          setShowNovedadDialog(false);
        }}
      />

      {/* AC Maintenance Dialog */}
      <AirConditioningMaintenanceDialog
        open={showACDialog}
        onOpenChange={setShowACDialog}
        onSave={async (data) => {
          await base44.entities.AirConditioningMaintenance.create(data);
          setShowACDialog(false);
        }}
      />
    </div>
  );
}