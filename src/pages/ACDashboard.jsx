import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";
import PageHeader from "@/components/common/PageHeader";
import PullToRefresh from "@/components/common/PullToRefresh";
import { 
  Wind, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  TrendingUp,
  Calendar,
  Thermometer,
  Activity,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import AirConditioningMaintenanceDialog from "@/components/ac-maintenance/AirConditioningMaintenanceDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ACDashboard() {
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: acReports = [], isLoading: loadingReports, refetch: refetchReports } = useQuery({
    queryKey: ['ac-reports', user?.company_id],
    queryFn: async () => {
      if (user?.company_id) {
        return await base44.entities.AirConditioningMaintenance.filter({ company_id: user.company_id });
      }
      return await base44.entities.AirConditioningMaintenance.list();
    },
    enabled: !!user
  });

  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles', user?.company_id],
    queryFn: async () => {
      if (user?.company_id) {
        return await base44.entities.Vehicle.filter({ company_id: user.company_id });
      }
      return await base44.entities.Vehicle.list();
    },
    enabled: !!user
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list()
  });

  const handleRefresh = async () => {
    await refetchReports();
  };

  // Filtrar reportes
  const filteredReports = acReports.filter(report => {
    const matchesCompany = companyFilter === "all" || report.company_id === companyFilter;
    const matchesLocation = locationFilter === "all" || report.location_id === locationFilter;
    return matchesCompany && matchesLocation;
  });

  // Métricas
  const totalReports = filteredReports.length;
  const reportsThisMonth = filteredReports.filter(r => {
    const reportDate = new Date(r.inspection_date);
    const now = new Date();
    return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
  }).length;

  const requireFollowUp = filteredReports.filter(r => 
    r.requiere_seguimiento && (r.status === 'completado' || r.status === 'aprobado')
  ).length;

  const completedReports = filteredReports.filter(r => r.status === 'completado' || r.status === 'aprobado').length;
  const inProgressReports = filteredReports.filter(r => r.status === 'en_proceso').length;

  // Estado de sistemas A/C
  const systemsStatus = filteredReports.reduce((acc, report) => {
    if (report.status === 'completado' || report.status === 'aprobado') {
      const hasCriticalIssues = [
        report.componente_compresor_estado,
        report.componente_condensador_estado,
        report.componente_evaporador_estado,
        report.componente_carga_gas_estado
      ].includes('mal');

      const hasWarnings = [
        report.componente_compresor_estado,
        report.componente_condensador_estado,
        report.componente_evaporador_estado,
        report.componente_carga_gas_estado,
        report.componente_correa_estado,
        report.componente_filtro_estado
      ].includes('monitorear');

      if (hasCriticalIssues) {
        acc.critical++;
      } else if (hasWarnings) {
        acc.warning++;
      } else {
        acc.ok++;
      }
    }
    return acc;
  }, { ok: 0, warning: 0, critical: 0 });

  // Tipos de mantenimiento
  const maintenanceTypes = filteredReports.reduce((acc, report) => {
    acc[report.tipo_mantenimiento] = (acc[report.tipo_mantenimiento] || 0) + 1;
    return acc;
  }, {});

  const maintenanceTypesData = Object.entries(maintenanceTypes).map(([key, value]) => ({
    name: key === 'preventivo' ? 'Preventivo' : key === 'correctivo' ? 'Correctivo' : 'Inspección',
    value
  }));

  // Estado de componentes (últimos reportes completados)
  const completedReportsData = filteredReports.filter(r => r.status === 'completado' || r.status === 'aprobado');
  
  const componentStatus = {
    compresor: { ok: 0, mal: 0, monitorear: 0 },
    condensador: { ok: 0, mal: 0, monitorear: 0 },
    evaporador: { ok: 0, mal: 0, monitorear: 0 },
    carga_gas: { ok: 0, mal: 0, monitorear: 0 },
    filtro: { ok: 0, mal: 0, monitorear: 0 },
    correa: { ok: 0, mal: 0, monitorear: 0 }
  };

  completedReportsData.forEach(report => {
    Object.keys(componentStatus).forEach(comp => {
      const estado = report[`componente_${comp}_estado`];
      if (estado === 'ok' || estado === 'mal' || estado === 'monitorear') {
        componentStatus[comp][estado]++;
      }
    });
  });

  const componentChartData = Object.entries(componentStatus).map(([key, values]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    OK: values.ok,
    Mal: values.mal,
    Monitorear: values.monitorear
  }));

  const statusPieData = [
    { name: 'OK', value: systemsStatus.ok, color: '#10b981' },
    { name: 'Monitorear', value: systemsStatus.warning, color: '#eab308' },
    { name: 'Crítico', value: systemsStatus.critical, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const recentReports = [...filteredReports]
    .sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date))
    .slice(0, 5);

  if (loadingReports || loadingVehicles) {
    return (
      <div className="p-6">
        <PageHeader 
          title="Dashboard de Sistemas A/C"
          description="Cargando datos..."
        />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-6 space-y-6">
        <PageHeader 
          title="Dashboard de Sistemas A/C"
          description="Vista general del estado de los sistemas de aire acondicionado de la flota"
          actions={
            <div className="flex gap-2">
              {!user?.company_id && (
                <>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className={cn("w-40", theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : '')}>
                      <SelectValue placeholder="Empresa" />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                      <SelectItem value="all">Todas</SelectItem>
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={locationFilter} onValueChange={setLocationFilter} disabled={companyFilter === "all"}>
                    <SelectTrigger className={cn("w-40", theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : '')}>
                      <SelectValue placeholder="Ubicación" />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : ''}>
                      <SelectItem value="all">Todas</SelectItem>
                      {locations.filter(l => companyFilter === "all" || l.company_id === companyFilter).map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          }
        />

        {/* Tarjetas de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Inspecciones</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReports}</div>
              <p className="text-xs text-muted-foreground">
                {reportsThisMonth} este mes
              </p>
            </CardContent>
          </Card>

          <Card className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sistemas OK</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{systemsStatus.ok}</div>
              <p className="text-xs text-muted-foreground">
                Funcionando correctamente
              </p>
            </CardContent>
          </Card>

          <Card className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Requieren Seguimiento</CardTitle>
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{requireFollowUp}</div>
              <p className="text-xs text-muted-foreground">
                Atención requerida
              </p>
            </CardContent>
          </Card>

          <Card className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sistemas Críticos</CardTitle>
              <Activity className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{systemsStatus.critical}</div>
              <p className="text-xs text-muted-foreground">
                Necesitan reparación
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estado general de sistemas */}
          <Card className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : ''}>
            <CardHeader>
              <CardTitle className="text-base">Estado General de Sistemas A/C</CardTitle>
            </CardHeader>
            <CardContent>
              {statusPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tipos de mantenimiento */}
          <Card className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : ''}>
            <CardHeader>
              <CardTitle className="text-base">Tipos de Mantenimiento</CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceTypesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={maintenanceTypesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#eab308" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Estado de componentes */}
        <Card className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : ''}>
          <CardHeader>
            <CardTitle className="text-base">Estado de Componentes Principales</CardTitle>
          </CardHeader>
          <CardContent>
            {componentChartData.length > 0 && componentChartData.some(d => d.OK + d.Mal + d.Monitorear > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={componentChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#27272a' : '#e5e7eb'} />
                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#a1a1aa' : '#6b7280'} />
                  <YAxis stroke={theme === 'dark' ? '#a1a1aa' : '#6b7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#18181b' : '#fff',
                      border: theme === 'dark' ? '1px solid #3f3f46' : '1px solid #e5e7eb'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="OK" stackId="a" fill="#10b981" />
                  <Bar dataKey="Monitorear" stackId="a" fill="#eab308" />
                  <Bar dataKey="Mal" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No hay datos de componentes disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inspecciones recientes */}
        <Card className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : ''}>
          <CardHeader>
            <CardTitle className="text-base">Inspecciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentReports.length > 0 ? (
              <div className="space-y-2">
                {recentReports.map(report => {
                  const vehicle = vehicles.find(v => v.id === report.vehicle_id);
                  return (
                    <div
                      key={report.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors cursor-pointer",
                        theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      )}
                      onClick={() => {
                        setSelectedReport(report);
                        setShowDialog(true);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("text-xs font-mono font-semibold", theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600')}>
                              {report.report_number}
                            </span>
                            <Badge className={cn(
                              "text-xs",
                              report.status === 'completado' || report.status === 'aprobado'
                                ? 'bg-green-500/10 text-green-600 border-green-500/30'
                                : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
                            )}>
                              {report.status === 'en_proceso' ? 'En Proceso' : report.status === 'completado' ? 'Completado' : 'Aprobado'}
                            </Badge>
                            {report.requiere_seguimiento && (
                              <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-xs">
                                Seguimiento
                              </Badge>
                            )}
                          </div>
                          
                          <p className={cn("text-sm font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                            {vehicle ? `${vehicle.internal_number} - ${vehicle.plate}` : 'Vehículo'}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <Calendar className="w-3 h-3" />
                            <span className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>
                              {format(new Date(report.inspection_date), 'dd/MM/yyyy')}
                            </span>
                            <span className={theme === 'dark' ? 'text-zinc-600' : 'text-gray-400'}>•</span>
                            <span className={cn("capitalize", theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
                              {report.tipo_mantenimiento}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay inspecciones registradas
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {showDialog && selectedReport && (
        <AirConditioningMaintenanceDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          maintenance={selectedReport}
          onSuccess={handleRefresh}
        />
      )}
    </PullToRefresh>
  );
}