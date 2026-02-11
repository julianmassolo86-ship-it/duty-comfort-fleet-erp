import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Car, Users, Wrench, FileText, AlertTriangle, 
  TrendingUp, Calendar, ArrowRight, Building2, MapPin
} from "lucide-react";
import { differenceInDays } from "date-fns";
import StatCard from "../components/dashboard/StatCard";
import AlertCard from "../components/dashboard/AlertCard";
import PageHeader from "../components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);

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

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    enabled: isSuperAdmin,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const isLoading = loadingVehicles || loadingDrivers || loadingMaintenance || loadingDocuments;

  // Filtrar datos según rol
  const accessibleVehicles = isSuperAdmin 
    ? vehicles 
    : vehicles.filter(v => v.company_id === currentUser?.company_id);
  
  const accessibleDrivers = isSuperAdmin 
    ? drivers 
    : drivers.filter(d => d.company_id === currentUser?.company_id);

  const accessibleMaintenances = isSuperAdmin 
    ? maintenances 
    : maintenances.filter(m => m.company_id === currentUser?.company_id);

  const accessibleLocations = isSuperAdmin 
    ? locations 
    : locations.filter(l => l.company_id === currentUser?.company_id);

  // Calculate alerts
  const getAlerts = () => {
    const alerts = [];
    const today = new Date();
    const warningDays = 30;

    // Vehicle document alerts
    accessibleVehicles.forEach(v => {
      ['insurance_expiry', 'technical_inspection_expiry', 'circulation_permit_expiry'].forEach(field => {
        if (v[field]) {
          const days = differenceInDays(new Date(v[field]), today);
          if (days <= warningDays) {
            const labels = {
              insurance_expiry: 'Seguro',
              technical_inspection_expiry: 'VTV',
              circulation_permit_expiry: 'Permiso de circulación'
            };
            alerts.push({
              id: `${v.id}-${field}`,
              title: `${labels[field]} - ${v.plate}`,
              description: `${v.brand} ${v.model}`,
              date: v[field],
              severity: days <= 0 ? 'critical' : days <= 7 ? 'critical' : 'warning',
              entityType: 'vehicle'
            });
          }
        }
      });
    });

    // Driver license/medical alerts
    accessibleDrivers.forEach(d => {
      if (d.license_expiry) {
        const days = differenceInDays(new Date(d.license_expiry), today);
        if (days <= warningDays) {
          alerts.push({
            id: `${d.id}-license`,
            title: `Licencia de conducir - ${d.full_name}`,
            description: `Licencia tipo ${d.license_type}`,
            date: d.license_expiry,
            severity: days <= 0 ? 'critical' : days <= 7 ? 'critical' : 'warning',
            entityType: 'driver'
          });
        }
      }
      if (d.medical_certificate_expiry) {
        const days = differenceInDays(new Date(d.medical_certificate_expiry), today);
        if (days <= warningDays) {
          alerts.push({
            id: `${d.id}-medical`,
            title: `Certificado médico - ${d.full_name}`,
            description: 'Certificado médico por vencer',
            date: d.medical_certificate_expiry,
            severity: days <= 0 ? 'critical' : days <= 7 ? 'critical' : 'warning',
            entityType: 'driver'
          });
        }
      }
    });

    return alerts.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
  };

  const alerts = isLoading ? [] : getAlerts();
  const activeVehicles = accessibleVehicles.filter(v => v.status === 'active').length;
  const activeDrivers = accessibleDrivers.filter(d => d.status === 'active').length;
  const pendingMaintenance = accessibleMaintenances.filter(m => m.status === 'scheduled' || m.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Dashboard" 
          description={isSuperAdmin ? "Vista general del sistema" : "Vista general de tu flota"}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl bg-slate-800/50" />
            ))
          ) : (
            <>
              {isSuperAdmin && (
                <StatCard 
                  title="Empresas" 
                  value={companies.length}
                  subtitle={`${companies.filter(c => c.status === 'active').length} activas`}
                  icon={Building2}
                />
              )}
              {isSuperAdmin && (
                <StatCard 
                  title="Locaciones" 
                  value={locations.length}
                  subtitle={`${locations.filter(l => l.status === 'active').length} activas`}
                  icon={MapPin}
                />
              )}
              {!isSuperAdmin && (
                <StatCard 
                  title="Locaciones" 
                  value={accessibleLocations.length}
                  subtitle={`${accessibleLocations.filter(l => l.status === 'active').length} activas`}
                  icon={MapPin}
                />
              )}
              <StatCard 
                title="Vehículos Activos" 
                value={activeVehicles}
                subtitle={`de ${accessibleVehicles.length} totales`}
                icon={Car}
              />
              {!isSuperAdmin && (
                <StatCard 
                  title="Conductores Activos" 
                  value={activeDrivers}
                  subtitle={`de ${accessibleDrivers.length} totales`}
                  icon={Users}
                />
              )}
              <StatCard 
                title="Mantenimientos Pendientes" 
                value={pendingMaintenance}
                subtitle="programados o en progreso"
                icon={Wrench}
              />
              <StatCard 
                title="Alertas Activas" 
                value={alerts.length}
                subtitle="documentos por vencer"
                icon={AlertTriangle}
              />
            </>
          )}
        </div>

        {/* Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Alertas y Vencimientos</h2>
                </div>
                <Link to={createPageUrl("Documents")}>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    Ver todos <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              
              {isLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-xl bg-slate-700/30" />
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
                  <p className="text-slate-400">No hay alertas pendientes</p>
                  <p className="text-sm text-slate-500">Todos los documentos están al día</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Accesos Rápidos</h2>
            <div className="space-y-3">
              {isSuperAdmin && (
                <Link to={createPageUrl("Companies")} className="block">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                    <div className="p-2.5 rounded-lg bg-purple-500/10">
                      <Building2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Empresas</p>
                      <p className="text-sm text-slate-400">{companies.length} registradas</p>
                    </div>
                  </div>
                </Link>
              )}
              <Link to={createPageUrl("Locations")} className="block">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Locaciones</p>
                    <p className="text-sm text-slate-400">{accessibleLocations.length} registradas</p>
                  </div>
                </div>
              </Link>
              <Link to={createPageUrl("Vehicles")} className="block">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                  <div className="p-2.5 rounded-lg bg-blue-500/10">
                    <Car className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Vehículos</p>
                    <p className="text-sm text-slate-400">{accessibleVehicles.length} registrados</p>
                  </div>
                </div>
              </Link>
              <Link to={createPageUrl("Drivers")} className="block">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Conductores</p>
                    <p className="text-sm text-slate-400">{accessibleDrivers.length} registrados</p>
                  </div>
                </div>
              </Link>
              <Link to={createPageUrl("Maintenance")} className="block">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                  <div className="p-2.5 rounded-lg bg-amber-500/10">
                    <Wrench className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Mantenimiento</p>
                    <p className="text-sm text-slate-400">{accessibleMaintenances.length} registros</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}