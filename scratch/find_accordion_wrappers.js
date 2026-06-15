const fs = require('fs');
const html = fs.readFileSync('c:/Proyectos/PROJECT YAXSEL (PRODUCCION) - 14-06-2026 (3GB)/public/shopify/plantilla5/product-clean.html', 'utf8');

// Find all matches for '<accordion-component' or class containing 'accordion'
const regex = /<accordion-component[^>]*>|<div[^>]*class="[^"]*accordion[^"]*"[^>]*>/g;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log('Match at index:', match.index);
  console.log(match[0]);
  console.log('--- Context (next 150 chars): ---');
  console.log(html.substring(match.index + match[0].length, match.index + match[0].length + 150));
  console.log('====================================');
}
