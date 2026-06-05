const fs = require('fs');
const glob = require('fs'); // simple enough just to read dir or hardcoded files
const path = require('path');

const files = [
    'e:/mon coran/src/components/AudioPlayer.jsx',
    'e:/mon coran/src/components/HomePage.jsx',
    'e:/mon coran/src/App.jsx'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let text = fs.readFileSync(file, 'utf8');
        let newText = text
            .replace(/â”€/g, '─')
            .replace(/â•/g, '═')
            .replace(/â”‚/g, '│')
            .replace(/â””/g, '└')
            .replace(/â”¼/g, '┼')
            .replace(/â”¬/g, '┬')
            .replace(/â”´/g, '┴')
            .replace(/â”œ/g, '├')
            .replace(/â”¤/g, '┤')
            .replace(/Ã©/g, 'é')
            .replace(/Ã¨/g, 'è')
            .replace(/Ã/g, 'à'); // Careful, 'Ã ' is a, 'Ã' alone could be dangerous
        if (text !== newText) {
            fs.writeFileSync(file, newText, 'utf8');
            console.log('Fixed mojibake in', file);
        }
    }
});