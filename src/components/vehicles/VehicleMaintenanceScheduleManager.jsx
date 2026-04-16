import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Gauge, Clock, Calendar, CheckCircle2, AlertCircle, Loader2, Printer, GitMerge } from "lucide-react";
import { cn } from "@/lib/utils";

// Resuelve recursivamente toda la cadena hacia abajo (incluyendo al programa dado y sus parent_program_id anidados)
function resolveChainDown(programId, allDefs, visited = new Set()) {
  if (!programId || visited.has(programId)) return [];
  visited.add(programId);
  const def = allDefs.find(d => d.id === programId);
  if (!def) return [];
  const chain = [def];
  if (def.parent_program_id) {
    chain.push(...resolveChainDown(def.parent_program_id, allDefs, visited));
  }
  return chain;
}

// Resuelve nivel jerárquico: cuántos ancestros tiene (nivel 1 = sin parent, nivel 2 = tiene parent, etc.)
function resolveLevel(programId, allDefs, visited = new Set()) {
  if (!programId || visited.has(programId)) return 1;
  visited.add(programId);
  const def = allDefs.find(d => d.id === programId);
  if (!def || !def.parent_program_id) return 1;
  return 1 + resolveLevel(def.parent_program_id, allDefs, visited);
}

// Calcula urgencia numérica para ordenar cuál es "más próximo"
function getUrgencyScore(schedule, taskDef, currentMileage, currentHours) {
  let minScore = Infinity;
  if (taskDef.interval_mileage && schedule.next_due_mileage) {
    const remaining = schedule.next_due_mileage - (currentMileage || 0);
    const pct = remaining / taskDef.interval_mileage;
    minScore = Math.min(minScore, pct);
  }
  if (taskDef.interval_hours && schedule.next_due_hours) {
    const remaining = schedule.next_due_hours - (currentHours || 0);
    const pct = remaining / taskDef.interval_hours;
    minScore = Math.min(minScore, pct);
  }
  if (taskDef.interval_months && schedule.next_due_date) {
    const today = new Date();
    const due = new Date(schedule.next_due_date);
    const diffDays = (due - today) / (1000 * 60 * 60 * 24);
    const intervalDays = taskDef.interval_months * 30;
    const pct = diffDays / intervalDays;
    minScore = Math.min(minScore, pct);
  }
  return minScore;
}

export default function VehicleMaintenanceScheduleManager({ vehicleId, vehicle, currentMileage, currentHours }) {
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [printingScheduleId, setPrintingScheduleId] = useState(null);
  const [recordForm, setRecordForm] = useState({
    date: new Date().toISOString().split('T')[0],
    mileage: currentMileage || 0,
    hours: currentHours || 0,
  });
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['vehicleMaintenanceSchedules', vehicleId],
    queryFn: () => base44.entities.VehicleMaintenanceSchedule.filter({ vehicle_id: vehicleId }),
    enabled: !!vehicleId,
  });

  const { data: taskDefinitions = [] } = useQuery({
    queryKey: ['maintenanceTaskDefinitions'],
    queryFn: () => base44.entities.MaintenanceTaskDefinition.list(),
  });

  // Función que actualiza un schedule dado un taskDef y datos del form
  const updateSchedule = async (scheduleId, taskDef, data) => {
    const updateData = {
      last_completed_date: data.date,
      last_completed_mileage: data.mileage,
      last_completed_hours: data.hours,
      status: 'on_track',
      next_due_mileage: null,
      next_due_hours: null,
      next_due_date: null,
    };
    if (taskDef.interval_mileage) updateData.next_due_mileage = (data.mileage || 0) + taskDef.interval_mileage;
    if (taskDef.interval_hours) updateData.next_due_hours = (data.hours || 0) + taskDef.interval_hours;
    if (taskDef.interval_months) {
      const date = new Date(data.date);
      date.setMonth(date.getMonth() + taskDef.interval_months);
      updateData.next_due_date = date.toISOString().split('T')[0];
    }
    return base44.entities.VehicleMaintenanceSchedule.update(scheduleId, updateData);
  };

  const recordMaintenanceMutation = useMutation({
    mutationFn: async ({ scheduleId, data }) => {
      const schedule = schedules.find(s => s.id === scheduleId);
      const taskDef = taskDefinitions.find(t => t.id === schedule.maintenance_task_definition_id);

      // Resolver toda la cadena de programas que este incluye
      const chain = resolveChainDown(taskDef.id, taskDefinitions);

      // Para cada programa en la cadena, actualizar su VehicleMaintenanceSchedule
      const chainScheduleUpdates = [];
      for (const chainDef of chain) {
        const chainSchedule = schedules.find(s => s.maintenance_task_definition_id === chainDef.id);
        if (chainSchedule) {
          chainScheduleUpdates.push(updateSchedule(chainSchedule.id, chainDef, data));
        }
      }
      await Promise.all(chainScheduleUpdates);

      // Unificar repuestos de toda la cadena
      const allParts = chain.flatMap(d => (d.required_spare_parts || []).map(p => p.spare_part_name || p.spare_part_id).filter(Boolean));
      const partsDescription = allParts.length > 0 ? `\nRepuestos: ${[...new Set(allParts)].join(', ')}` : '';

      const chainNames = chain.map(d => d.name).join(' + ');
      const description = chain.length > 1
        ? `${taskDef.name} (incluye ${chain.slice(1).map(d => d.name).join(', ')})${partsDescription}`
        : `${taskDef.name}${partsDescription}`;

      // Crear registro en Maintenance
      const companyId = schedule.company_id || vehicle?.company_id;
      await base44.entities.Maintenance.create({
        vehicle_id: vehicleId,
        company_id: companyId,
        type: 'preventive',
        status: 'completed',
        description,
        completed_date: data.date,
        mileage_at_service: data.mileage || null,
        hours_at_service: data.hours || null,
        notes: chain.length > 1 ? `Programas ejecutados: ${chainNames}` : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenanceSchedules', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenanceSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      setRecordDialogOpen(false);
      setSelectedSchedule(null);
      setRecordForm({
        date: new Date().toISOString().split('T')[0],
        mileage: currentMileage || 0,
        hours: currentHours || 0,
      });
    },
  });

  const handlePrintPdf = async (schedule) => {
    setPrintingScheduleId(schedule.id);
    try {
      const response = await base44.functions.invoke(
        'generateMaintenanceOrderPdf',
        { vehicle_id: vehicleId, schedule_id: schedule.id },
        { responseType: 'arraybuffer' }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Intente nuevamente.');
    } finally {
      setPrintingScheduleId(null);
    }
  };

  const handleRecordClick = (schedule) => {
    setSelectedSchedule(schedule);
    setRecordForm({
      date: new Date().toISOString().split('T')[0],
      mileage: currentMileage || 0,
      hours: currentHours || 0,
    });
    setRecordDialogOpen(true);
  };

  const getStatusInfo = (schedule, taskDef) => {
    const km = currentMileage || 0;
    const hs = currentHours || 0;
    const today = new Date();

    let status = 'on_track';

    if (taskDef.interval_mileage && schedule.next_due_mileage) {
      const remaining = schedule.next_due_mileage - km;
      const warning = taskDef.warning_mileage || (taskDef.interval_mileage * 0.05);
      if (remaining <= 0) return { status: 'overdue', color: 'bg-red-500', text: 'Vencido', detail: `${Math.abs(remaining).toLocaleString()} km pasados` };
      if (remaining <= warning) { status = 'due_soon'; }
      if (status === 'due_soon') return { status, color: 'bg-yellow-500', text: 'Próximo', detail: `Faltan ${remaining.toLocaleString()} km` };
    }

    if (taskDef.interval_hours && schedule.next_due_hours) {
      const remaining = schedule.next_due_hours - hs;
      const warning = taskDef.warning_hours || (taskDef.interval_hours * 0.05);
      if (remaining <= 0) return { status: 'overdue', color: 'bg-red-500', text: 'Vencido', detail: `${Math.abs(remaining).toLocaleString()} hs pasadas` };
      if (remaining <= warning) return { status: 'due_soon', color: 'bg-yellow-500', text: 'Próximo', detail: `Faltan ${remaining.toLocaleString()} hs` };
    }

    if (taskDef.interval_months && schedule.next_due_date) {
      const dueDate = new Date(schedule.next_due_date);
      const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
      const warningDays = taskDef.warning_days || 7;
      if (diffDays < 0) return { status: 'overdue', color: 'bg-red-500', text: 'Vencido', detail: `Vencido hace ${Math.abs(diffDays)} días` };
      if (diffDays <= warningDays) return { status: 'due_soon', color: 'bg-yellow-500', text: 'Próximo', detail: diffDays === 0 ? 'Vence hoy' : `Vence en ${diffDays} días` };
    }

    if (!schedule.next_due_mileage && !schedule.next_due_hours && !schedule.next_due_date) {
      return { status: 'unscheduled', color: 'bg-zinc-600', text: 'Sin programar', detail: 'Marcar como realizado para activar' };
    }

    return { status: 'on_track', color: 'bg-green-500', text: 'Al día', detail: '' };
  };

  // Mostrar todos los programas asignados al vehículo
  const getVisibleSchedules = () => {
    return schedules
      .filter(s => {
        const def = taskDefinitions.find(t => t.id === s.maintenance_task_definition_id);
        return def?.task_type === 'program';
      })
      .map(s => {
        const def = taskDefinitions.find(t => t.id === s.maintenance_task_definition_id);
        const level = resolveLevel(def?.id, taskDefinitions);
        return { schedule: s, def, level };
      });
  };

  const visibleSchedules = getVisibleSchedules();

  const selectedTaskDef = selectedSchedule
    ? taskDefinitions.find(t => t.id === selectedSchedule.maintenance_task_definition_id)
    : null;

  const selectedChain = selectedTaskDef
    ? resolveChainDown(selectedTaskDef.id, taskDefinitions)
    : [];

  if (!vehicleId) {
    return <div className="p-8 text-center"><p className="text-zinc-500">Guarde el vehículo para gestionar programas de mantenimiento.</p></div>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-yellow-400" /></div>;
  }

  if (schedules.length === 0) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto" />
        <p className="text-zinc-500">No hay programas de mantenimiento asignados a este vehículo.</p>
        <p className="text-sm text-zinc-600">Los programas se asignan desde la sección "Programas de Mantenimiento".</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleSchedules.map(({ schedule, def: taskDef, level }) => {
        if (!taskDef) return null;
        const statusInfo = getStatusInfo(schedule, taskDef);
        const chain = resolveChainDown(taskDef.id, taskDefinitions);
        const includedPrograms = chain.slice(1); // todos excepto el primero (el propio)

        return (
          <div key={schedule.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    {taskDef.interval_mileage ? <Gauge className="w-5 h-5 text-yellow-400" /> :
                     taskDef.interval_hours ? <Clock className="w-5 h-5 text-yellow-400" /> :
                     <Calendar className="w-5 h-5 text-yellow-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-white">{taskDef.name}</h4>
                      {level > 1 && (
                        <Badge className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Nivel {level}
                        </Badge>
                      )}
                      <Badge className={cn("text-xs text-white border-0", statusInfo.color)}>
                        {statusInfo.text}
                      </Badge>
                    </div>
                    {statusInfo.detail && (
                      <p className={cn("text-xs font-medium", statusInfo.status === 'overdue' ? 'text-red-400' : statusInfo.status === 'due_soon' ? 'text-yellow-400' : 'text-zinc-400')}>
                        {statusInfo.detail}
                      </p>
                    )}
                    {/* Programas incluidos en cascada */}
                    {includedPrograms.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <GitMerge className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="text-xs text-blue-400">Incluye:</span>
                        {includedPrograms.map(p => (
                          <Badge key={p.id} className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 py-0">
                            {p.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {taskDef.description && <p className="text-sm text-zinc-400 mt-1">{taskDef.description}</p>}
                  </div>
                </div>

                {/* Intervalos definidos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {taskDef.interval_mileage && (
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">Intervalo Km</p>
                      <p className="text-white font-medium">Cada {taskDef.interval_mileage.toLocaleString()} km</p>
                      {schedule.next_due_mileage > 0 && (
                        <p className="text-zinc-400 text-xs">Próximo: {schedule.next_due_mileage.toLocaleString()} km</p>
                      )}
                    </div>
                  )}
                  {taskDef.interval_hours && (
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">Intervalo Horas</p>
                      <p className="text-white font-medium">Cada {taskDef.interval_hours.toLocaleString()} hs</p>
                      {schedule.next_due_hours > 0 && (
                        <p className="text-zinc-400 text-xs">Próximo: {schedule.next_due_hours.toLocaleString()} hs</p>
                      )}
                    </div>
                  )}
                  {taskDef.interval_months && (
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">Intervalo Tiempo</p>
                      <p className="text-white font-medium">Cada {taskDef.interval_months} meses</p>
                      {schedule.next_due_date && (
                        <p className="text-zinc-400 text-xs">Próximo: {new Date(schedule.next_due_date).toLocaleDateString('es-AR')}</p>
                      )}
                    </div>
                  )}
                  {schedule.last_completed_date && (
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">Último Servicio</p>
                      <p className="text-white font-medium">{new Date(schedule.last_completed_date).toLocaleDateString('es-AR')}</p>
                      {schedule.last_completed_mileage > 0 && <p className="text-zinc-400 text-xs">{schedule.last_completed_mileage.toLocaleString()} km</p>}
                      {schedule.last_completed_hours > 0 && <p className="text-zinc-400 text-xs">{schedule.last_completed_hours.toLocaleString()} hs</p>}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRecordClick(schedule); }}
                  type="button"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Realizado
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePrintPdf(schedule); }}
                  type="button"
                  disabled={printingScheduleId === schedule.id}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  {printingScheduleId === schedule.id
                    ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    : <Printer className="w-4 h-4 mr-1" />}
                  {printingScheduleId === schedule.id ? 'Generando...' : 'Imprimir'}
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Dialog para registrar mantenimiento completado */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Marcar como Realizado</DialogTitle>
          </DialogHeader>
          {selectedTaskDef && (
            <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); recordMaintenanceMutation.mutate({ scheduleId: selectedSchedule.id, data: recordForm }); }} className="space-y-4">
              <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 space-y-1">
                <p className="text-xs text-zinc-400 mb-1">Programa</p>
                <p className="font-semibold text-white">{selectedTaskDef.name}</p>
                {selectedTaskDef.interval_mileage && <p className="text-xs text-zinc-400">Intervalo: cada {selectedTaskDef.interval_mileage.toLocaleString()} km</p>}
                {selectedTaskDef.interval_hours && <p className="text-xs text-zinc-400">Intervalo: cada {selectedTaskDef.interval_hours.toLocaleString()} hs</p>}
                {selectedTaskDef.interval_months && <p className="text-xs text-zinc-400">Intervalo: cada {selectedTaskDef.interval_months} meses</p>}
                {/* Mostrar programas incluidos en la cadena */}
                {selectedChain.length > 1 && (
                  <div className="mt-2 pt-2 border-t border-zinc-800">
                    <p className="text-xs text-blue-400 font-medium flex items-center gap-1">
                      <GitMerge className="w-3 h-3" />
                      También se actualizará:
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedChain.slice(1).map(p => (
                        <Badge key={p.id} className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {p.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-zinc-400">
                Al guardar, los contadores se reiniciarán desde estos valores y se calculará automáticamente el próximo vencimiento.
              </p>

              <div className="space-y-2">
                <Label>Fecha de Realización *</Label>
                <Input type="date" value={recordForm.date} onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })} className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kilómetros actuales</Label>
                  <Input type="number" value={recordForm.mileage} onChange={(e) => setRecordForm({ ...recordForm, mileage: parseInt(e.target.value) || 0 })} className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50" />
                </div>
                <div className="space-y-2">
                  <Label>Horas actuales</Label>
                  <Input type="number" value={recordForm.hours} onChange={(e) => setRecordForm({ ...recordForm, hours: parseInt(e.target.value) || 0 })} className="bg-zinc-900 border-zinc-700 focus:border-yellow-500/50" />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRecordDialogOpen(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancelar</Button>
                <Button type="submit" disabled={recordMaintenanceMutation.isPending} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                  {recordMaintenanceMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}