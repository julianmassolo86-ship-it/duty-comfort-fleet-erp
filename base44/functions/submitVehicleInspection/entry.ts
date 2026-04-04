import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Genera el siguiente número correlativo internamente
async function getNextNumber(base44, report_type, company_id) {
    const counters = await base44.asServiceRole.entities.ReportCounter.filter({ report_type, company_id });
    let nextNumber;
    if (counters.length === 0) {
        nextNumber = 1;
        await base44.asServiceRole.entities.ReportCounter.create({ report_type, company_id, last_number: nextNumber });
    } else {
        const counter = counters[0];
        nextNumber = (counter.last_number || 0) + 1;
        await base44.asServiceRole.entities.ReportCounter.update(counter.id, { last_number: nextNumber });
    }
    return nextNumber;
}

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { vehicle_id, company_id, location_id, type, inspection_date, mileage, miles, hours, checklist, novedades_descripcion, notes } = body;

    // Usar la fecha enviada por el formulario (solo fecha) + hora actual del servidor
    const dateStr = inspection_date || new Date().toISOString().split('T')[0];
    const timeStr = new Date().toISOString().split('T')[1];
    const finalInspectionDate = `${dateStr}T${timeStr}`;

    // Generar número correlativo según tipo
    const report_type = type === 'pre_trip' ? 'pre_trip' : 'post_trip';
    const prefix = type === 'pre_trip' ? '0004' : '0005';
    const companyKey = company_id || 'global';
    const nextNumber = await getNextNumber(base44, report_type, companyKey);
    const report_number = `${prefix}-${String(nextNumber).padStart(6, '0')}`;

    // Crear la inspección
    const inspectionData = {
        report_number,
        vehicle_id,
        company_id,
        location_id,
        inspector_name: user.full_name || user.email,
        type,
        inspection_date: finalInspectionDate,
        mileage: mileage || null,
        miles: miles || null,
        hours: hours || null,
        checklist: checklist || {},
        novedades_descripcion: novedades_descripcion || null,
        notes: notes || null,
        status: 'completed'
    };

    // Verificar si hay items "mal" en el checklist o hay descripción de novedades
    const hasIssues = novedades_descripcion ||
        (checklist && Object.values(checklist).some(v => v === 'mal'));

    let novedad_id = null;

    if (hasIssues) {
        inspectionData.status = 'with_issues';

        // Obtener datos del vehículo para contexto
        const vehicles = await base44.asServiceRole.entities.Vehicle.filter({ id: vehicle_id });
        const vehicle = vehicles[0];

        // Armar descripción automática de la novedad
        const itemsMal = checklist
            ? Object.entries(checklist)
                .filter(([, v]) => v === 'mal')
                .map(([k]) => k.replace(/_/g, ' '))
            : [];

        let descripcion = `[Inspección ${type === 'pre_trip' ? 'Salida' : 'Entrada'}] `;
        if (itemsMal.length > 0) {
            descripcion += `Items con problemas: ${itemsMal.join(', ')}. `;
        }
        if (novedades_descripcion) {
            descripcion += novedades_descripcion;
        }

        // Crear la novedad automáticamente
        const novedad = await base44.asServiceRole.entities.Novedad.create({
            vehicle_id,
            company_id,
            location_id: location_id || null,
            descripcion,
            fecha_reporte: new Date().toISOString().split('T')[0],
            estado: 'pendiente',
            prioridad: 'media',
            kilometraje_reportado: mileage || null,
            horas_reportadas: hours || null
        });

        novedad_id = novedad.id;
        inspectionData.novedad_id = novedad_id;
    }

    // Guardar la inspección
    const inspection = await base44.asServiceRole.entities.VehicleInspection.create(inspectionData);

    // Actualizar telemetría del vehículo
    if (mileage || miles || hours) {
        const updateData = {};
        if (mileage) updateData.mileage = mileage;
        if (miles) updateData.miles = miles;
        if (hours) updateData.hours = hours;
        await base44.asServiceRole.entities.Vehicle.update(vehicle_id, updateData);
    }

    return Response.json({ success: true, inspection_id: inspection.id, report_number, novedad_id });
});