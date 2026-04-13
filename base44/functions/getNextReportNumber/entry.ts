import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Configuración de tipos con prefijo numérico y código
const REPORT_TYPE_CONFIG = {
  'ac_maintenance': { prefix: '0001', label: 'AC' },
  'novedad':        { prefix: '0002', label: 'NOV' },
  'maintenance':    { prefix: '0003', label: 'MNT' },
  'pre_trip':       { prefix: '0004', label: 'PRE' },
  'post_trip':      { prefix: '0005', label: 'POST' },
  'fuel_up':        { prefix: '0006', label: 'COMB' },
  'corrective':     { prefix: '0007', label: 'CORR' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_type, company_id: bodyCompanyId } = await req.json();

    if (!report_type || !REPORT_TYPE_CONFIG[report_type]) {
      return Response.json({ error: 'Invalid report_type' }, { status: 400 });
    }

    const company_id = bodyCompanyId || user.company_id || 'global';
    const config = REPORT_TYPE_CONFIG[report_type];

    // Buscar el contador existente
    const counters = await base44.asServiceRole.entities.ReportCounter.filter({
      report_type,
      company_id
    });

    let nextNumber;

    if (counters.length === 0) {
      nextNumber = 1;
      await base44.asServiceRole.entities.ReportCounter.create({
        report_type,
        company_id,
        last_number: nextNumber
      });
    } else {
      const counter = counters[0];
      nextNumber = (counter.last_number || 0) + 1;
      await base44.asServiceRole.entities.ReportCounter.update(counter.id, {
        last_number: nextNumber
      });
    }

    const report_number = `${config.prefix}-${String(nextNumber).padStart(6, '0')}`;

    return Response.json({ report_number, next_number: nextNumber });
  } catch (error) {
    console.error('Error generating report number:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});