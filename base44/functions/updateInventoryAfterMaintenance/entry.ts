import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Payload from entity automation
    const maintenanceId = body?.event?.entity_id;
    const eventType = body?.event?.type;
    const maintenanceData = body?.data;

    if (!maintenanceId) {
      return Response.json({ error: 'No maintenance id' }, { status: 400 });
    }

    const spare_parts_used = maintenanceData?.spare_parts_used;
    if (!spare_parts_used || spare_parts_used.length === 0) {
      return Response.json({ message: 'No spare parts to process' });
    }

    const today = new Date().toISOString().split('T')[0];

    // For each spare part used, discount stock and create StockMovement
    const tasks = spare_parts_used.map(async (item) => {
      if (!item.spare_part_id || !item.quantity) return;

      // Get current stock
      const parts = await base44.asServiceRole.entities.SparePart.filter({ id: item.spare_part_id });
      if (!parts.length) return;

      const part = parts[0];
      const newStock = (part.stock_quantity || 0) - item.quantity;

      // Update stock
      await base44.asServiceRole.entities.SparePart.update(item.spare_part_id, {
        stock_quantity: Math.max(0, newStock),
      });

      // Create stock movement (egreso)
      await base44.asServiceRole.entities.StockMovement.create({
        type: 'egreso',
        spare_part_id: item.spare_part_id,
        company_id: maintenanceData.company_id,
        quantity: item.quantity,
        date: today,
        origin: 'orden_trabajo',
        reference_id: maintenanceId,
        reference_number: maintenanceData.report_number || maintenanceId,
        notes: `Mantenimiento correctivo${maintenanceData.novedad_report_number ? ' - Novedad #' + maintenanceData.novedad_report_number : ''}`,
      });
    });

    await Promise.all(tasks);

    return Response.json({ success: true, processed: spare_parts_used.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});