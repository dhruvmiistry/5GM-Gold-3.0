import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac } from 'crypto'

function verifyMuxSignature(body: string, signature: string, secret: string): boolean {
  try {
    const parts = Object.fromEntries(signature.split(',').map(p => p.split('=')))
    const timestamp = parts['t']
    const v1 = parts['v1']
    if (!timestamp || !v1) return false
    const payload = `${timestamp}.${body}`
    const expected = createHmac('sha256', secret).update(payload).digest('hex')
    return expected === v1
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('mux-signature') ?? ''

  if (!verifyMuxSignature(body, signature, process.env.MUX_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  const admin = createAdminClient()

  if (event.type === 'video.asset.ready') {
    const asset = event.data
    const playbackId = asset.playback_ids?.[0]?.id
    if (!playbackId) return NextResponse.json({ received: true })

    await admin
      .from('videos')
      .update({
        mux_asset_id: asset.id,
        mux_playback_id: playbackId,
        processing_status: 'ready',
        duration: asset.duration ? formatDuration(asset.duration) : null,
      })
      .eq('mux_upload_id', asset.upload_id)
  }

  if (event.type === 'video.asset.errored') {
    await admin
      .from('videos')
      .update({ processing_status: 'errored' })
      .eq('mux_upload_id', event.data.upload_id)
  }

  return NextResponse.json({ received: true })
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
