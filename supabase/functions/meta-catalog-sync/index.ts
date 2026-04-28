// Meta (Facebook) Commerce Catalog Sync
// Ürünleri Meta kataloguna senkronize eder
//
// Deploy: supabase functions deploy meta-catalog-sync
// Secrets:
//   supabase secrets set META_ACCESS_TOKEN=EAAe...
//   supabase secrets set META_CATALOG_ID=1461704985580766
//   supabase secrets set META_SITE_URL=https://lumayazilim.com
//   supabase secrets set META_DEFAULT_IMAGE_URL=https://lumayazilim.com/luma.png

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Product type → landing page path mapping
const PRODUCT_TYPE_PATHS: Record<string, string> = {
  vds: '/vds',
  vps: '/vps',
  dedicated: '/dedicated',
  cpanel_hosting: '/linux-hosting',
  plesk_hosting: '/plesk-hosting',
  reseller_hosting: '/reseller-hosting',
  wordpress_hosting: '/wordpress-hosting',
  game_minecraft: '/game-servers',
  game_csgo: '/game-servers',
}

// Product type → open graph image path (on site) - optional overrides
const PRODUCT_TYPE_IMAGES: Record<string, string> = {
  vds: '/og-vds.png',
  vps: '/og-vps.png',
  dedicated: '/og-dedicated.png',
  cpanel_hosting: '/og-hosting.png',
  plesk_hosting: '/og-hosting.png',
  reseller_hosting: '/og-hosting.png',
  wordpress_hosting: '/og-hosting.png',
  game_minecraft: '/og-game.png',
  game_csgo: '/og-game.png',
}

interface ProductPackage {
  id: string
  product_type: string
  name: string
  slug: string
  description: string | null
  price_monthly: number
  currency: string
  is_active: boolean
  cpu_cores: number | null
  ram_gb: number | null
  disk_gb: number | null
  disk_type: string | null
  bandwidth: string | null
  features: string[]
}

function buildDescription(pkg: ProductPackage): string {
  const parts: string[] = []

  if (pkg.description) {
    parts.push(pkg.description)
  } else {
    // Auto-generate from specs
    if (pkg.cpu_cores) parts.push(`${pkg.cpu_cores} vCPU`)
    if (pkg.ram_gb) parts.push(`${pkg.ram_gb} GB RAM`)
    if (pkg.disk_gb && pkg.disk_gb > 0) parts.push(`${pkg.disk_gb} GB ${pkg.disk_type || 'SSD'}`)
    if (pkg.bandwidth) parts.push(`${pkg.bandwidth} Bant Genişliği`)
    if (pkg.features && pkg.features.length > 0) {
      parts.push(pkg.features.slice(0, 3).join(', '))
    }
  }

  const desc = parts.join(' | ')
  return desc.length > 0 ? desc : `${pkg.name} - Luma Yazılım`
}

function buildMetaRequest(pkg: ProductPackage, siteUrl: string, defaultImageUrl: string) {
  const path = PRODUCT_TYPE_PATHS[pkg.product_type] || '/'
  const link = `${siteUrl}${path}`

  // Try type-specific image, fallback to default
  const imagePath = PRODUCT_TYPE_IMAGES[pkg.product_type]
  const imageUrl = imagePath ? `${siteUrl}${imagePath}` : defaultImageUrl

  // Meta price format: decimal with currency code e.g. "129.99 TRY"
  const price = `${pkg.price_monthly.toFixed(2)} ${pkg.currency || 'TRY'}`

  return {
    method: 'UPDATE',
    retailer_id: pkg.slug,
    data: {
      id: pkg.slug,
      title: pkg.name,
      description: buildDescription(pkg),
      availability: pkg.is_active ? 'in stock' : 'out of stock',
      condition: 'new',
      price,
      link,
      image_link: imageUrl,
      brand: 'Luma Yazilim',
    },
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Support both authenticated calls (admin panel) and internal calls (DB trigger)
    const accessToken = Deno.env.get('META_ACCESS_TOKEN')
    const catalogId = Deno.env.get('META_CATALOG_ID') || '1461704985580766'
    const siteUrl = Deno.env.get('META_SITE_URL') || 'https://lumayazilim.com'
    const defaultImageUrl = Deno.env.get('META_DEFAULT_IMAGE_URL') || `${siteUrl}/luma.png`

    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'META_ACCESS_TOKEN secret not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json().catch(() => ({}))
    const mode = body.mode || 'bulk' // 'bulk' | 'single' | 'delete'
    const productId = body.product_id as string | undefined

    let products: ProductPackage[] = []

    if (mode === 'single' && productId) {
      // Sync one product
      const { data, error } = await supabase
        .from('product_packages')
        .select('*')
        .eq('id', productId)
        .single()

      if (error || !data) {
        return new Response(
          JSON.stringify({ success: false, error: 'Product not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      products = [data]
    } else if (mode === 'delete' && productId) {
      // Delete one product from Meta catalog
      const { data } = await supabase
        .from('product_packages')
        .select('slug')
        .eq('id', productId)
        .single()

      const slug = data?.slug || productId
      const deleteRequest = {
        access_token: accessToken,
        item_type: 'PRODUCT_ITEM',
        requests: [{ method: 'DELETE', retailer_id: slug }],
      }

      const metaRes = await fetch(
        `https://graph.facebook.com/v25.0/${catalogId}/items_batch`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deleteRequest),
        }
      )
      const metaData = await metaRes.json()
      console.log('Meta delete response:', JSON.stringify(metaData))

      return new Response(
        JSON.stringify({ success: true, mode: 'delete', slug, meta: metaData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Bulk: fetch all active products
      const { data, error } = await supabase
        .from('product_packages')
        .select('*')
        .eq('is_active', true)
        .order('product_type')
        .order('sort_order')

      if (error) throw error
      products = data || []
    }

    if (products.length === 0) {
      return new Response(
        JSON.stringify({ success: true, synced: 0, message: 'No products to sync' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Meta allows max 5000 items per batch, but keep batches smaller for reliability
    const BATCH_SIZE = 100
    const results: { batch: number; count: number; meta: unknown }[] = []
    let totalSynced = 0
    let hasError = false

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE)
      const requests = batch.map((pkg) => buildMetaRequest(pkg, siteUrl, defaultImageUrl))

      const metaPayload = {
        access_token: accessToken,
        item_type: 'PRODUCT_ITEM',
        requests,
      }

      const metaRes = await fetch(
        `https://graph.facebook.com/v25.0/${catalogId}/items_batch`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metaPayload),
        }
      )

      const metaData = await metaRes.json()
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} response:`, JSON.stringify(metaData))

      if (metaData.error) {
        hasError = true
        console.error('Meta API error:', metaData.error)
      } else {
        totalSynced += batch.length
      }

      results.push({
        batch: Math.floor(i / BATCH_SIZE) + 1,
        count: batch.length,
        meta: metaData,
      })

      // Mark products as synced in DB
      const syncedIds = batch.map((p) => p.id)
      await supabase
        .from('product_packages')
        .update({ meta_synced_at: new Date().toISOString() })
        .in('id', syncedIds)
    }

    return new Response(
      JSON.stringify({
        success: !hasError,
        mode,
        total: products.length,
        synced: totalSynced,
        batches: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('meta-catalog-sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
