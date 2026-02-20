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

    // Obtener solo los datos necesarios
    const [companies, locations, drivers, vehicleTypes, vehicleStatuses] = await Promise.all([
      base44.asServiceRole.entities.Company.list(),
      base44.asServiceRole.entities.Location.list(),
      base44.asServiceRole.entities.Driver.list(),
      base44.asServiceRole.entities.VehicleType.list(),
      base44.asServiceRole.entities.VehicleStatus.list()
    ]);

    // Crear mapas para búsqueda rápida
    const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));
    const locationMap = Object.fromEntries(locations.map(l => [l.id, l.name]));
    const driverMap = Object.fromEntries(drivers.map(d => [d.id, d.full_name]));
    const typeMap = Object.fromEntries(vehicleTypes.map(t => [t.id, t.name]));

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
      "Último Servicio (fecha)",
      "Próximo Servicio (km)",
      "Próximo Servicio (fecha)",
      "Vto. Seguro",
      "Vto. VTV",
      "Vto. Cédula",
      "Notas"
    ];

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
        v.last_service_date || "",
        v.next_service_mileage || "",
        v.next_service_date || "",
        v.insurance_expiry || "",
        v.technical_inspection_expiry || "",
        v.vehicle_card_front_expiry || "",
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