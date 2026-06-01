const fs = require('fs');
const path = require('path');

const cssDir = 'C:\\Proyectos\\PROJECT YAXSEL\\web-store\\public\\shopify\\plantilla5\\assets\\css\\pebble-little.myshopify.com\\cdn\\shop\\t\\22\\assets';
const files = fs.readdirSync(cssDir);

console.log('SCANNING CSS FILES FOR OPACITY/DISPLAY RULES IN MAIN CONTAINERS:');
files.forEach(file => {
  if (file.endsWith('.css')) {
    const filePath = path.join(cssDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('page-transition') || content.includes('MainContent') || content.includes('page-loading')) {
      console.log(`- File ${file} matches! Size: ${content.length}`);
      
      // Print matches
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('opacity') || line.includes('display') || line.includes('visibility')) {
          if (line.includes('MainContent') || line.includes('page-') || line.includes('transition')) {
            console.log(`  Line ${idx + 1}: ${line.trim().slice(0, 150)}`);
          }
        }
      });
    }
  }
});
