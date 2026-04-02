import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { vehicle_id, company_id, location_id, type, mileage, hours, checklist, novedades_descripcion, notes } = body;

    // Crear la inspección
    const inspectionData = {
        vehicle_id,
        company_id,
        location_id,
        inspector_name: user.full_name || user.email,
        type,
        inspection_date: new Date().toISOString(),
        mileage: mileage || null,
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

    // Actualizar mileage/hours del vehículo si es post_trip o si se proveyeron datos
    if (mileage || hours) {
        const updateData = {};
        if (mileage) updateData.mileage = mileage;
        if (hours) updateData.hours = hours;
        await base44.asServiceRole.entities.Vehicle.update(vehicle_id, updateData);
    }

    return Response.json({ success: true, inspection_id: inspection.id, novedad_id });
});