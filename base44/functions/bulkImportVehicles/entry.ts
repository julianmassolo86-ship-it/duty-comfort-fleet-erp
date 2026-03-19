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

    // Obtener vehículos existentes de esta empresa para evitar duplicados
    const existingVehicles = await base44.asServiceRole.entities.Vehicle.filter({ company_id: companyId });
    const existingInternals = new Set(existingVehicles.map(v => v.internal_number?.toLowerCase()));
    const existingPlates = new Set(existingVehicles.map(v => v.plate?.toLowerCase()).filter(Boolean));

    // Procesar cada vehículo en batch
    const vehiclesToCreate = [];
    
    for (const vehicle of vehicles) {
      try {
        const internalNumber = vehicle.interno?.toString()?.trim();
        const plate = vehicle.dominio?.toString()?.trim().toUpperCase();
        
        // Verificar si ya existe por interno o patente
        if (internalNumber && existingInternals.has(internalNumber.toLowerCase())) {
          results.errors.push({
            vehicle: internalNumber,
            error: `Vehículo duplicado (interno ya existe)`
          });
          continue;
        }
        
        if (plate && existingPlates.has(plate.toLowerCase())) {
          results.errors.push({
            vehicle: plate,
            error: `Vehículo duplicado (patente ya existe)`
          });
          continue;
        }

        // Mapear los campos (normalizar para búsqueda)
        const categoryName = normalize(vehicle.tipo_activo);
        const typeName = normalize(vehicle.utilidad);
        const manufacturerName = vehicle.marca?.trim();

        const categoryId = categoryMap[categoryName];
        const typeId = typeMap[typeName];

        // Buscar manufacturer (case insensitive)
        const mfrKey = manufacturerName?.toLowerCase();
        const finalManufacturer = manufacturerMap[mfrKey] || manufacturerName;

        if (!categoryId) {
          results.errors.push({
            vehicle: internalNumber || plate,
            error: `Categoría no encontrada: ${vehicle.tipo_activo}`
          });
          continue;
        }

        // Crear el objeto del vehículo (tipo es opcional)
        const vehicleData = {
          internal_number: internalNumber,
          plate: plate,
          year: vehicle.año ? parseInt(vehicle.año) : null,
          manufacturer: finalManufacturer,
          model: vehicle.modelo?.trim(),
          category_id: categoryId,
          company_id: companyId,
          location_id: locationId,
          status: 'active'
        };

        // Agregar type_id solo si se encontró
        if (typeId) {
          vehicleData.type_id = typeId;
        }

        vehiclesToCreate.push({
          data: vehicleData,
          original: vehicle
        });

      } catch (error) {
        results.errors.push({
          vehicle: vehicle.interno || vehicle.dominio,
          error: error.message
        });
      }
    }
    
    // Crear todos los vehículos en batch
    for (const item of vehiclesToCreate) {
      try {
        const created = await base44.asServiceRole.entities.Vehicle.create(item.data);
        results.success.push({
          internal_number: item.data.internal_number,
          plate: item.data.plate,
          id: created.id
        });
        
        // Agregar a los sets para evitar duplicados en el mismo batch
        if (item.data.internal_number) {
          existingInternals.add(item.data.internal_number.toLowerCase());
        }
        if (item.data.plate) {
          existingPlates.add(item.data.plate.toLowerCase());
        }
      } catch (error) {
        results.errors.push({
          vehicle: item.data.internal_number || item.data.plate,
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