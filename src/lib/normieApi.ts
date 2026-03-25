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

const API_BASE = 'https://api.normies.art'
const MAX_ID = 9999

// Normies NFT contract address on Ethereum mainnet (verified on OpenSea)
export const NORMIES_CONTRACT = '0x9eb6e2025b64f340691e424b7fe7022ffde12438'

export function getOpenseaUrl(id: number): string {
  return `https://opensea.io/assets/ethereum/${NORMIES_CONTRACT}/${id}`
}

const BATCH_SIZE = 50
const BATCH_DELAY_MS = 80  // faster loading (80ms between batches of 50)

const TYPE_CACHE = new Map<number, NormieMetadata>()

/** Fetch ALL burned token IDs from /history/burned-tokens (paginated) */
export async function fetchBurnedTokenIds(): Promise<Set<number>> {
  const result = new Set<number>()
  const PAGE = 100
  let offset = 0
  try {
    while (true) {
      const res = await fetch(`${API_BASE}/history/burned-tokens?limit=${PAGE}&offset=${offset}`)
      if (!res.ok) break
      const data: unknown[] = await res.json()
      if (!Array.isArray(data) || data.length === 0) break
      for (const d of data) {
        const raw = (d as Record<string, unknown>).tokenId ?? (d as Record<string, unknown>).id
        const id = typeof raw === 'number' ? raw : parseInt(String(raw), 10)
        if (!isNaN(id)) result.add(id)
      }
      if (data.length < PAGE) break
      offset += PAGE
    }
  } catch {
    // return whatever we collected so far
  }
  return result
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

