export type NormieType = 'Human' | 'Alien' | 'Cat' | 'Agent'

export interface NormieMetadata {
  id: number
  name: string
  type: NormieType
  gender: string
  attributes: { trait_type: string; value: string }[]
  imageUrl: string
  isThe100: boolean
}

export interface NormiePosition {
  x: number
  z: number
  targetX: number
  targetZ: number
}

const API_BASE = 'https://api.normies.art'
const MAX_ID = 8888

// Normies NFT contract address on Ethereum mainnet (verified on OpenSea)
export const NORMIES_CONTRACT = '0x9eb6e2025b64f340691e424b7fe7022ffde12438'

export function getOpenseaUrl(id: number): string {
  return `https://opensea.io/assets/ethereum/${NORMIES_CONTRACT}/${id}`
}

export async function fetchNormieHolder(id: number): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/normie/${id}/holder`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    if (typeof data === 'string') return data
    return data.holder ?? data.owner ?? data.address ?? null
  } catch {
    return null
  }
}
const BATCH_SIZE = 50
const BATCH_DELAY_MS = 80  // faster loading (80ms between batches of 50)

const TYPE_CACHE = new Map<number, NormieMetadata>()

/** Fetch burned token IDs from /history/burned-tokens */
export async function fetchBurnedTokenIds(): Promise<Set<number>> {
  try {
    const res = await fetch(`${API_BASE}/history/burned-tokens`)
    if (!res.ok) return new Set()
    const data = await res.json()
    const ids = Array.isArray(data)
      ? data.map((d: unknown) => typeof d === 'number' ? d : (d as Record<string, number>).id ?? (d as Record<string, number>).tokenId)
      : []
    return new Set(ids.filter((id: unknown) => typeof id === 'number') as number[])
  } catch {
    return new Set()
  }
}

/** Fetch all valid (non-burned) normie IDs */
export async function fetchAllNormieIds(): Promise<number[]> {
  const burned = await fetchBurnedTokenIds()
  const ids: number[] = []
  for (let i = 0; i <= MAX_ID; i++) {
    if (!burned.has(i)) ids.push(i)
  }
  return ids
}

/** Fetch single normie traits with retry on 429 */
export async function fetchNormieTrait(id: number): Promise<NormieMetadata | null> {
  if (TYPE_CACHE.has(id)) return TYPE_CACHE.get(id)!

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/normie/${id}/traits`)
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }
      if (!res.ok) return null
      const data = await res.json()
      // API may return a plain array, or { traits: [...] }, or { attributes: [...] }
      const traits: { trait_type: string; value: string }[] =
        Array.isArray(data) ? data : (data.traits ?? data.attributes ?? [])
      const typeAttr = traits.find(t =>
        t.trait_type === 'Type' || t.trait_type === 'type'
      )
      const genderAttr = traits.find(t =>
        t.trait_type === 'Gender' || t.trait_type === 'gender'
      )
      const rawType: string = typeAttr?.value ?? 'Human'
      // THE100 is a flag determined by other traits — never a Type value
      const isThe100 = traits.some(t =>
        String(t.value).toLowerCase().includes('the100') ||
        String(t.trait_type).toLowerCase().includes('the100')
      )
      const normie: NormieMetadata = {
        id,
        name: `Normie #${id}`,
        type: (['Human', 'Alien', 'Cat', 'Agent'].includes(rawType) ? rawType : 'Human') as NormieType,
        gender: genderAttr?.value || 'Unknown',
        attributes: traits,
        imageUrl: `${API_BASE}/normie/${id}/image.png`,
        isThe100,
      }
      TYPE_CACHE.set(id, normie)
      return normie
    } catch {
      await new Promise(r => setTimeout(r, 500))
    }
  }
  return null
}

/** Legacy alias */
export async function fetchNormieMetadata(id: number): Promise<NormieMetadata | null> {
  return fetchNormieTrait(id)
}

/** Batch loader with progress callback (streaming) */
export async function fetchBatchNormies(
  ids: number[],
  onProgress?: (loaded: number, total: number) => void,
  onBatchReady?: (normies: NormieMetadata[]) => void,
): Promise<NormieMetadata[]> {
  const allResults: NormieMetadata[] = []
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map(id => fetchNormieTrait(id)))
    const valid = results.filter(Boolean) as NormieMetadata[]
    allResults.push(...valid)
    onBatchReady?.(valid)
    onProgress?.(Math.min(i + BATCH_SIZE, ids.length), ids.length)
    await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
  }
  return allResults
}

/** Legacy: get initial set of IDs (first MAX_ID+1) */
export function getInitialNormieIds(): number[] {
  const ids: number[] = []
  for (let i = 0; i <= MAX_ID; i++) {
    ids.push(i)
  }
  return ids
}
