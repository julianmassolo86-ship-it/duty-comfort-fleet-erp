import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, PieChart, TrendingUp, Calendar,
  Car, Users, Wrench, DollarSign, FileText
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend,
  LineChart, Line
} from "recharts";
import { cn } from "@/lib/utils";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "../components/common/ThemeWrapper";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Reports() {
  const [period, setPeriod] = useState("6");
  const { theme } = useTheme();

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

  const isLoading = loadingVehicles || loadingDrivers || loadingMaintenance;

  // Fleet Status Distribution
  const fleetStatusData = [
    { name: 'Activos', value: vehicles.filter(v => v.status === 'active').length, color: '#10B981' },
    { name: 'En mantenimiento', value: vehicles.filter(v => v.status === 'maintenance').length, color: '#F59E0B' },
    { name: 'Inactivos', value: vehicles.filter(v => v.status === 'inactive').length, color: '#6B7280' },
  ].filter(item => item.value > 0);

  // Vehicle Type Distribution
  const vehicleTypeData = [
    { name: 'Autos', value: vehicles.filter(v => v.type === 'car').length },
    { name: 'Camiones', value: vehicles.filter(v => v.type === 'truck').length },
    { name: 'Vans', value: vehicles.filter(v => v.type === 'van').length },
    { name: 'Buses', value: vehicles.filter(v => v.type === 'bus').length },
    { name: 'Motos', value: vehicles.filter(v => v.type === 'motorcycle').length },
  ].filter(item => item.value > 0);

  // Maintenance by Month
  const getMaintenanceByMonth = () => {
    const months = [];
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthMaintenances = maintenances.filter(m => {
        const mDate = new Date(m.scheduled_date || m.created_date);
        return isWithinInterval(mDate, { start, end });
      });

      const preventive = monthMaintenances.filter(m => m.type === 'preventive').length;
      const corrective = monthMaintenances.filter(m => m.type === 'corrective').length;
      const inspection = monthMaintenances.filter(m => m.type === 'inspection').length;
      const totalCost = monthMaintenances.reduce((sum, m) => sum + (m.cost || 0), 0);

      months.push({
        month: format(date, 'MMM', { locale: es }),
        preventive,
        corrective,
        inspection,
        total: preventive + corrective + inspection,
        cost: totalCost
      });
    }
    return months;
  };

  const maintenanceByMonth = getMaintenanceByMonth();

  // Calculate totals
  const totalMaintenanceCost = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);
  const completedMaintenances = maintenances.filter(m => m.status === 'completed').length;
  const avgCostPerMaintenance = completedMaintenances > 0 
    ? (totalMaintenanceCost / completedMaintenances).toFixed(0) 
    : 0;

  // Driver Status
  const driverStatusData = [
    { name: 'Activos', value: drivers.filter(d => d.status === 'active').length, color: '#10B981' },
    { name: 'Inactivos', value: drivers.filter(d => d.status === 'inactive').length, color: '#6B7280' },
    { name: 'De baja', value: drivers.filter(d => d.status === 'on_leave').length, color: '#3B82F6' },
  ].filter(item => item.value > 0);

  return (
    <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Reportes" 
          description="Análisis y estadísticas de tu flota"
          actions={
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40 bg-zinc-900/50 border-zinc-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Último año</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl bg-zinc-900/50" />
            ))}
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard 
                title="Total Vehículos" 
                value={vehicles.length}
                subtitle={`${vehicles.filter(v => v.status === 'active').length} activos`}
                icon={Car}
              />
              <StatCard 
                title="Total Conductores" 
                value={drivers.length}
                subtitle={`${drivers.filter(d => d.status === 'active').length} activos`}
                icon={Users}
              />
              <StatCard 
                title="Mantenimientos" 
                value={maintenances.length}
                subtitle={`${completedMaintenances} completados`}
                icon={Wrench}
              />
              <StatCard 
                title="Costo Total" 
                value={`$${totalMaintenanceCost.toLocaleString()}`}
                subtitle={`Promedio: $${avgCostPerMaintenance}`}
                icon={DollarSign}
              />
            </div>

            <Tabs defaultValue="fleet" className="space-y-6">
              <TabsList className="bg-zinc-900 border-zinc-800">
                <TabsTrigger value="fleet" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400">Flota</TabsTrigger>
                <TabsTrigger value="maintenance" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400">Mantenimiento</TabsTrigger>
                <TabsTrigger value="drivers" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400">Conductores</TabsTrigger>
              </TabsList>

              <TabsContent value="fleet" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Fleet Status */}
                  <Card className="bg-zinc-900/80 border-zinc-800/50 backdrop-blur-xl shadow-2xl shadow-black/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-blue-400" />
                        Estado de la Flota
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {fleetStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <RechartsPie>
                            <Pie
                              data={fleetStatusData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {fleetStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                              labelStyle={{ color: '#fff' }}
                            />
                          </RechartsPie>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-slate-500">
                          No hay datos disponibles
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Vehicle Types */}
                  <Card className="bg-zinc-900/80 border-zinc-800/50 backdrop-blur-xl shadow-2xl shadow-black/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-400" />
                        Tipos de Vehículos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {vehicleTypeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={vehicleTypeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                              labelStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-slate-500">
                          No hay datos disponibles
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Maintenance Trend */}
                  <Card className="bg-zinc-900/80 border-zinc-800/50 backdrop-blur-xl shadow-2xl shadow-black/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Tendencia de Mantenimientos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={maintenanceByMonth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="month" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Legend />
                          <Bar dataKey="preventive" name="Preventivo" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="corrective" name="Correctivo" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="inspection" name="Inspección" fill="#10B981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Maintenance Costs */}
                  <Card className="bg-zinc-900/80 border-zinc-800/50 backdrop-blur-xl shadow-2xl shadow-black/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        Costos de Mantenimiento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={maintenanceByMonth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="month" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${v}`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                            labelStyle={{ color: '#fff' }}
                            formatter={(value) => [`$${value.toLocaleString()}`, 'Costo']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="cost" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            dot={{ fill: '#10B981', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="drivers" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Driver Status */}
                  <Card className="bg-zinc-900/80 border-zinc-800/50 backdrop-blur-xl shadow-2xl shadow-black/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        Estado de Conductores
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {driverStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <RechartsPie>
                            <Pie
                              data={driverStatusData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {driverStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                              labelStyle={{ color: '#fff' }}
                            />
                          </RechartsPie>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-slate-500">
                          No hay datos disponibles
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* License Types */}
                  <Card className="bg-zinc-900/80 border-zinc-800/50 backdrop-blur-xl shadow-2xl shadow-black/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-400" />
                        Tipos de Licencia
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={[
                          { name: 'Tipo A', value: drivers.filter(d => d.license_type === 'A').length },
                          { name: 'Tipo B', value: drivers.filter(d => d.license_type === 'B').length },
                          { name: 'Tipo C', value: drivers.filter(d => d.license_type === 'C').length },
                          { name: 'Tipo D', value: drivers.filter(d => d.license_type === 'D').length },
                          { name: 'Tipo E', value: drivers.filter(d => d.license_type === 'E').length },
                        ].filter(item => item.value > 0)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}