import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const {
        vehicle_id, company_id, location_id,
        fuel_date,
        mileage, miles, hours,
        fuel_quantity, price_per_unit, total_price,
        fuel_type, is_full_tank,
        ticket_photo_url, notes
    } = payload;

    // Crear el registro de carga de combustible
    const fuelUpData = {
        vehicle_id,
        company_id,
        location_id,
        date: fuel_date || new Date().toISOString().split('T')[0],
        mileage: mileage || null,
        miles: miles || null,
        hours: hours || null,
        fuel_quantity,
        price_per_unit: price_per_unit || null,
        total_price: total_price || null,
        fuel_type: fuel_type || null,
        is_full_tank: is_full_tank || false,
        ticket_photo_url: ticket_photo_url || null,
        notes: notes || null,
    };

    const created = await base44.asServiceRole.entities.FuelUp.create(fuelUpData);

    // Actualizar telemetría del vehículo
    const vehicleUpdate = {};
    if (mileage) vehicleUpdate.mileage = mileage;
    if (miles) vehicleUpdate.miles = miles;
    if (hours) vehicleUpdate.hours = hours;
    if (Object.keys(vehicleUpdate).length > 0) {
        await base44.asServiceRole.entities.Vehicle.update(vehicle_id, vehicleUpdate);
    }

    // Calcular consumo si es tanque lleno
    let consumo = null;
    if (is_full_tank) {
        consumo = await calcularConsumo(base44, vehicle_id, created.id, mileage, miles, hours, fuel_quantity);
    }

    return Response.json({ fuel_up_id: created.id, consumo });
});

async function calcularConsumo(base44, vehicle_id, currentFuelUpId, mileage, miles, hours, currentLiters) {
    // Obtener todas las cargas de este vehículo, ordenadas por fecha descendente
    const allFuelUps = await base44.asServiceRole.entities.FuelUp.filter(
        { vehicle_id },
        '-created_date',
        100
    );

    // Excluir la carga recién creada
    const prevFuelUps = allFuelUps.filter(f => f.id !== currentFuelUpId);

    // Encontrar la última carga de tanque lleno anterior
    const lastFullTankIndex = prevFuelUps.findIndex(f => f.is_full_tank === true);
    if (lastFullTankIndex === -1) {
        // No hay carga de tanque lleno anterior — es la primera, no se puede calcular
        return null;
    }

    const lastFullTank = prevFuelUps[lastFullTankIndex];

    // Calcular distancia recorrida
    let distancia = null;
    let unidad = null;

    if (mileage && lastFullTank.mileage) {
        distancia = mileage - lastFullTank.mileage;
        unidad = 'km';
    } else if (miles && lastFullTank.miles) {
        distancia = miles - lastFullTank.miles;
        unidad = 'millas';
    } else if (hours && lastFullTank.hours) {
        distancia = hours - lastFullTank.hours;
        unidad = 'h';
    }

    if (!distancia || distancia <= 0) return null;

    // Sumar todos los litros cargados desde la última carga de tanque lleno
    // (las cargas intermedias + la carga actual)
    const cargasIntermedias = prevFuelUps.slice(0, lastFullTankIndex); // más recientes que lastFullTank
    const litrosIntermedios = cargasIntermedias.reduce((sum, f) => sum + (f.fuel_quantity || 0), 0);
    const litrosTotales = litrosIntermedios + currentLiters;

    // Consumo: L/100km (o L/100millas, L/h)
    const consumoValor = unidad === 'h'
        ? (litrosTotales / distancia).toFixed(2)   // L/hora
        : ((litrosTotales / distancia) * 100).toFixed(2); // L/100

    return {
        valor: consumoValor,
        unidad: unidad === 'h' ? 'L/h' : `L/100${unidad}`,
        litros_totales: litrosTotales.toFixed(1),
        distancia: distancia.toFixed(1),
        cargas_incluidas: cargasIntermedias.length + 1,
    };
}