import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener todos los vehículos (filtrar por empresa si no es super admin)
    let vehicles = await base44.asServiceRole.entities.Vehicle.list();
    
    if (user.company_id) {
      vehicles = vehicles.filter(v => v.company_id === user.company_id);
    }

    // Si no hay vehículos, retornar CSV vacío
    if (vehicles.length === 0) {
      const headers = ["Interno", "Patente", "Empresa", "Locación"];
      const csvContent = headers.join(',') + '\n';
      const bom = '\uFEFF';
      return new Response(bom + csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="vehiculos_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Obtener todos los datos relacionados
    const [companies, locations, drivers, vehicleTypes, vehicleStatuses, maintenances, acMaintenances, novedades] = await Promise.all([
      base44.asServiceRole.entities.Company.list(),
      base44.asServiceRole.entities.Location.list(),
      base44.asServiceRole.entities.Driver.list(),
      base44.asServiceRole.entities.VehicleType.list(),
      base44.asServiceRole.entities.VehicleStatus.list(),
      base44.asServiceRole.entities.Maintenance.list(),
      base44.asServiceRole.entities.AirConditioningMaintenance.list(),
      base44.asServiceRole.entities.Novedad.list()
    ]);

    // Crear mapas para búsqueda rápida
    const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));
    const locationMap = Object.fromEntries(locations.map(l => [l.id, l.name]));
    const driverMap = Object.fromEntries(drivers.map(d => [d.id, d.full_name]));
    const typeMap = Object.fromEntries(vehicleTypes.map(t => [t.id, t.name]));

    // Agrupar datos relacionados por vehículo
    const maintenancesByVehicle = maintenances.reduce((acc, m) => {
      if (!acc[m.vehicle_id]) acc[m.vehicle_id] = [];
      acc[m.vehicle_id].push(m);
      return acc;
    }, {});

    const acMaintenancesByVehicle = acMaintenances.reduce((acc, ac) => {
      if (!acc[ac.vehicle_id]) acc[ac.vehicle_id] = [];
      acc[ac.vehicle_id].push(ac);
      return acc;
    }, {});

    const novedadesByVehicle = novedades.reduce((acc, n) => {
      if (!acc[n.vehicle_id]) acc[n.vehicle_id] = [];
      acc[n.vehicle_id].push(n);
      return acc;
    }, {});

    // Traducir estados del enum al español
    const statusTranslations = {
      active: "Activo",
      available: "Disponible",
      in_use: "En Uso",
      maintenance: "Mantenimiento",
      reserved: "Reservado",
      in_transit: "En Tránsito",
      retired: "Retirado"
    };

    const fuelTranslations = {
      gasoline: "Gasolina",
      diesel: "Diésel",
      electric: "Eléctrico",
      hybrid: "Híbrido",
      gnc: "GNC",
      gnv: "GNV",
      biodiesel: "Biodiésel",
      ethanol: "Etanol"
    };

    // Construir CSV con título
    const title = `EXPORTACIÓN DE VEHÍCULOS - ${new Date().toLocaleDateString('es-AR')}\n\n`;
    
    const headers = [
      "Interno",
      "Patente",
      "Empresa",
      "Locación",
      "Fabricante",
      "Modelo",
      "Año",
      "Tipo",
      "Descripción Técnica",
      "Estado",
      "Combustible",
      "Kilómetros",
      "Horas",
      "Conductores Asignados",
      "Chasis",
      "Motor",
      "VIN",
      "Último Servicio (km)",
      "Último Servicio (hs)",
      "Último Servicio (fecha)",
      "Próximo Servicio (km)",
      "Próximo Servicio (hs)",
      "Próximo Servicio (fecha)",
      "Vto. Seguro",
      "URL Seguro",
      "Vto. VTV",
      "URL VTV",
      "Vto. Cédula",
      "URL Cédula Frente",
      "URL Cédula Dorso",
      "Vto. Título",
      "URL Título",
      "Vto. Patente",
      "URL Patente",
      "Vto. Grabado Autopartes",
      "URL Grabado Autopartes",
      "Vto. Extintor",
      "URL Extintor",
      "Vto. Credencial Circulación",
      "URL Credencial Circulación",
      "Total Mantenimientos",
      "Último Mantenimiento",
      "Tipo Último Mant.",
      "Estado Último Mant.",
      "Total Informes A/C",
      "Último Informe A/C",
      "Estado Último Inf. A/C",
      "Total Novedades",
      "Última Novedad",
      "Estado Última Novedad",
      "Prioridad Última Novedad",
      "Fecha Alta",
      "Última Modificación",
      "Creado Por",
      "URL Imagen Vehículo",
      "Notas"
    ];

    const typeTranslations = {
      preventive: "Preventivo",
      preventivo: "Preventivo",
      corrective: "Correctivo",
      correctivo: "Correctivo",
      inspection: "Inspección",
      inspeccion: "Inspección"
    };

    const novedadStatusTranslations = {
      pendiente: "Pendiente",
      en_proceso: "En Proceso",
      resuelto: "Resuelto",
      cerrado: "Cerrado"
    };

    const rows = vehicles.map(v => {
      const assignedDrivers = (v.assigned_driver_ids || [])
        .map(dId => driverMap[dId])
        .filter(Boolean)
        .join("; ");

      // Buscar el nombre del estado personalizado o usar traducción por defecto
      let statusName = statusTranslations[v.status] || v.status || "";
      
      // Si existe un status personalizado en vehicleStatuses con ese código, usar ese nombre
      const customStatus = vehicleStatuses.find(s => s.code === v.status);
      if (customStatus) {
        statusName = customStatus.name;
      }

      // Datos de mantenimiento
      const vehicleMaintenances = maintenancesByVehicle[v.id] || [];
      const sortedMaintenances = vehicleMaintenances.sort((a, b) => 
        new Date(b.scheduled_date || b.completed_date || 0) - new Date(a.scheduled_date || a.completed_date || 0)
      );
      const lastMaintenance = sortedMaintenances[0];

      // Datos de aire acondicionado
      const vehicleAC = acMaintenancesByVehicle[v.id] || [];
      const sortedAC = vehicleAC.sort((a, b) => 
        new Date(b.inspection_date || 0) - new Date(a.inspection_date || 0)
      );
      const lastAC = sortedAC[0];

      // Datos de novedades
      const vehicleNovedades = novedadesByVehicle[v.id] || [];
      const sortedNovedades = vehicleNovedades.sort((a, b) => 
        new Date(b.fecha_reporte || 0) - new Date(a.fecha_reporte || 0)
      );
      const lastNovedad = sortedNovedades[0];

      const maintenanceStatusTranslations = {
        scheduled: "Programado",
        in_progress: "En Proceso",
        en_proceso: "En Proceso",
        completed: "Completado",
        completado: "Completado",
        aprobado: "Aprobado",
        cancelled: "Cancelado"
      };

      const prioridadTranslations = {
        baja: "Baja",
        media: "Media",
        alta: "Alta",
        critica: "Crítica"
      };

      return [
        v.internal_number || "",
        v.plate || "",
        companyMap[v.company_id] || "",
        locationMap[v.location_id] || "",
        v.manufacturer || "",
        v.model || "",
        v.year || "",
        typeMap[v.type_id] || "",
        v.technical_description || "",
        statusName,
        fuelTranslations[v.fuel_type] || v.fuel_type || "",
        v.mileage || 0,
        v.hours || 0,
        assignedDrivers,
        v.chassis_number || "",
        v.engine_number || "",
        v.vin || "",
        v.last_service_mileage || "",
        v.last_service_hours || "",
        v.last_service_date || "",
        v.next_service_mileage || "",
        v.next_service_hours || "",
        v.next_service_date || "",
        v.insurance_expiry || "",
        v.insurance_url || "",
        v.technical_inspection_expiry || "",
        v.technical_inspection_url || "",
        v.vehicle_card_front_expiry || "",
        v.vehicle_card_front_url || "",
        v.vehicle_card_back_url || "",
        v.title_expiry || "",
        v.title_url || "",
        v.license_plate_expiry || "",
        v.license_plate_url || "",
        v.parts_engraving_expiry || "",
        v.parts_engraving_url || "",
        v.fire_extinguisher_expiry || "",
        v.fire_extinguisher_url || "",
        v.circulation_permit_expiry || "",
        v.circulation_permit_url || "",
        vehicleMaintenances.length,
        lastMaintenance ? (lastMaintenance.scheduled_date || lastMaintenance.completed_date || "") : "",
        lastMaintenance ? (typeTranslations[lastMaintenance.type] || lastMaintenance.type || "") : "",
        lastMaintenance ? (maintenanceStatusTranslations[lastMaintenance.status] || lastMaintenance.status || "") : "",
        vehicleAC.length,
        lastAC ? (lastAC.inspection_date || "") : "",
        lastAC ? (maintenanceStatusTranslations[lastAC.status] || lastAC.status || "") : "",
        vehicleNovedades.length,
        lastNovedad ? (lastNovedad.fecha_reporte || "") : "",
        lastNovedad ? (novedadStatusTranslations[lastNovedad.estado] || lastNovedad.estado || "") : "",
        lastNovedad ? (prioridadTranslations[lastNovedad.prioridad] || lastNovedad.prioridad || "") : "",
        v.created_date ? new Date(v.created_date).toLocaleDateString('es-AR') : "",
        v.updated_date ? new Date(v.updated_date).toLocaleDateString('es-AR') : "",
        v.created_by || "",
        v.image_url || "",
        v.notes || ""
      ];
    });

    // Función para escapar valores CSV correctamente
    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      // Siempre usar comillas si hay comas, comillas, saltos de línea o punto y coma
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes(';')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      title.trim(),
      '',
      headers.map(h => escapeCsvValue(h)).join(','),
      ...rows.map(row => row.map(v => escapeCsvValue(v)).join(','))
    ].join('\r\n'); // Usar CRLF para mejor compatibilidad con Excel

    // Agregar BOM para compatibilidad con Excel y caracteres especiales
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    return new Response(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="vehiculos_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});