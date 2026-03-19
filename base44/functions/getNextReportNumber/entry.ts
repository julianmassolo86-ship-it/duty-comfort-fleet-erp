import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_type } = await req.json();

    if (!report_type || !['ac_maintenance', 'novedad', 'maintenance'].includes(report_type)) {
      return Response.json({ error: 'Invalid report_type' }, { status: 400 });
    }

    const company_id = user.company_id || 'global';

    // Buscar el contador existente
    const counters = await base44.asServiceRole.entities.ReportCounter.filter({
      report_type,
      company_id
    });

    let counter;
    let nextNumber;

    if (counters.length === 0) {
      // Crear nuevo contador
      nextNumber = 1;
      counter = await base44.asServiceRole.entities.ReportCounter.create({
        report_type,
        company_id,
        last_number: nextNumber
      });
    } else {
      // Incrementar contador existente
      counter = counters[0];
      nextNumber = (counter.last_number || 0) + 1;
      await base44.asServiceRole.entities.ReportCounter.update(counter.id, {
        last_number: nextNumber
      });
    }

    // Formatear el número con prefijo según el tipo
    const prefix = {
      'ac_maintenance': 'AC',
      'novedad': 'NOV',
      'maintenance': 'MNT'
    }[report_type];

    const report_number = `${prefix}-${String(nextNumber).padStart(6, '0')}`;

    return Response.json({ report_number, next_number: nextNumber });
  } catch (error) {
    console.error('Error generating report number:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});