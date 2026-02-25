const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually to get secrets
const envPath = path.resolve(__dirname, '../.env.local');
let envContent = '';

try {
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    // Fallback to .env
    const fallbackPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(fallbackPath)) {
      console.log('Reading from .env (instead of .env.local)...');
      envContent = fs.readFileSync(fallbackPath, 'utf8');
    } else {
      throw new Error('No .env or .env.local file found');
    }
  }
} catch (err) {
  console.error('Error reading environment files:', err.message);
  process.exit(1);
}

const parseEnv = (key) => {
  const regex = new RegExp(`^${key}=(.*)$`, 'm');
  const match = envContent.match(regex);
  return match ? match[1].trim() : null;
};

const supabaseUrl = parseEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceKey = parseEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in environment file.');
  console.error('Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

// Initialize Supabase Admin Client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKETS = ['subcategories', 'categories', 'products', 'about-photos'];

async function setupBuckets() {
  console.log('Checking Supabase Storage buckets...');
  
  try {
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError.message);
      return;
    }

    const existingNames = existingBuckets.map(b => b.name);
    console.log('Existing buckets:', existingNames.length > 0 ? existingNames.join(', ') : 'None');

    for (const bucket of BUCKETS) {
      if (existingNames.includes(bucket)) {
        console.log(`✅ Bucket '${bucket}' already exists.`);
      } else {
        console.log(`⚠️ Bucket '${bucket}' missing. Creating...`);
        
        const { data, error: createError } = await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        });
        
        if (createError) {
          console.error(`❌ Failed to create bucket '${bucket}':`, createError.message);
        } else {
          console.log(`✅ Successfully created bucket '${bucket}'`);
        }
      }
    }

    console.log('\n--- NEXT STEPS: RLS POLICIES ---');
    console.log('Buckets require Row Level Security (RLS) policies to allow uploads from the application.');
    console.log('If you still encounter permission errors, run the following SQL query in your Supabase SQL Editor:');
    
    console.log('\n```sql');
    BUCKETS.forEach(bucket => {
        console.log(`-- Policies for '${bucket}'`);
        // Policy names must be unique per table, but usually they are scoped to the expression. 
        // Best practice to include bucket name in policy name to avoid confusion if looking at global list.
        console.log(`CREATE POLICY "Public Access ${bucket}" ON storage.objects FOR SELECT TO public USING (bucket_id = '${bucket}');`);
        console.log(`CREATE POLICY "Authenticated Upload ${bucket}" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = '${bucket}');`);
        console.log(`CREATE POLICY "Authenticated Update ${bucket}" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = '${bucket}');`);
        console.log(`CREATE POLICY "Authenticated Delete ${bucket}" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = '${bucket}');`);
        console.log(''); 
    });
    console.log('```\n');

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

setupBuckets();
