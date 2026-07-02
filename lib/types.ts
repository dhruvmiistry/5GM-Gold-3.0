export interface DbVideo {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  duration: number | null
  category: string | null
  release_date: string | null
  created_at: string
  analyst_name: string | null
  mux_playback_id: string | null
  processing_status: 'none' | 'preparing' | 'ready' | 'errored'
}
