const fs = require('fs');

const cssPath = 'C:\\Proyectos\\PROJECT YAXSEL\\web-store\\public\\shopify\\plantilla5\\assets\\css\\pebble-little.myshopify.com\\cdn\\shop\\t\\22\\assets\\theme.css';
const content = fs.readFileSync(cssPath, 'utf8');

// Find all matches for #MainContent or similar
const regex = /([^{}]*MainContent[^{}]*)\{([^}]*)\}/gi;
let match;
console.log('SEARCHING FOR MainContent RULES IN theme.css:');
while ((match = regex.exec(content)) !== null) {
  const selectors = match[1].trim();
  const body = match[2].trim();
  if (body.includes('display') || body.includes('opacity') || body.includes('visibility')) {
    console.log(`- Selectors: ${selectors}`);
    console.log(`  Rule: ${body}`);
  }
}

// Find all matches for .product selector and print those with hide rules
const regexProd = /(\.product[^{}]*)\{([^}]*)\}/gi;
let count = 0;
console.log('\nSEARCHING FOR .product RULES WITH HIDING PROPERTIES:');
while ((match = regexProd.exec(content)) !== null) {
  const selectors = match[1].trim();
  const body = match[2].trim();
  if (body.includes('display:none') || body.includes('opacity:0') || body.includes('visibility:hidden')) {
    console.log(`- Selectors: ${selectors}`);
    console.log(`  Rule: ${body}`);
    count++;
  }
}
console.log(`Total .product hiding rules found: ${count}`);
