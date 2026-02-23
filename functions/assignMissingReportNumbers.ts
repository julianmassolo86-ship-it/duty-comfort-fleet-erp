import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener todas las inspecciones AC sin número de reporte
    const maintenances = await base44.asServiceRole.entities.AirConditioningMaintenance.filter({
      report_number: null
    });

    if (maintenances.length === 0) {
      return Response.json({ message: 'No hay inspecciones sin número de reporte', assigned: 0 });
    }

    // Asignar números a cada una
    const assigned = [];
    for (const maintenance of maintenances) {
      // Obtener el próximo número
      const response = await base44.asServiceRole.functions.invoke('getNextReportNumber', {
        report_type: 'ac_maintenance'
      });
      const report_number = response.data?.report_number || `AC-000177`;

      // Actualizar la inspección con el número
      await base44.asServiceRole.entities.AirConditioningMaintenance.update(
        maintenance.id,
        { report_number: report_number }
      );

      assigned.push({
        id: maintenance.id,
        report_number: report_number
      });
    }

    return Response.json({
      message: `${assigned.length} inspecciones actualizadas`,
      assigned
    });
  } catch (error) {
    console.error('Error asignando números de reporte:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});