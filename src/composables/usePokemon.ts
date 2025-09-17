// composables/usePokemon.ts
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

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience?: number;
  sprites: {
    front_default?: string | null;
    front_shiny?: string | null;
    other?: {
      "official-artwork"?: {
        front_default?: string;
        front_shiny?: string;
      };
      dream_world?: {
        front_default?: string;
      };
    };
    versions?: {
      "generation-v"?: {
        "black-white"?: {
          animated?: {
            front_default?: string;
            front_shiny?: string;
          };
        };
      };
    };
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
  species: {
    name: string;
    url: string;
  };
}

export interface PokemonSpecies {
  id: number;
  name: string;
  evolution_chain: {
    url: string;
  };
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string; url: string };
    version: { name: string; url: string };
  }>;
  genera: Array<{
    genus: string;
    language: { name: string; url: string };
  }>;
}

export interface EvolutionChain {
  id: number;
  chain: EvolutionNode;
}

export interface EvolutionNode {
  is_baby: boolean;
  species: { name: string; url: string };
  evolution_details: Array<{
    min_level?: number;
    trigger: { name: string; url: string };
    item?: { name: string; url: string };
    time_of_day?: string;
    [key: string]: any;
  }>;
  evolves_to: EvolutionNode[];
}

export interface LocationArea {
  location_area: {
    name: string;
    url: string;
  };
  version_details: Array<{
    max_chance: number;
    encounter_details: Array<{
      min_level: number;
      max_level: number;
      condition_values: any[];
      chance: number;
      method: { name: string; url: string };
    }>;
    version: { name: string; url: string };
  }>;
}

function extractIdFromUrl(url: string): number {
  const m = url.match(
    /\/(?:pokemon|pokemon-species|evolution-chain)\/(\d+)\/?$/,
  );
  return m ? Number(m[1]) : NaN;
}

// Global cache to prevent duplicate requests
const globalCache = {
  pokemon: new Map<string | number, PokemonDetail>(),
  species: new Map<string | number, PokemonSpecies>(),
  evolution: new Map<string | number, EvolutionChain>(),
  locations: new Map<string | number, LocationArea[]>(),
  allPokemon: null as PokemonSummary[] | null,
};

// Request queue to prevent duplicate concurrent requests
const requestQueue = new Map<string, Promise<any>>();

async function cachedRequest<T>(
  key: string,
  cache: Map<string | number, T>,
  fetcher: () => Promise<T>,
): Promise<T> {
  // Check cache first
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  // Check if request is already in progress
  const cacheKey = `${cache.constructor.name}-${key}`;
  if (requestQueue.has(cacheKey)) {
    return requestQueue.get(cacheKey) as Promise<T>;
  }

  // Make request and cache promise to prevent duplicates
  const promise = fetcher()
    .then((result) => {
      cache.set(key, result);
      requestQueue.delete(cacheKey);
      return result;
    })
    .catch((error) => {
      requestQueue.delete(cacheKey);
      throw error;
    });

  requestQueue.set(cacheKey, promise);
  return promise;
}

export function usePokemonApi() {
  const pokemons = ref<PokemonSummary[]>([]);
  const pokemon = ref<PokemonDetail | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const page = ref<number>(1);
  const pageSize = ref<number>(20);
  const total = ref<number>(0);

  /**
   * Optimized list function with better error handling
   */
  async function list(
    p = page.value,
    ps = pageSize.value,
  ): Promise<PokemonListResponse> {
    loading.value = true;
    error.value = null;

    try {
      const offset = (p - 1) * ps;
      const cacheKey = `list-${offset}-${ps}`;

      const result = await cachedRequest(
        cacheKey,
        new Map(), // Use temporary cache for list requests
        async () => {
          const res = await fetch(
            `${API_BASE}/pokemon?limit=${ps}&offset=${offset}`,
          );
          if (!res.ok) {
            throw new Error(
              `Failed to fetch Pokemon list: ${res.status} ${res.statusText}`,
            );
          }
          return res.json();
        },
      );

      const results: PokemonSummary[] = result.results.map(
        (r: { name: string; url: string }) => ({
          name: r.name,
          url: r.url,
          id: extractIdFromUrl(r.url),
        }),
      );

      pokemons.value = results;
      total.value = result.count ?? results.length;
      page.value = p;
      pageSize.value = ps;

      return {
        count: total.value,
        next: result.next ?? null,
        previous: result.previous ?? null,
        results,
      };
    } catch (err: any) {
      error.value = err?.message ?? String(err);
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
   * Get Pokemon details with caching
   */
  async function get(idOrName: string | number): Promise<PokemonDetail | null> {
    const key = String(idOrName).toLowerCase();

    try {
      const result = await cachedRequest(key, globalCache.pokemon, async () => {
        const res = await fetch(
          `${API_BASE}/pokemon/${encodeURIComponent(key)}`,
        );
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Pokemon "${idOrName}" not found.`);
          }
          throw new Error(
            `Failed to fetch Pokemon: ${res.status} ${res.statusText}`,
          );
        }
        return res.json();
      });

      pokemon.value = result;
      return result;
    } catch (err: any) {
      error.value = err?.message ?? String(err);
      pokemon.value = null;
      return null;
    }
  }

  /**
   * Get Pokemon species data
   */
  async function getSpecies(
    idOrName: string | number,
  ): Promise<PokemonSpecies | null> {
    const key = String(idOrName).toLowerCase();

    try {
      return await cachedRequest(key, globalCache.species, async () => {
        const res = await fetch(
          `${API_BASE}/pokemon-species/${encodeURIComponent(key)}`,
        );
        if (!res.ok) {
          throw new Error(
            `Failed to fetch Pokemon species: ${res.status} ${res.statusText}`,
          );
        }
        return res.json();
      });
    } catch (err: any) {
      error.value = err?.message ?? String(err);
      return null;
    }
  }

  /**
   * Get evolution chain
   */
  async function getEvolutionChain(
    chainId: number,
  ): Promise<EvolutionChain | null> {
    try {
      return await cachedRequest(chainId, globalCache.evolution, async () => {
        const res = await fetch(`${API_BASE}/evolution-chain/${chainId}`);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch evolution chain: ${res.status} ${res.statusText}`,
          );
        }
        return res.json();
      });
    } catch (err: any) {
      error.value = err?.message ?? String(err);
      return null;
    }
  }

  /**
   * Get Pokemon locations
   */
  async function getLocations(
    idOrName: string | number,
  ): Promise<LocationArea[]> {
    const key = String(idOrName).toLowerCase();

    try {
      return await cachedRequest(key, globalCache.locations, async () => {
        const res = await fetch(
          `${API_BASE}/pokemon/${encodeURIComponent(key)}/encounters`,
        );
        if (!res.ok) {
          if (res.status === 404) {
            return []; // No location data available
          }
          throw new Error(
            `Failed to fetch Pokemon locations: ${res.status} ${res.statusText}`,
          );
        }
        return res.json();
      });
    } catch (err: any) {
      error.value = err?.message ?? String(err);
      return [];
    }
  }

  /**
   * Optimized search with debouncing capability
   */
  async function search(
    query: string,
    maxResults = 50,
  ): Promise<PokemonSummary[]> {
    query = (query ?? "").trim().toLowerCase();
    if (!query) return [];

    loading.value = true;
    error.value = null;

    try {
      // Try exact match first
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
    } catch {
      // Continue to fallback search
    }

    try {
      // Use cached all Pokemon list
      if (!globalCache.allPokemon) {
        const head = await fetch(`${API_BASE}/pokemon?limit=1`);
        if (!head.ok) throw new Error(`Failed to fetch Pokemon count`);
        const headJson = await head.json();
        const count = headJson.count ?? 0;

        const listRes = await fetch(
          `${API_BASE}/pokemon?limit=${count}&offset=0`,
        );
        if (!listRes.ok) throw new Error(`Failed to fetch all Pokemon`);
        const listJson = await listRes.json();

        globalCache.allPokemon = listJson.results.map(
          (r: { name: string; url: string }) => ({
            name: r.name,
            url: r.url,
            id: extractIdFromUrl(r.url),
          }),
        );
      }

      const filtered = globalCache.allPokemon
        .filter((p) => p.name.toLowerCase().includes(query))
        .slice(0, maxResults);

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
   * Get complete Pokemon data (details + species + evolution + locations)
   */
  async function getCompletePokemonData(idOrName: string | number) {
    loading.value = true;
    error.value = null;

    try {
      const [pokemonData, speciesData] = await Promise.all([
        get(idOrName),
        getSpecies(idOrName),
      ]);

      if (!pokemonData || !speciesData) {
        throw new Error("Failed to fetch Pokemon data");
      }

      const evolutionChainId = extractIdFromUrl(
        speciesData.evolution_chain.url,
      );
      const [evolutionData, locationData] = await Promise.all([
        getEvolutionChain(evolutionChainId),
        getLocations(idOrName),
      ]);

      return {
        pokemon: pokemonData,
        species: speciesData,
        evolution: evolutionData,
        locations: locationData,
      };
    } catch (err: any) {
      error.value = err?.message ?? String(err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Batch fetch with concurrency control
   */
  async function fetchDetailsForSummaries(
    summaries: PokemonSummary[],
    concurrency = 6,
  ): Promise<PokemonDetail[]> {
    const results: PokemonDetail[] = [];
    const semaphore = new Array(concurrency).fill(null);

    const fetchWorker = async (summary: PokemonSummary) => {
      const cached =
        globalCache.pokemon.get(summary.id) ||
        globalCache.pokemon.get(summary.name.toLowerCase());
      if (cached) {
        results.push(cached);
        return;
      }

      try {
        const detail = await get(summary.id);
        if (detail) {
          results.push(detail);
        }
      } catch {
        // Ignore individual failures
      }
    };

    const queue = [...summaries];
    const workers = semaphore.map(async () => {
      while (queue.length > 0) {
        const summary = queue.shift();
        if (summary) {
          await fetchWorker(summary);
        }
      }
    });

    await Promise.all(workers);
    return results;
  }

  function clearCache() {
    Object.values(globalCache).forEach((cache) => {
      if (cache instanceof Map) {
        cache.clear();
      }
    });
    globalCache.allPokemon = null;
    requestQueue.clear();
  }

  // Computed properties
  const hasList = computed(() => pokemons.value.length > 0);
  const hasPokemon = computed(() => pokemon.value !== null);

  return {
    // State
    pokemons,
    pokemon,
    loading,
    error,
    page,
    pageSize,
    total,
    hasList,
    hasPokemon,

    // Actions
    list,
    get,
    search,
    getSpecies,
    getEvolutionChain,
    getLocations,
    getCompletePokemonData,
    fetchDetailsForSummaries,
    clearCache,
  };
}
