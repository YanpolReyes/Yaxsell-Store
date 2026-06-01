const fs = require('fs');
const path = require('path');

function walk(dir, results = []) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        walk(fullPath, results);
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.json')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('progressbar-autoplay')) {
          results.push({ path: fullPath, matches: true });
        }
      }
    }
  });
  return results;
}

const matches = walk('C:\\Proyectos\\PROJECT YAXSEL\\web-store');
console.log('MATCHES FOUND FOR progressbar-autoplay:', JSON.stringify(matches, null, 2));
