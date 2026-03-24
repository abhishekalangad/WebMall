const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = [
    'app/admin/categories/content.tsx',
    'app/admin/subcategories/page.tsx',
    'app/admin/gallery/page.tsx'
];

files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
        console.log(`Skipping ${file} - not found`);
        return;
    }
    let c = fs.readFileSync(fullPath, 'utf8');
    
    c = c.replace(/bg-white/g, 'bg-card')
         .replace(/bg-gray-50/g, 'bg-muted/50')
         .replace(/bg-gray-100/g, 'bg-muted')
         .replace(/text-gray-900/g, 'text-foreground')
         .replace(/text-gray-800/g, 'text-foreground/90')
         .replace(/text-gray-700/g, 'text-foreground/80')
         .replace(/text-gray-600/g, 'text-muted-foreground')
         .replace(/text-gray-500/g, 'text-muted-foreground')
         .replace(/text-gray-400/g, 'text-muted-foreground/80')
         .replace(/border-gray-100/g, 'border-border/50')
         .replace(/border-gray-200/g, 'border-border')
         .replace(/border-gray-300/g, 'border-border');
         
    fs.writeFileSync(fullPath, c);
    console.log(`Updated ${file}`);
});
