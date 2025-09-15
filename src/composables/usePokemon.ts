// usePokemon.ts
// Vue 3 composable (TypeScript) for interacting with the PokeAPI.
// Exposes: list, search, get (single), pokemons, pokemon, loading, error, page, pageSize, total, clearCache
//
// Notes (be skeptical): PokeAPI does not provide a substring search endpoint. `search` will first try an exact-name lookup
// (cheap). If that fails it will fetch the list of all pokemon names (one request) and filter locally — this is the
// practical tradeoff but can be heavy if you repeatedly do broad searches. Consider server-side indexing or a cached
// name-list if you need frequent substring search in production.

import { ref, computed } from "vue";

const API_BASE = "https://pokeapi.co/api/v2";

export type PokemonSummary = {
  name: string;
  url: string;
  id: number;
};

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonSummary[];
}

/**
 * A pragmatic, fairly-complete typing for the parts of a Pokemon detail most apps need.
 * Extend as necessary.
 */
export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience?: number;
  sprites: {
    front_default?: string | null;
    [key: string]: any;
  };
  types: Array<{ slot: number; type: { name: string; url: string } }>;
  abilities: Array<{
    is_hidden: boolean;
    slot: number;
    ability: { name: string; url: string };
  }>;
  stats: Array<{
    base_stat: number;
    effort: number;
    stat: { name: string; url: string };
  }>;
  moves: Array<{
    move: { name: string; url: string };
    version_group_details?: any[];
  }>;
  // add more fields if you need them
}

function extractIdFromUrl(url: string): number {
  // urls look like https://pokeapi.co/api/v2/pokemon/1/
  const m = url.match(/\/pokemon\/(\d+)\/?$/);
  return m ? Number(m[1]) : NaN;
}

/**
 * usePokemonApi
 *
 * - list(page?, pageSize?) -> returns paginated list (pokemon name + url + id)
 * - get(idOrName) -> fetches full PokemonDetail
 * - search(query) -> tries exact lookup first, otherwise fetches all names and filters locally
 *
 * Returned reactive values: pokemons, pokemon, loading, error, total, page, pageSize
 */
export function usePokemonApi() {
  // reactive state
  const pokemons = ref<PokemonSummary[]>([]);
  const pokemon = ref<PokemonDetail | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const page = ref<number>(1);
  const pageSize = ref<number>(20);
  const total = ref<number>(0);

  // internal cache for details to avoid repeated network calls
  const detailCache = new Map<number | string, PokemonDetail>();

  /**
   * list - paginated list of pokemon (does NOT include full details)
   * @param p page number (1-based)
   * @param ps page size (limit)
   */
  async function list(
    p = page.value,
    ps = pageSize.value,
  ): Promise<PokemonListResponse> {
    loading.value = true;
    error.value = null;

    const offset = (p - 1) * ps;
    try {
      const res = await fetch(
        `${API_BASE}/pokemon?limit=${ps}&offset=${offset}`,
      );
      if (!res.ok)
        throw new Error(`PokeAPI list failed: ${res.status} ${res.statusText}`);

      const raw = await res.json();
      // raw.results is array of { name, url }
      const results: PokemonSummary[] = raw.results.map(
        (r: { name: string; url: string }) => {
          const id = extractIdFromUrl(r.url);
          return {
            name: r.name,
            url: r.url,
            id: Number.isFinite(id) ? id : -1,
          };
        },
      );

      pokemons.value = results;
      total.value = raw.count ?? results.length;
      page.value = p;
      pageSize.value = ps;

      return {
        count: total.value,
        next: raw.next ?? null,
        previous: raw.previous ?? null,
        results,
      };
    } catch (err: any) {
      error.value = err?.message ?? String(err);
      // keep previous pokemons if any — caller can decide to clear
      return {
        count: total.value,
        next: null,
        previous: null,
        results: pokemons.value,
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * get - fetch full PokemonDetail by id or name
   * Uses cache if available.
   */
  async function get(idOrName: string | number): Promise<PokemonDetail | null> {
    const key = String(idOrName).toLowerCase();
    if (detailCache.has(key)) {
      pokemon.value = detailCache.get(key)!;
      return pokemon.value;
    }

    loading.value = true;
    error.value = null;

    try {
      const res = await fetch(
        `${API_BASE}/pokemon/${encodeURIComponent(String(idOrName).toLowerCase())}`,
      );
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Pokemon "${idOrName}" not found.`);
        }
        throw new Error(`PokeAPI get failed: ${res.status} ${res.statusText}`);
      }
      const data: PokemonDetail = await res.json();
      // cache under numeric id and name
      detailCache.set(data.id, data);
      detailCache.set(data.name.toLowerCase(), data);
      pokemon.value = data;
      return data;
    } catch (err: any) {
      error.value = err?.message ?? String(err);
      pokemon.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * search - first tries an exact lookup (cheap). If not found, falls back to fetching the
   * entire pokemon-name index once and performing a case-insensitive substring filter.
   *
   * Warning: fallback requires fetching ALL pokemon names (one request with limit=count).
   * This is still preferable to many small requests, but it can be heavy on first use.
   *
   * @param query substring to search for
   * @param maxResults maximum number of results to return (default 50)
   */
  async function search(
    query: string,
    maxResults = 50,
  ): Promise<PokemonSummary[]> {
    query = (query ?? "").trim().toLowerCase();
    if (!query) return [];

    loading.value = true;
    error.value = null;

    // 1) try exact name or numeric id fetch
    try {
      // If query is purely numeric, try numeric fetch first
      if (/^\d+$/.test(query)) {
        const byId = await get(Number(query));
        if (byId) {
          return [
            {
              name: byId.name,
              url: `${API_BASE}/pokemon/${byId.id}/`,
              id: byId.id,
            },
          ];
        }
        // fallthrough to name-based search
      } else {
        const byName = await get(query);
        if (byName) {
          return [
            {
              name: byName.name,
              url: `${API_BASE}/pokemon/${byName.id}/`,
              id: byName.id,
            },
          ];
        }
      }
    } catch (err) {
      // swallow — we'll do fallback search
    } finally {
      // note: get() toggles loading; we want to remain in loading while fallback may run,
      // so ensure loading remains true below.
      loading.value = true;
      error.value = null;
    }

    // 2) fallback: fetch *all* names and filter locally (one request)
    try {
      // get count first
      const head = await fetch(`${API_BASE}/pokemon?limit=1`);
      if (!head.ok) throw new Error(`PokeAPI head failed: ${head.statusText}`);
      const headJson = await head.json();
      const count = headJson.count ?? 0;

      // fetch entire list
      const listRes = await fetch(
        `${API_BASE}/pokemon?limit=${count}&offset=0`,
      );
      if (!listRes.ok)
        throw new Error(`PokeAPI full list failed: ${listRes.statusText}`);
      const listJson = await listRes.json();
      const all: PokemonSummary[] = listJson.results.map(
        (r: { name: string; url: string }) => {
          const id = extractIdFromUrl(r.url);
          return {
            name: r.name,
            url: r.url,
            id: Number.isFinite(id) ? id : -1,
          };
        },
      );

      const filtered = all
        .filter((p) => p.name.toLowerCase().includes(query))
        .slice(0, maxResults);
      // optionally set pokemons.value to the filtered subset so UI can bind to it
      pokemons.value = filtered;
      total.value = filtered.length;
      return filtered;
    } catch (err: any) {
      error.value = err?.message ?? String(err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * fetchAllDetails - utility to fetch details for a list of summaries (with concurrency limit).
   * Useful if you need full details for the visible page.
   */
  async function fetchDetailsForSummaries(
    summaries: PokemonSummary[],
    concurrency = 6,
  ): Promise<PokemonDetail[]> {
    // naive concurrency limiter
    const results: PokemonDetail[] = [];
    const queue = [...summaries];

    async function worker() {
      while (queue.length) {
        const s = queue.shift();
        if (!s) break;
        const cached =
          detailCache.get(s.id) || detailCache.get(s.name.toLowerCase());
        if (cached) {
          results.push(cached);
          continue;
        }
        try {
          const res = await fetch(`${API_BASE}/pokemon/${s.id}`);
          if (!res.ok) continue;
          const data: PokemonDetail = await res.json();
          detailCache.set(data.id, data);
          detailCache.set(data.name.toLowerCase(), data);
          results.push(data);
        } catch {
          // ignore single failures
        }
      }
    }

    const workers = Array.from({ length: Math.max(1, concurrency) }, () =>
      worker(),
    );
    await Promise.all(workers);
    return results;
  }

  function clearCache() {
    detailCache.clear();
  }

  // convenience computed: whether there's at least one pokemon loaded in list
  const hasList = computed(() => pokemons.value.length > 0);
  const hasPokemon = computed(() => pokemon.value !== null);

  return {
    // state
    pokemons,
    pokemon,
    loading,
    error,
    page,
    pageSize,
    total,
    hasList,
    hasPokemon,
    // actions
    list,
    get,
    search,
    fetchDetailsForSummaries,
    clearCache,
  };
}
