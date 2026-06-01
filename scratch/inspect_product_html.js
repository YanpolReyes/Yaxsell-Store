const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Proyectos\\PROJECT YAXSEL\\web-store\\public\\shopify\\plantilla5\\product-clean.html';
const content = fs.readFileSync(filePath, 'utf8');

console.log('HTML FILE SIZE:', content.length);
console.log('CONTAINS MainContent:', content.includes('MainContent'));
console.log('CONTAINS product-media:', content.includes('product-media'));
console.log('CONTAINS product__info-container:', content.includes('product__info-container'));

// Check for any inline styles that hide elements
const styleTags = content.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
console.log('Total style tags found:', styleTags.length);
styleTags.forEach((tag, i) => {
  if (tag.includes('opacity') || tag.includes('display') || tag.includes('visibility')) {
    console.log(`Style Tag ${i + 1} contains hide-like rules:`, tag.slice(0, 300) + '...');
  }
});
