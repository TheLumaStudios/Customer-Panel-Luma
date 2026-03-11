// Script to create invoices storage bucket
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createInvoicesBucket() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'invoices')

    if (bucketExists) {
      console.log('✅ Invoices bucket already exists')
      return
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('invoices', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    })

    if (error) {
      console.error('Error creating bucket:', error)
      return
    }

    console.log('✅ Invoices bucket created successfully:', data)
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createInvoicesBucket()
