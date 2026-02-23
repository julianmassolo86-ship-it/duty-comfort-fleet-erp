import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { maintenance_id, report_number } = await req.json();

    if (!maintenance_id || !report_number) {
      return Response.json({ error: 'Se requiere maintenance_id y report_number' }, { status: 400 });
    }

    // Actualizar la inspección con el número asignado
    await base44.asServiceRole.entities.AirConditioningMaintenance.update(
      maintenance_id,
      { report_number }
    );

    return Response.json({
      message: 'Número de reporte asignado',
      maintenance_id,
      report_number
    });
  } catch (error) {
    console.error('Error asignando número:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});