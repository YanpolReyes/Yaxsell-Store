const fs = require('fs');

const inlineCss = 'C:\\Proyectos\\PROJECT YAXSEL\\web-store\\public\\shopify\\plantilla5\\assets\\css\\inline\\index-inline-1.css';
const themeCss = 'C:\\Proyectos\\PROJECT YAXSEL\\web-store\\public\\shopify\\plantilla5\\assets\\css\\pebble-little.myshopify.com\\cdn\\shop\\t\\22\\assets\\theme.css';

console.log('SCANNING index-inline-1.css:');
const inlineContent = fs.readFileSync(inlineCss, 'utf8');
const inlineRegex = /([^{}]*MainContent[^{}]*)\{([^}]*)\}/gi;
let match;
while ((match = inlineRegex.exec(inlineContent)) !== null) {
  console.log(`- Selector: ${match[1].trim()}`);
  console.log(`  Rule: ${match[2].trim()}`);
}

const themeContent = fs.readFileSync(themeCss, 'utf8');
console.log('\nSCANNING theme.css FOR OPACITY ON MAIN/BODY/CONTENT:');
const opacityRegex = /([^{}]*(?:MainContent|main-content|body|html|\.product)[^{}]*)\{[^}]*(?:opacity\s*:\s*0|visibility\s*:\s*hidden|display\s*:\s*none)[^}]*\}/gi;
let count = 0;
while ((match = opacityRegex.exec(themeContent)) !== null) {
  console.log(`- Selector: ${match[1].trim()}`);
  console.log(`  Rule: ${match[0].trim()}`);
  count++;
}
console.log(`Total matches in theme.css: ${count}`);
