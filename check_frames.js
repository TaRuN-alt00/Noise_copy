const fs = require('fs');
const files = fs.readdirSync('hp-frames').filter(f => f.endsWith('.webp'));
console.log('Total files:', files.length);

// In README.txt:
// frames 0 to ~50: hero (Audira - Modern Harmony)
// frames ~51 to ~105: true clarity
// frames ~106 to ~140: masterbeat
// frames ~141 to ~195: gallery / top picks

