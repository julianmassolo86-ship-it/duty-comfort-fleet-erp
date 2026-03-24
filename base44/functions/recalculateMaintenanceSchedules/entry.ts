import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Recalcula los estados de los programas de mantenimiento de un vehículo
// cuando se actualiza su kilometraje u horas.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { vehicle_id } = await req.json();

    if (!vehicle_id) {
      return Response.json({ error: 'vehicle_id requerido' }, { status: 400 });
    }

    const vehicle = await base44.asServiceRole.entities.Vehicle.get(vehicle_id);
    if (!vehicle) {
      return Response.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    const schedules = await base44.asServiceRole.entities.VehicleMaintenanceSchedule.filter({ vehicle_id });
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
        const warning = taskDef.warning_mileage || (taskDef.interval_mileage * 0.05);
        if (remaining <= 0) newStatus = 'overdue';
        else if (remaining <= warning) newStatus = 'due_soon';
      }

      // --- Por horas (toma el estado más grave) ---
      if (taskDef.interval_hours && schedule.next_due_hours && newStatus !== 'overdue') {
        const remaining = schedule.next_due_hours - currentHours;
        const warning = taskDef.warning_hours || (taskDef.interval_hours * 0.05);
        if (remaining <= 0) newStatus = 'overdue';
        else if (remaining <= warning && newStatus === 'on_track') newStatus = 'due_soon';
      }

      // --- Por fecha ---
      if (taskDef.interval_months && schedule.next_due_date && newStatus !== 'overdue') {
        const dueDate = new Date(schedule.next_due_date);
        const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
        const warningDays = taskDef.warning_days || 7;
        if (diffDays < 0) newStatus = 'overdue';
        else if (diffDays <= warningDays && newStatus === 'on_track') newStatus = 'due_soon';
      }

      // Solo actualizar si cambió el status
      if (schedule.status !== newStatus) {
        await base44.asServiceRole.entities.VehicleMaintenanceSchedule.update(schedule.id, { status: newStatus });
        updated.push({ id: schedule.id, newStatus });
      }
    }

    return Response.json({ updated: updated.length, details: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});