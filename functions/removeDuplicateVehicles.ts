import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Obtener todos los vehículos
    const vehicles = await base44.asServiceRole.entities.Vehicle.list();
    
    const results = {
      duplicates_found: [],
      deleted: [],
      errors: []
    };

    // Agrupar por interno dentro de cada empresa
    const groupedByCompanyAndInternal = {};
    
    for (const vehicle of vehicles) {
      if (!vehicle.internal_number) continue;
      
      const key = `${vehicle.company_id}_${vehicle.internal_number.toLowerCase()}`;
      
      if (!groupedByCompanyAndInternal[key]) {
        groupedByCompanyAndInternal[key] = [];
      }
      groupedByCompanyAndInternal[key].push(vehicle);
    }

    // Identificar y eliminar duplicados (mantener el más antiguo)
    for (const [key, vehicleGroup] of Object.entries(groupedByCompanyAndInternal)) {
      if (vehicleGroup.length > 1) {
        // Ordenar por fecha de creación (más antiguo primero)
        vehicleGroup.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        
        // Mantener el primero (más antiguo), eliminar los demás
        const [keepVehicle, ...duplicates] = vehicleGroup;
        
        results.duplicates_found.push({
          internal_number: keepVehicle.internal_number,
          plate: keepVehicle.plate,
          count: vehicleGroup.length,
          kept: keepVehicle.id
        });

        // Eliminar duplicados
        for (const duplicate of duplicates) {
          try {
            await base44.asServiceRole.entities.Vehicle.delete(duplicate.id);
            results.deleted.push({
              id: duplicate.id,
              internal_number: duplicate.internal_number,
              plate: duplicate.plate,
              created_date: duplicate.created_date
            });
          } catch (error) {
            results.errors.push({
              id: duplicate.id,
              error: error.message
            });
          }
        }
      }
    }

    return Response.json({
      success: true,
      summary: {
        duplicates_found: results.duplicates_found.length,
        deleted: results.deleted.length,
        errors: results.errors.length
      },
      details: results
    });

  } catch (error) {
    console.error('Error removing duplicates:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});