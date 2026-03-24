const fs = require('fs');
let c = fs.readFileSync('app/admin/products/page.tsx', 'utf8');
c = c.replace(/bg-white\b/g, 'bg-card')
     .replace(/text-gray-900\b/g, 'text-foreground')
     .replace(/text-gray-500\b/g, 'text-muted-foreground')
     .replace(/text-gray-600\b/g, 'text-muted-foreground')
     .replace(/text-gray-400\b/g, 'text-muted-foreground/80')
     .replace(/bg-gray-50\b/g, 'bg-muted/50')
     .replace(/bg-gray-100\b/g, 'bg-muted')
     .replace(/border-gray-200\b/g, 'border-border')
     .replace(/text-gray-800\b/g, 'text-foreground/90')
     .replace(/text-gray-700\b/g, 'text-foreground/80')
     .replace(/border-gray-100\b/g, 'border-border/50');
fs.writeFileSync('app/admin/products/page.tsx', c);
