import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Gauge, Clock, Calendar, CheckCircle2, AlertCircle, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const intervalTypeLabels = {
  mileage: { label: "Km", icon: Gauge },
  miles: { label: "Mi", icon: Gauge },
  hours: { label: "Hs", icon: Clock },
  months: { label: "Meses", icon: Calendar },
  years: { label: "Años", icon: Calendar },
  days: { label: "Días", icon: Calendar },
};

export default function VehicleMaintenanceScheduleManager({ vehicleId, currentMileage, currentHours }) {
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [recordForm, setRecordForm] = useState({
    date: new Date().toISOString().split('T')[0],
    mileage: currentMileage || 0,
    hours: currentHours || 0,
  });
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['vehicleMaintenanceSchedules', vehicleId],
    queryFn: async () => {
      return await base44.entities.VehicleMaintenanceSchedule.filter({ vehicle_id: vehicleId });
    },
    enabled: !!vehicleId,
  });

  const { data: taskDefinitions = [] } = useQuery({
    queryKey: ['maintenanceTaskDefinitions'],
    queryFn: () => base44.entities.MaintenanceTaskDefinition.list(),
  });

  const recordMaintenanceMutation = useMutation({
    mutationFn: async ({ scheduleId, data }) => {
      const schedule = schedules.find(s => s.id === scheduleId);
      const taskDef = taskDefinitions.find(t => t.id === schedule.maintenance_task_definition_id);
      
      // Calcular próximo vencimiento
      let nextDueDate = null;
      let nextDueMileage = null;
      let nextDueHours = null;

      if (taskDef.interval_type === 'mileage') {
        nextDueMileage = (data.mileage || 0) + taskDef.interval_value;
      } else if (taskDef.interval_type === 'miles') {
        nextDueMileage = (data.mileage || 0) + taskDef.interval_value;
      } else if (taskDef.interval_type === 'hours') {
        nextDueHours = (data.hours || 0) + taskDef.interval_value;
      } else if (taskDef.interval_type === 'months') {
        const date = new Date(data.date);
        date.setMonth(date.getMonth() + taskDef.interval_value);
        nextDueDate = date.toISOString().split('T')[0];
      } else if (taskDef.interval_type === 'years') {
        const date = new Date(data.date);
        date.setFullYear(date.getFullYear() + taskDef.interval_value);
        nextDueDate = date.toISOString().split('T')[0];
      } else if (taskDef.interval_type === 'days') {
        const date = new Date(data.date);
        date.setDate(date.getDate() + taskDef.interval_value);
        nextDueDate = date.toISOString().split('T')[0];
      }

      return await base44.entities.VehicleMaintenanceSchedule.update(scheduleId, {
        last_completed_date: data.date,
        last_completed_mileage: data.mileage,
        last_completed_hours: data.hours,
        next_due_date: nextDueDate,
        next_due_mileage: nextDueMileage,
        next_due_hours: nextDueHours,
        status: 'on_track',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicleMaintenanceSchedules']);
      setRecordDialogOpen(false);
      setSelectedSchedule(null);
      setRecordForm({
        date: new Date().toISOString().split('T')[0],
        mileage: currentMileage || 0,
        hours: currentHours || 0,
      });
    },
  });

  const handleRecordClick = (schedule) => {
    setSelectedSchedule(schedule);
    setRecordForm({
      date: new Date().toISOString().split('T')[0],
      mileage: currentMileage || 0,
      hours: currentHours || 0,
    });
    setRecordDialogOpen(true);
  };

  const handleRecordSubmit = (e) => {
    e.preventDefault();
    recordMaintenanceMutation.mutate({
      scheduleId: selectedSchedule.id,
      data: recordForm,
    });
  };

  const getStatusInfo = (schedule, taskDef) => {
    // Calcular estado basado en el intervalo
    if (taskDef.interval_type === 'mileage' || taskDef.interval_type === 'miles') {
      if (!schedule.next_due_mileage) return { status: 'on_track', color: 'bg-zinc-600', text: 'Sin programar' };
      const remaining = schedule.next_due_mileage - (currentMileage || 0);
      const warningThreshold = taskDef.warning_interval_value || (taskDef.interval_value * 0.1);
      
      if (remaining <= 0) return { status: 'overdue', color: 'bg-red-500', text: 'Vencido' };
      if (remaining <= warningThreshold) return { status: 'due_soon', color: 'bg-yellow-500', text: 'Próximo' };
      return { status: 'on_track', color: 'bg-green-500', text: 'Al día' };
    } else if (taskDef.interval_type === 'hours') {
      if (!schedule.next_due_hours) return { status: 'on_track', color: 'bg-zinc-600', text: 'Sin programar' };
      const remaining = schedule.next_due_hours - (currentHours || 0);
      const warningThreshold = taskDef.warning_interval_value || (taskDef.interval_value * 0.1);
      
      if (remaining <= 0) return { status: 'overdue', color: 'bg-red-500', text: 'Vencido' };
      if (remaining <= warningThreshold) return { status: 'due_soon', color: 'bg-yellow-500', text: 'Próximo' };
      return { status: 'on_track', color: 'bg-green-500', text: 'Al día' };
    } else if (taskDef.interval_type === 'months' || taskDef.interval_type === 'years' || taskDef.interval_type === 'days') {
      if (!schedule.next_due_date) return { status: 'on_track', color: 'bg-zinc-600', text: 'Sin programar' };
      const today = new Date();
      const dueDate = new Date(schedule.next_due_date);
      const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
      const warningDays = taskDef.warning_interval_type === 'days' ? taskDef.warning_interval_value : 7;
      
      if (diffDays < 0) return { status: 'overdue', color: 'bg-red-500', text: 'Vencido' };
      if (diffDays <= warningDays) return { status: 'due_soon', color: 'bg-yellow-500', text: 'Próximo' };
      return { status: 'on_track', color: 'bg-green-500', text: 'Al día' };
    }
    
    return { status: 'on_track', color: 'bg-zinc-600', text: 'Sin estado' };
  };

  const selectedTaskDef = selectedSchedule 
    ? taskDefinitions.find(t => t.id === selectedSchedule.maintenance_task_definition_id)
    : null;

  if (!vehicleId) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">Guarde el vehículo para gestionar programas de mantenimiento.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto" />
        <p className="text-zinc-500">No hay programas de mantenimiento asignados a este vehículo.</p>
        <p className="text-sm text-zinc-600">
          Los programas se asignan desde la sección "Programas de Mantenimiento" en el menú principal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => {
        const taskDef = taskDefinitions.find(t => t.id === schedule.maintenance_task_definition_id);
        if (!taskDef) return null;
        
        const statusInfo = getStatusInfo(schedule, taskDef);
        const IntervalIcon = intervalTypeLabels[taskDef.interval_type]?.icon || Calendar;

        return (
          <div
            key={schedule.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <IntervalIcon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{taskDef.name}</h4>
                      <Badge className={cn("text-xs", statusInfo.color, "text-white border-0")}>
                        {statusInfo.text}
                      </Badge>
                    </div>
                    {taskDef.description && (
                      <p className="text-sm text-zinc-400">{taskDef.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500 mb-1">Intervalo</p>
                    <p className="text-white font-medium">
                      Cada {taskDef.interval_value} {intervalTypeLabels[taskDef.interval_type]?.label || taskDef.interval_type}
                    </p>
                  </div>
                  
                  {schedule.last_completed_date && (
                    <div>
                      <p className="text-zinc-500 mb-1">Último Servicio</p>
                      <p className="text-white font-medium">
                        {new Date(schedule.last_completed_date).toLocaleDateString('es-AR')}
                      </p>
                      {schedule.last_completed_mileage > 0 && (
                        <p className="text-zinc-400 text-xs">{schedule.last_completed_mileage.toLocaleString()} km</p>
                      )}
                      {schedule.last_completed_hours > 0 && (
                        <p className="text-zinc-400 text-xs">{schedule.last_completed_hours.toLocaleString()} hs</p>
                      )}
                    </div>
                  )}

                  {(schedule.next_due_date || schedule.next_due_mileage || schedule.next_due_hours) && (
                    <div>
                      <p className="text-zinc-500 mb-1">Próximo Vencimiento</p>
                      {schedule.next_due_date && (
                        <p className="text-white font-medium">
                          {new Date(schedule.next_due_date).toLocaleDateString('es-AR')}
                        </p>
                      )}
                      {schedule.next_due_mileage > 0 && (
                        <p className="text-white font-medium">{schedule.next_due_mileage.toLocaleString()} km</p>
                      )}
                      {schedule.next_due_hours > 0 && (
                        <p className="text-white font-medium">{schedule.next_due_hours.toLocaleString()} hs</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleRecordClick(schedule)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shrink-0"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Registrar
              </Button>
            </div>
          </div>
        );
      })}

      {/* Dialog para registrar mantenimiento */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Registrar Mantenimiento Completado</DialogTitle>
          </DialogHeader>
          {selectedTaskDef && (
            <form onSubmit={handleRecordSubmit} className="space-y-4">
              <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                <p className="text-sm text-zinc-400 mb-1">Programa</p>
                <p className="font-semibold text-white">{selectedTaskDef.name}</p>
              </div>

              <div className="space-y-2">
                <Label>Fecha de Realización *</Label>
                <Input
                  type="date"
                  value={recordForm.date}
                  onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                  className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kilómetros</Label>
                  <Input
                    type="number"
                    value={recordForm.mileage}
                    onChange={(e) => setRecordForm({ ...recordForm, mileage: parseInt(e.target.value) || 0 })}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horas</Label>
                  <Input
                    type="number"
                    value={recordForm.hours}
                    onChange={(e) => setRecordForm({ ...recordForm, hours: parseInt(e.target.value) || 0 })}
                    className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRecordDialogOpen(false)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={recordMaintenanceMutation.isPending}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  {recordMaintenanceMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}