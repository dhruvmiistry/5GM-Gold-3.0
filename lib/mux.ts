import Mux from '@mux/mux-node'

export const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

export function muxThumbnailUrl(playbackId: string, time = 0) {
  return `https://image.mux.com/${playbackId}/thumbnail.png?time=${time}`
}

export function muxAnimatedUrl(playbackId: string) {
  return `https://image.mux.com/${playbackId}/animated.gif`
}
