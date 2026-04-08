import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();

    // Handle manual stock adjustment (from StockMovements page)
    if (payload.action === 'manual_adjustment') {
      const { spare_part_id, type, quantity, date, origin, reference_number, notes, company_id } = payload;
      
      if (!spare_part_id || !type || !quantity) {
        return Response.json({ error: 'Faltan datos requeridos' }, { status: 400 });
      }

      // Create the stock movement record
      const movement = await base44.asServiceRole.entities.StockMovement.create({
        spare_part_id,
        type,
        quantity: parseFloat(quantity),
        date,
        origin: origin || 'ajuste_manual',
        reference_number: reference_number || '',
        company_id,
        user_name: payload.user_name || user.full_name || user.email,
        notes: notes || '',
      });

      // Update the spare part stock
      const sparePart = await base44.asServiceRole.entities.SparePart.get(spare_part_id);
      if (sparePart) {
        const currentStock = sparePart.stock_quantity || 0;
        let newStock = currentStock;
        if (type === 'entrada' || type === 'devolucion') {
          newStock = currentStock + parseFloat(quantity);
        } else if (type === 'egreso') {
          newStock = Math.max(0, currentStock - parseFloat(quantity));
        } else if (type === 'ajuste') {
          newStock = parseFloat(quantity); // ajuste sets absolute value
        }
        await base44.asServiceRole.entities.SparePart.update(spare_part_id, { stock_quantity: newStock });
      }

      return Response.json({ success: true, movement_id: movement.id });
    }

    // Handle delivery note confirmation
    const { delivery_note_id } = payload;
    if (!delivery_note_id) return Response.json({ error: 'Falta delivery_note_id' }, { status: 400 });

    const deliveryNote = await base44.asServiceRole.entities.DeliveryNote.get(delivery_note_id);
    if (!deliveryNote) return Response.json({ error: 'Remito no encontrado' }, { status: 404 });
    if (deliveryNote.status !== 'pendiente') return Response.json({ error: 'Este remito ya fue confirmado' }, { status: 400 });

    const items = deliveryNote.items || [];
    const today = new Date().toISOString().split('T')[0];
    const allComplete = items.every(item => item.quantity_received >= item.quantity_ordered);
    const anyReceived = items.some(item => (item.quantity_received || 0) > 0);

    if (!anyReceived) return Response.json({ error: 'No se registró ninguna cantidad recibida' }, { status: 400 });

    // Process each item: update stock and create movement
    for (const item of items) {
      const received = parseFloat(item.quantity_received) || 0;
      if (received <= 0) continue;

      // Create stock movement
      await base44.asServiceRole.entities.StockMovement.create({
        type: 'entrada',
        spare_part_id: item.spare_part_id,
        company_id: deliveryNote.company_id,
        quantity: received,
        date: deliveryNote.reception_date || today,
        origin: 'remito_compra',
        reference_id: delivery_note_id,
        reference_number: deliveryNote.delivery_number,
        user_name: user.full_name || user.email,
        notes: `Remito ${deliveryNote.delivery_number}`,
      });

      // Update spare part stock
      const sparePart = await base44.asServiceRole.entities.SparePart.get(item.spare_part_id);
      if (sparePart) {
        const newStock = (sparePart.stock_quantity || 0) + received;
        await base44.asServiceRole.entities.SparePart.update(item.spare_part_id, { stock_quantity: newStock });
      }
    }

    // Update delivery note status
    const newStatus = allComplete ? 'completo' : 'parcial';
    await base44.asServiceRole.entities.DeliveryNote.update(delivery_note_id, { status: newStatus });

    // If linked to a PO, update its status
    if (deliveryNote.purchase_order_id) {
      await base44.asServiceRole.entities.PurchaseOrder.update(deliveryNote.purchase_order_id, { status: 'recibida' });
    }

    return Response.json({ success: true, status: newStatus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});