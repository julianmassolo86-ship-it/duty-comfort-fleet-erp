import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Marcas existentes
    const existingManufacturers = await base44.asServiceRole.entities.Manufacturer.list();
    const existingNames = existingManufacturers.map(m => m.name.toLowerCase());

    // Marcas a agregar
    const brandsToAdd = [
      'Chevrolet', 'Volkswagen', 'Honda', 'Nissan', 'BMW', 'Audi', 
      'Hyundai', 'Kia', 'Renault', 'Peugeot', 'Citroën', 'Jeep', 
      'Volvo', 'Subaru', 'Mazda', 'Mitsubishi', 'Porsche', 
      'Ferrari', 'Lamborghini', 'Tesla'
    ];

    const results = [];

    for (const brand of brandsToAdd) {
      // Verificar si ya existe
      if (existingNames.includes(brand.toLowerCase())) {
        results.push({ brand, status: 'skipped', message: 'Already exists' });
        continue;
      }

      try {
        // Generar logo con IA
        const imageResponse = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt: `Professional automotive brand logo for ${brand}, clean and minimalist design, white background, corporate style, high quality, centered, 500x500 pixels, PNG format, official car manufacturer logo`
        });

        // Crear el manufacturer
        await base44.asServiceRole.entities.Manufacturer.create({
          name: brand,
          logo_url: imageResponse.url,
          notes: ''
        });

        results.push({ brand, status: 'success', logo_url: imageResponse.url });
      } catch (error) {
        results.push({ brand, status: 'error', message: error.message });
      }
    }

    return Response.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error generating manufacturer logos:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});