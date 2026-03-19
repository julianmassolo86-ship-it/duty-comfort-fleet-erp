import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const results = {
      ac_maintenance: { updated: 0, skipped: 0 },
      novedad: { updated: 0, skipped: 0 },
      maintenance: { updated: 0, skipped: 0 }
    };

    // Procesar cada tipo de informe
    const reportTypes = [
      { type: 'ac_maintenance', entity: 'AirConditioningMaintenance', prefix: 'AC' },
      { type: 'novedad', entity: 'Novedad', prefix: 'NOV' },
      { type: 'maintenance', entity: 'Maintenance', prefix: 'MNT' }
    ];

    for (const reportType of reportTypes) {
      // Obtener todos los registros de este tipo
      const allRecords = await base44.asServiceRole.entities[reportType.entity].list('-created_date');
      
      // Filtrar los que no tienen report_number
      const recordsWithoutNumber = allRecords.filter(record => !record.report_number);
      
      if (recordsWithoutNumber.length === 0) {
        continue;
      }

      // Obtener el company_id del usuario o usar 'global'
      const company_id = user.company_id || 'global';

      // Buscar o crear el contador
      let counters = await base44.asServiceRole.entities.ReportCounter.filter({
        report_type: reportType.type,
        company_id
      });

      let currentNumber = 0;
      let counterId = null;

      if (counters.length > 0) {
        currentNumber = counters[0].last_number || 0;
        counterId = counters[0].id;
      }

      // Asignar números a los registros existentes
      for (const record of recordsWithoutNumber) {
        currentNumber++;
        const report_number = `${reportType.prefix}-${String(currentNumber).padStart(6, '0')}`;
        
        try {
          await base44.asServiceRole.entities[reportType.entity].update(record.id, {
            report_number
          });
          results[reportType.type].updated++;
        } catch (error) {
          console.error(`Error updating ${reportType.entity} ${record.id}:`, error);
          results[reportType.type].skipped++;
        }
      }

      // Actualizar o crear el contador
      if (counterId) {
        await base44.asServiceRole.entities.ReportCounter.update(counterId, {
          last_number: currentNumber
        });
      } else {
        await base44.asServiceRole.entities.ReportCounter.create({
          report_type: reportType.type,
          company_id,
          last_number: currentNumber
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Report numbers assigned successfully',
      results
    });
  } catch (error) {
    console.error('Error assigning report numbers:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});