// Builds a 360×180 binary land mask from the TopoJSON world data at runtime.
// Used to accurately validate whether a lat/lon is on land.

let maskCache: Uint8Array | null = null
let maskPromise: Promise<Uint8Array> | null = null

export async function getLandMask(): Promise<Uint8Array> {
  if (maskCache) return maskCache
  if (!maskPromise) maskPromise = buildMask().then(m => { maskCache = m; return m })
  return maskPromise
}

export function isOnLand(lat: number, lon: number, mask: Uint8Array): boolean {
  const x = Math.max(0, Math.min(359, Math.floor(((lon + 180) % 360 + 360) % 360)))
  const y = Math.max(0, Math.min(179, Math.floor(90 - lat)))
  return mask[y * 360 + x] === 1
}

async function buildMask(): Promise<Uint8Array> {
  const W = 360, H = 180
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)

  const [topojson, d3geo, worldData] = await Promise.all([
    import('topojson-client'),
    import('d3-geo'),
    fetch('/world-110m.json').then(r => r.json()),
  ])

  const proj = d3geo.geoEquirectangular()
    .scale(W / (2 * Math.PI))
    .translate([W / 2, H / 2])

  const path = d3geo.geoPath(proj, ctx)
  const land = topojson.feature(worldData, worldData.objects.land)
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  path(land as Parameters<typeof path>[0])
  ctx.fill()

  const img = ctx.getImageData(0, 0, W, H).data
  const mask = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) mask[i] = img[i * 4] > 64 ? 1 : 0
  return mask
}
