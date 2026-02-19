import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vehicles } = await req.json();

    if (!vehicles || !Array.isArray(vehicles)) {
      return Response.json({ error: 'vehicles array is required' }, { status: 400 });
    }

    // Obtener IDs fijos
    const companyId = '698f3f85e273f2f036ff49d8'; // Cliba Ingenieria Urbana SA
    const locationId = '698f4320fe4d03ca4c380cd7'; // Cliba Palermo

    // Obtener todas las categorías y tipos para mapeo
    const categories = await base44.asServiceRole.entities.VehicleCategory.list();
    const types = await base44.asServiceRole.entities.VehicleType.list();
    const manufacturers = await base44.asServiceRole.entities.Manufacturer.list();

    // Función para normalizar nombres (quitar tildes, guiones, espacios extra)
    const normalize = (str) => {
      if (!str) return '';
      return str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar tildes
        .replace(/[-_]/g, '') // Quitar guiones y underscores
        .replace(/\s+/g, '') // Quitar todos los espacios
        .trim();
    };

    // Crear mapas para búsqueda rápida (case insensitive, sin tildes, sin guiones)
    const categoryMap = {};
    categories.forEach(cat => {
      const normalized = normalize(cat.name);
      categoryMap[normalized] = cat.id;
    });

    const typeMap = {};
    types.forEach(type => {
      const normalized = normalize(type.name);
      typeMap[normalized] = type.id;
    });

    const manufacturerMap = {};
    manufacturers.forEach(mfr => {
      manufacturerMap[mfr.name.toLowerCase()] = mfr.name;
    });

    const results = {
      success: [],
      errors: []
    };

    // Procesar cada vehículo
    for (const vehicle of vehicles) {
      try {
        // Mapear los campos (normalizar para búsqueda)
        const categoryName = vehicle.tipo_activo?.trim().toLowerCase().replace(/\s+/g, ' ');
        const typeName = vehicle.utilidad?.trim().toLowerCase().replace(/\s+/g, ' ');
        const manufacturerName = vehicle.marca?.trim();

        const categoryId = categoryMap[categoryName];
        const typeId = typeMap[typeName];

        // Buscar manufacturer (case insensitive)
        const mfrKey = manufacturerName?.toLowerCase();
        const finalManufacturer = manufacturerMap[mfrKey] || manufacturerName;

        if (!categoryId) {
          results.errors.push({
            vehicle: vehicle.interno,
            error: `Categoría no encontrada: ${vehicle.tipo_activo}`
          });
          continue;
        }

        if (!typeId) {
          results.errors.push({
            vehicle: vehicle.interno,
            error: `Tipo no encontrado: ${vehicle.utilidad}`
          });
          continue;
        }

        // Crear el objeto del vehículo
        const vehicleData = {
          internal_number: vehicle.interno?.toString(),
          plate: vehicle.dominio?.toString().toUpperCase(),
          year: vehicle.año ? parseInt(vehicle.año) : null,
          manufacturer: finalManufacturer,
          model: vehicle.modelo?.trim(),
          category_id: categoryId,
          type_id: typeId,
          company_id: companyId,
          location_id: locationId,
          status: 'active'
        };

        // Crear el vehículo
        const created = await base44.asServiceRole.entities.Vehicle.create(vehicleData);
        results.success.push({
          internal_number: vehicle.interno,
          plate: vehicle.dominio,
          id: created.id
        });

      } catch (error) {
        results.errors.push({
          vehicle: vehicle.interno || vehicle.dominio,
          error: error.message
        });
      }
    }

    return Response.json({
      message: 'Bulk import completed',
      total: vehicles.length,
      success: results.success.length,
      errors: results.errors.length,
      details: results
    });

  } catch (error) {
    console.error('Error in bulk import:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});