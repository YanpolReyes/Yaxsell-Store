import { Order, OrderItem } from '@/types';
import type { ProductWarehouseLocation } from '@/lib/product-features';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente de pago',
  processing: 'En proceso',
  paid: 'Pago confirmado',
  shipped: 'Despachado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export function generateOrderPdf(
  order: Order,
  items: OrderItem[],
  productLocations?: Record<string, ProductWarehouseLocation | null | undefined>,
) {
  const hasLocations = productLocations && items.some(i => i.id && productLocations[i.id]?.label);
  const statusLabel = STATUS_LABELS[order.STATUS] || order.STATUS;
  const date = formatDate(order.CREATEDAT);
  const subtotal = order.SUBTOTAL || items.reduce((s, i) => s + (i.total || i.price * i.qty), 0);
  const total = order.TOTAL || subtotal;
  const discount = order.DISCOUNT || (subtotal - total > 0 ? subtotal - total : 0);

  const itemsHtml = items.map(i => {
    const loc = i.id ? productLocations?.[i.id]?.label : null;
    return `
    <tr>
      <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333;">${i.name}</td>
      ${hasLocations ? `<td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#4338ca;text-align:center;font-weight:600;">${loc || '—'}</td>` : ''}
      <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#666;text-align:center;">${i.qty}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#666;text-align:right;">${formatPrice(i.price)}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333;text-align:right;font-weight:600;">${formatPrice(i.total || i.price * i.qty)}</td>
    </tr>
  `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Pedido ${order.ORDERCODE}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #333; padding: 40px; max-width: 700px; margin: 0 auto; }
    @media print { body { padding: 20px; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #3483fa;">
    <div>
      <h1 style="font-size:24px;font-weight:700;color:#3483fa;margin-bottom:4px;">Comprobante de Pedido</h1>
      <p style="font-size:13px;color:#999;">${date}</p>
    </div>
    <div style="text-align:right;">
      <p style="font-size:20px;font-weight:700;color:#333;">${order.ORDERCODE}</p>
      <span style="display:inline-block;padding:3px 12px;border-radius:12px;background:#f0f0f0;font-size:12px;font-weight:600;color:#666;">${statusLabel}</span>
    </div>
  </div>

  <!-- Customer info -->
  <div style="display:flex;gap:40px;margin-bottom:28px;">
    <div style="flex:1;">
      <p style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase;margin-bottom:6px;">Cliente</p>
      <p style="font-size:14px;font-weight:600;color:#333;margin-bottom:2px;">${order.CUSTOMERNAME || '-'}</p>
      <p style="font-size:13px;color:#666;">${order.CUSTOMERRUT || ''}</p>
      <p style="font-size:13px;color:#666;">${order.CUSTOMERPHONE || ''}</p>
      <p style="font-size:13px;color:#666;">${order.CUSTOMEREMAIL || ''}</p>
    </div>
    <div style="flex:1;">
      <p style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase;margin-bottom:6px;">Envío</p>
      <p style="font-size:14px;font-weight:600;color:#333;margin-bottom:2px;">${order.SHIPPINGAGENCY || 'A coordinar'}</p>
      <p style="font-size:13px;color:#666;">${order.ADDRESS || ''}</p>
      <p style="font-size:13px;color:#666;">${[order.COMUNA, order.REGION].filter(Boolean).join(', ')}</p>
    </div>
  </div>

  <!-- Items table -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <thead>
      <tr style="background:#f8f9fa;">
        <th style="padding:10px 6px;text-align:left;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;border-bottom:2px solid #e0e0e0;">Producto</th>
        ${hasLocations ? '<th style="padding:10px 6px;text-align:center;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;border-bottom:2px solid #e0e0e0;">Ubicación</th>' : ''}
        <th style="padding:10px 6px;text-align:center;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;border-bottom:2px solid #e0e0e0;">Cant.</th>
        <th style="padding:10px 6px;text-align:right;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;border-bottom:2px solid #e0e0e0;">P. Unit.</th>
        <th style="padding:10px 6px;text-align:right;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;border-bottom:2px solid #e0e0e0;">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <!-- Totals -->
  <div style="margin-left:auto;width:260px;">
    <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;">
      <span style="color:#666;">Subtotal</span>
      <span style="color:#333;">${formatPrice(subtotal)}</span>
    </div>
    ${discount > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;">
      <span style="color:#00a650;">Descuento${order.COUPONCODE ? ' (' + order.COUPONCODE + ')' : ''}</span>
      <span style="color:#00a650;font-weight:600;">-${formatPrice(discount)}</span>
    </div>` : ''}
    <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;">
      <span style="color:#666;">Envío</span>
      <span style="color:#00a650;font-size:12px;">A coordinar</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:12px 0 0;margin-top:8px;border-top:2px solid #333;font-size:18px;font-weight:700;">
      <span>Total</span>
      <span>${formatPrice(total)}</span>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e0e0e0;text-align:center;">
    <p style="font-size:12px;color:#999;">Este documento es un comprobante de tu pedido. Consérvalo como referencia.</p>
    <p style="font-size:11px;color:#ccc;margin-top:4px;">Generado automáticamente</p>
  </div>

  <!-- Print button (non-print) -->
  <div class="no-print" style="text-align:center;margin-top:24px;">
    <button onclick="window.print()" style="padding:12px 32px;background:#3483fa;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;">
      Imprimir / Guardar PDF
    </button>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    // Auto-trigger print dialog after a brief delay
    setTimeout(() => printWindow.print(), 500);
  }
}
