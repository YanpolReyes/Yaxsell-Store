const fs = require('fs');
const content = fs.readFileSync('C:\\Proyectos\\PROJECT YAXSEL\\web-store\\public\\shopify\\plantilla5\\product-clean.html', 'utf8');

console.log('Searching for visibility rules in product-clean.html...');

// Find elements with inline style containing hide rules
const matches = [];
const regex = /style="([^"]*)"/gi;
let match;
while ((match = regex.exec(content)) !== null) {
  const style = match[1];
  if (style.includes('opacity') || style.includes('display') || style.includes('visibility')) {
    matches.push(match[0]);
  }
}

console.log(`Found ${matches.length} inline styles with visibility rules:`);
matches.slice(0, 10).forEach(m => console.log(' -', m));
