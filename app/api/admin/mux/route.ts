import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mux } from '@/lib/mux'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

// Create a direct upload URL
export async function POST(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { corsOrigin } = await request.json().catch(() => ({ corsOrigin: '*' }))

  const upload = await mux.video.uploads.create({
    cors_origin: corsOrigin || '*',
    new_asset_settings: {
      playback_policy: ['public'],
      mp4_support: 'capped-1080p',
    },
  })

  return NextResponse.json({ uploadId: upload.id, uploadUrl: upload.url })
}

// Get asset status by upload ID or asset ID
export async function GET(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const uploadId = searchParams.get('uploadId')
  const assetId = searchParams.get('assetId')

  if (uploadId) {
    const upload = await mux.video.uploads.retrieve(uploadId)
    let asset = null
    if (upload.asset_id) {
      asset = await mux.video.assets.retrieve(upload.asset_id)
    }
    return NextResponse.json({ upload, asset })
  }

  if (assetId) {
    const asset = await mux.video.assets.retrieve(assetId)
    return NextResponse.json({ asset })
  }

  return NextResponse.json({ error: 'Missing uploadId or assetId' }, { status: 400 })
}

// Delete a Mux asset and update DB
export async function DELETE(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { videoId, muxAssetId } = await request.json()

  if (muxAssetId) {
    try {
      await mux.video.assets.delete(muxAssetId)
    } catch {
      // Asset may already be gone
    }
  }

  if (videoId) {
    const admin = createAdminClient()
    await admin.from('videos').delete().eq('id', videoId)
  }

  return NextResponse.json({ success: true })
}
