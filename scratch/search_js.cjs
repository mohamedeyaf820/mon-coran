const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'Home', 'ContentSection.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Searching for reciters/recitations inside ContentSection.jsx...`);
lines.forEach((line, index) => {
  if (line.includes('filteredReciters') || line.includes('reciter') || line.includes('Reciter')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
