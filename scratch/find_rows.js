const fs = require('fs');
const content = fs.readFileSync('c:/Proyectos/PROJECT YAXSEL (PRODUCCION) - 14-06-2026 (3GB)/public/shopify/plantilla5/product-clean.html', 'utf8');

// Find all occurrences of accordion__row
let idx = 0;
while ((idx = content.indexOf('accordion__row', idx)) !== -1) {
  console.log('--- Found accordion__row at index:', idx);
  // Find preceding 500 characters
  const start = Math.max(0, idx - 500);
  console.log(content.substring(start, idx));
  idx += 'accordion__row'.length;
}
