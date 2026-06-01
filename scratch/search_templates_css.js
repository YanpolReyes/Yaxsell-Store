const fs = require('fs');
const path = require('path');

const cssPath = 'C:\\Proyectos\\PROJECT YAXSEL\\web-store\\public\\shopify\\plantilla5\\assets\\css\\pebble-little.myshopify.com\\cdn\\shop\\t\\22\\assets\\theme.css';
const content = fs.readFileSync(cssPath, 'utf8');

console.log('CONTAINS template-product:', content.includes('template-product'));
console.log('CONTAINS template-index:', content.includes('template-index'));
console.log('CONTAINS template-:', content.includes('template-'));
