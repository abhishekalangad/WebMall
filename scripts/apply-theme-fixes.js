const fs = require('fs');
const path = require('path');

const files = [
    'app/admin/products/page.tsx',
    'app/admin/categories/content.tsx',
    'app/admin/subcategories/page.tsx',
    'app/admin/gallery/page.tsx',
    'app/admin/analytics/content.tsx',
    'app/admin/coupons/page.tsx',
    'app/admin/inventory/page.tsx',
    'app/admin/orders/page.tsx',
    'app/admin/page.tsx', 
    'app/admin/users/page.tsx', 
    'app/admin/users/[id]/page.tsx', 
    'app/admin/settings/page.tsx', 
    'app/admin/messages/ContactMessagesView.tsx',
    'app/admin/messages/page.tsx',
    'components/admin/Sidebar.tsx',
    'components/admin/Header.tsx',
    'components/admin/ProductVariants.tsx'
];

files.forEach(file => {
    // Get absolute path from the root directory
    const fullPath = path.join(__dirname, '..', file);
    
    if (!fs.existsSync(fullPath)) {
        console.log(`Skipping ${file} - not found`);
        return;
    }
    
    let c = fs.readFileSync(fullPath, 'utf8');
    
    // Replace all hardcoded tailwind colors with theme variables using word boundaries
    c = c.replace(/bg-white\b/g, 'bg-card')
         .replace(/bg-gray-50\b/g, 'bg-muted/50')
         .replace(/bg-gray-100\b/g, 'bg-muted')
         .replace(/text-gray-900\b/g, 'text-foreground')
         .replace(/text-gray-800\b/g, 'text-foreground/90')
         .replace(/text-gray-700\b/g, 'text-foreground/80')
         .replace(/text-gray-600\b/g, 'text-muted-foreground')
         .replace(/text-gray-500\b/g, 'text-muted-foreground')
         .replace(/text-gray-400\b/g, 'text-muted-foreground/80')
         .replace(/border-gray-100\b/g, 'border-border/50')
         .replace(/border-gray-200\b/g, 'border-border')
         .replace(/border-gray-300\b/g, 'border-border');
         
    fs.writeFileSync(fullPath, c);
    console.log(`Updated ${file}`);
});
