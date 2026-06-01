const fs = require('fs');
const filePath = 'C:\\Proyectos\\PROJECT YAXSEL\\web-store\\public\\shopify\\plantilla5\\product-clean.html';
const content = fs.readFileSync(filePath, 'utf8');

// Find all classes on the body or first wrapper tags
const bodyMatches = content.match(/<body[^>]*class="([^"]*)"/i) || [];
console.log('Original body classes:', bodyMatches[1] || 'None');

// Check first 1000 characters
console.log('HTML HEAD/BODY START:', content.slice(0, 1000));
