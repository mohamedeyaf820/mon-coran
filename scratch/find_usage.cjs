const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getFiles(path.join(__dirname, '..', 'src'));
const query = 'ReciterDetailPage';

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes(query)) {
    console.log(`Found in: ${path.relative(path.join(__dirname, '..'), file)}`);
  }
});
