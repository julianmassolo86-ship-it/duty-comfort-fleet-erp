import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Recalcula los estados de los programas de mantenimiento de un vehículo.
// Se invoca tanto desde la automatización entity (cuando se actualiza un vehículo)
// como manualmente desde el frontend.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Soporte para llamada desde automatización entity: { event: { entity_id }, data: {...} }
    // o desde frontend: { vehicle_id: "..." }
    const vehicle_id = body.vehicle_id || body.event?.entity_id;

    if (!vehicle_id) {
      return Response.json({ error: 'vehicle_id requerido' }, { status: 400 });
    }

    // Obtener el vehículo (puede venir en body.data desde la automatización)
    const vehicle = body.data || await base44.asServiceRole.entities.Vehicle.get(vehicle_id);
    if (!vehicle) {
      return Response.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    const schedules = await base44.asServiceRole.entities.VehicleMaintenanceSchedule.filter({ vehicle_id });
    if (schedules.length === 0) {
      return Response.json({ updated: 0, message: 'Sin programas asignados' });
    }

    const taskDefs = await base44.asServiceRole.entities.MaintenanceTaskDefinition.list();
    const today = new Date();
    const updated = [];

    for (const schedule of schedules) {
      const taskDef = taskDefs.find(t => t.id === schedule.maintenance_task_definition_id);
      if (!taskDef) continue;

      const currentMileage = vehicle.mileage || 0;
      const currentHours = vehicle.hours || 0;

      let newStatus = 'on_track';

      // --- Por kilometraje ---
      if (taskDef.interval_mileage && schedule.next_due_mileage) {
        const remaining = schedule.next_due_mileage - currentMileage;
        const warning = taskDef.warning_mileage || Math.floor(taskDef.interval_mileage * 0.05);
        if (remaining <= 0) {
          newStatus = 'overdue';
        } else if (remaining <= warning) {
          newStatus = 'due_soon';
        }
      }

      // --- Por horas (toma el estado más grave) ---
      if (taskDef.interval_hours && schedule.next_due_hours && newStatus !== 'overdue') {
        const remaining = schedule.next_due_hours - currentHours;
        const warning = taskDef.warning_hours || Math.max(50, Math.floor(taskDef.interval_hours * 0.10));
        if (remaining <= 0) {
          newStatus = 'overdue';
        } else if (remaining <= warning && newStatus === 'on_track') {
          newStatus = 'due_soon';
        }
      }

      // --- Por fecha ---
      if (taskDef.interval_months && schedule.next_due_date && newStatus !== 'overdue') {
        const dueDate = new Date(schedule.next_due_date);
        const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
        const warningDays = taskDef.warning_days || 7;
        if (diffDays < 0) {
          newStatus = 'overdue';
        } else if (diffDays <= warningDays && newStatus === 'on_track') {
          newStatus = 'due_soon';
        }
      }

      // Solo actualizar si cambió el status
      if (schedule.status !== newStatus) {
        await base44.asServiceRole.entities.VehicleMaintenanceSchedule.update(schedule.id, { status: newStatus });
        updated.push({ schedule_id: schedule.id, task: taskDef.name, from: schedule.status, to: newStatus });
      }
    }

    return Response.json({ vehicle_id, updated: updated.length, details: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});