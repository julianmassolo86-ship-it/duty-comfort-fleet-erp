import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

async function imageUrlToBase64(url) {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const contentType = response.headers.get('content-type') || 'image/png';
    return { base64, format: contentType.includes('png') ? 'PNG' : 'JPEG' };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { vehicle_id, schedule_id } = body;

    // Fetch all needed data in parallel
    const [vehicles, schedules, taskDefs, spareParts, companies, manufacturers] = await Promise.all([
      base44.asServiceRole.entities.Vehicle.filter({ id: vehicle_id }),
      base44.asServiceRole.entities.VehicleMaintenanceSchedule.filter({ id: schedule_id }),
      base44.asServiceRole.entities.MaintenanceTaskDefinition.list(),
      base44.asServiceRole.entities.SparePart.list(),
      base44.asServiceRole.entities.Company.list(),
      base44.asServiceRole.entities.Manufacturer.list(),
    ]);

    const vehicle = vehicles[0];
    const schedule = schedules[0];
    if (!vehicle || !schedule) {
      return Response.json({ error: 'Datos no encontrados' }, { status: 404 });
    }

    const taskDef = taskDefs.find(t => t.id === schedule.maintenance_task_definition_id);
    if (!taskDef) {
      return Response.json({ error: 'Programa no encontrado' }, { status: 404 });
    }

    const company = companies.find(c => c.id === vehicle.company_id);
    const manufacturer = manufacturers.find(m => m.id === vehicle.manufacturer_id);

    // Resolve linked tasks (actions/items that make up this program)
    const linkedTasks = (taskDef.linked_task_ids || [])
      .map(id => taskDefs.find(t => t.id === id))
      .filter(Boolean);

    // Resolve required spare parts from the program definition
    const requiredParts = (taskDef.required_spare_parts || []).map(rp => {
      const part = spareParts.find(sp => sp.id === rp.spare_part_id);
      return { ...rp, part };
    }).filter(rp => rp.part);

    // Generate PDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // ── HEADER BACKGROUND ──────────────────────────────────────────────
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Company logo (left)
    if (company?.logo_url) {
      const img = await imageUrlToBase64(company.logo_url);
      if (img) {
        try { doc.addImage(img.base64, img.format, margin, 8, 40, 18, '', 'FAST'); } catch {}
      }
    }

    // Manufacturer logo (right)
    if (manufacturer?.logo_url) {
      const img = await imageUrlToBase64(manufacturer.logo_url);
      if (img) {
        try { doc.addImage(img.base64, img.format, pageWidth - margin - 35, 10, 35, 14, '', 'FAST'); } catch {}
      }
    }

    // Title in header
    doc.setFontSize(9);
    doc.setTextColor(250, 204, 21); // yellow-400
    doc.setFont('helvetica', 'bold');
    doc.text('ORDEN DE SERVICIO', pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('PROGRAMA DE MANTENIMIENTO', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, pageWidth / 2, 33, { align: 'center' });

    // ── VEHICLE INFO BOX ──────────────────────────────────────────────
    let y = 58;

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, contentWidth, 38, 3, 3, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(margin, y, contentWidth, 38, 3, 3, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL VEHÍCULO', margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    const vehicleFields = [
      ['Empresa:', company?.name || '-'],
      ['Interno N°:', vehicle.internal_number || '-'],
      ['Patente:', vehicle.plate || '-'],
      ['Marca:', manufacturer?.name || vehicle.manufacturer || '-'],
      ['Modelo:', vehicle.model || '-'],
      ['Año:', vehicle.year ? String(vehicle.year) : '-'],
      ['Km actuales:', vehicle.mileage ? `${vehicle.mileage.toLocaleString('es-AR')} km` : '-'],
      ['Horas actuales:', vehicle.hours ? `${vehicle.hours.toLocaleString('es-AR')} hs` : '-'],
      ['Chasis:', vehicle.chassis_number || '-'],
    ];

    const col1Fields = vehicleFields.slice(0, 5);
    const col2Fields = vehicleFields.slice(5);

    col1Fields.forEach((f, i) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(7.5);
      doc.text(f[0], margin + 4, y + 14 + i * 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(f[1], margin + 28, y + 14 + i * 5.5);
    });

    col2Fields.forEach((f, i) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(7.5);
      doc.text(f[0], pageWidth / 2 + 2, y + 14 + i * 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(f[1], pageWidth / 2 + 28, y + 14 + i * 5.5);
    });

    y += 44;

    // ── PROGRAM INFO BOX ──────────────────────────────────────────────
    doc.setFillColor(250, 204, 21);
    doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.text(`PROGRAMA: ${taskDef.name.toUpperCase()}`, margin + 4, y + 5.5);

    y += 12;

    // Intervals row
    const intervals = [];
    if (taskDef.interval_mileage) intervals.push({ label: 'Intervalo Km', value: `Cada ${taskDef.interval_mileage.toLocaleString('es-AR')} km`, next: schedule.next_due_mileage ? `Próximo: ${schedule.next_due_mileage.toLocaleString('es-AR')} km` : '' });
    if (taskDef.interval_hours) intervals.push({ label: 'Intervalo Horas', value: `Cada ${taskDef.interval_hours.toLocaleString('es-AR')} hs`, next: schedule.next_due_hours ? `Próximo: ${schedule.next_due_hours.toLocaleString('es-AR')} hs` : '' });
    if (taskDef.interval_months) intervals.push({ label: 'Intervalo Tiempo', value: `Cada ${taskDef.interval_months} meses`, next: schedule.next_due_date ? `Próximo: ${new Date(schedule.next_due_date).toLocaleDateString('es-AR')}` : '' });
    if (schedule.last_completed_date) intervals.push({ label: 'Último Servicio', value: new Date(schedule.last_completed_date).toLocaleDateString('es-AR'), next: schedule.last_completed_mileage ? `${schedule.last_completed_mileage.toLocaleString('es-AR')} km` : '' });

    if (intervals.length > 0) {
      const colW = contentWidth / intervals.length;
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
      doc.setDrawColor(230, 230, 230);
      doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'S');

      intervals.forEach((iv, i) => {
        const x = margin + i * colW;
        if (i > 0) {
          doc.setDrawColor(220, 220, 220);
          doc.line(x, y + 2, x, y + 16);
        }
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.setFont('helvetica', 'normal');
        doc.text(iv.label, x + colW / 2, y + 5.5, { align: 'center' });
        doc.setFontSize(8.5);
        doc.setTextColor(20, 20, 20);
        doc.setFont('helvetica', 'bold');
        doc.text(iv.value, x + colW / 2, y + 11, { align: 'center' });
        if (iv.next) {
          doc.setFontSize(6.5);
          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'normal');
          doc.text(iv.next, x + colW / 2, y + 16, { align: 'center' });
        }
      });

      y += 22;
    }

    // ── LINKED TASKS (acciones/pasos) ──────────────────────────────────
    if (linkedTasks.length > 0) {
      y += 4;
      // Section header
      doc.setFillColor(30, 30, 30);
      doc.roundedRect(margin, y, contentWidth, 7, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(250, 204, 21);
      doc.setFont('helvetica', 'bold');
      doc.text('TAREAS / ACCIONES A REALIZAR', margin + 4, y + 5);
      y += 10;

      linkedTasks.forEach((task, idx) => {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 20;
        }

        const isEven = idx % 2 === 0;
        doc.setFillColor(isEven ? 248 : 255, isEven ? 248 : 255, isEven ? 248 : 255);
        doc.rect(margin, y, contentWidth, 9, 'F');

        // Checkbox circle
        doc.setDrawColor(180, 180, 180);
        doc.setFillColor(255, 255, 255);
        doc.circle(margin + 4, y + 4.5, 2.5, 'FD');

        // Task name
        doc.setFontSize(8.5);
        doc.setTextColor(20, 20, 20);
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx + 1}. ${task.name}`, margin + 10, y + 5);

        // Task type badge
        const typeLabel = task.task_type === 'action' ? 'Acción' : 'Ítem';
        const typeColor = task.task_type === 'action' ? [59, 130, 246] : [16, 185, 129];
        doc.setFillColor(...typeColor);
        doc.roundedRect(pageWidth - margin - 18, y + 1.5, 16, 5.5, 1, 1, 'F');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(typeLabel, pageWidth - margin - 10, y + 5.2, { align: 'center' });

        // Component names / specs
        if (task.component_names && task.component_names.length > 0) {
          y += 9;
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'italic');
          doc.text(`   Especificación: ${task.component_names.join(', ')}`, margin + 10, y + 3);
          doc.rect(margin, y, contentWidth, 6, 'F');
          y += 6;
        } else {
          y += 9;
        }

        // Divider
        doc.setDrawColor(230, 230, 230);
        doc.line(margin + 8, y, pageWidth - margin, y);
      });

      y += 4;
    }

    // ── SPARE PARTS TABLE ──────────────────────────────────────────────
    if (requiredParts.length > 0) {
      if (y > pageHeight - 50) {
        doc.addPage();
        y = 20;
      }

      y += 4;
      doc.setFillColor(30, 30, 30);
      doc.roundedRect(margin, y, contentWidth, 7, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(250, 204, 21);
      doc.setFont('helvetica', 'bold');
      doc.text('REPUESTOS E INSUMOS REQUERIDOS', margin + 4, y + 5);
      y += 10;

      // Table header
      doc.setFillColor(60, 60, 60);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      const cols = { item: margin + 4, partNum: margin + 75, qty: margin + 125, unit: margin + 148 };
      doc.text('Descripción', cols.item, y + 5);
      doc.text('N° de Parte', cols.partNum, y + 5);
      doc.text('Cantidad', cols.qty, y + 5);
      doc.text('Unidad', cols.unit, y + 5);
      y += 7;

      requiredParts.forEach((rp, idx) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }

        const isEven = idx % 2 === 0;
        doc.setFillColor(isEven ? 248 : 255, isEven ? 248 : 255, isEven ? 248 : 255);
        doc.rect(margin, y, contentWidth, 8, 'F');

        doc.setFontSize(8);
        doc.setTextColor(20, 20, 20);
        doc.setFont('helvetica', 'normal');
        const partName = doc.splitTextToSize(rp.part.name, 68);
        doc.text(partName[0], cols.item, y + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(80, 80, 80);
        doc.text(rp.part.part_number || '-', cols.partNum, y + 5.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(20, 20, 20);
        doc.text(String(rp.quantity), cols.qty + 6, y + 5.5, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(80, 80, 80);
        doc.text(rp.part.unit_of_measure || 'UNID', cols.unit, y + 5.5);

        y += 8;
        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y, pageWidth - margin, y);
      });
    }

    // ── SIGNATURE SECTION ──────────────────────────────────────────────
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    y += 12;
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, y, margin + 70, y);
    doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text('Firma del Mecánico', margin, y + 5);
    doc.text('Firma del Supervisor', pageWidth - margin - 70, y + 5);

    // ── FOOTER ──────────────────────────────────────────────
    const footerY = pageHeight - 10;
    doc.setFillColor(20, 20, 20);
    doc.rect(0, footerY - 6, pageWidth, 16, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(150, 150, 150);
    doc.text(`${company?.name || 'Mass Soluciones'} · Sistema de Gestión de Flotas`, pageWidth / 2, footerY, { align: 'center' });

    const pdfBytes = doc.output('arraybuffer');

    const fileName = `OT-${vehicle.plate || vehicle.internal_number || 'vehiculo'}-${taskDef.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});