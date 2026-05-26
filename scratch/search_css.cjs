const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'styles', 'tailwind.css');
const content = fs.readFileSync(cssPath, 'utf8');
const lines = content.split('\n');

const query = '--reader-page-paper';
console.log(`Searching for "${query}" in tailwind.css...`);

lines.forEach((line, index) => {
  if (line.includes(query)) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
    // Print a few surrounding lines
    const start = Math.max(0, index - 5);
    const end = Math.min(lines.length - 1, index + 10);
    console.log('--- Context ---');
    for (let i = start; i <= end; i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
    console.log('---------------\n');
  }
});
