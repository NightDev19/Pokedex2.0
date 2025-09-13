import { ref } from "vue";

const API_URL = "https://pokeapi.co/api/v2/pokemon";

export function usePokemonApi() {
  const pokemons = ref<any[]>([]);
  const pokemon = ref<any | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Fetch all Pokémon by IDs
  async function fetchAll(limit = 20, offset = 0) {
    loading.value = true;
    error.value = null;
    try {
      const promises = [];
      for (let i = offset + 1; i <= offset + limit; i++) {
        promises.push(fetch(`${API_URL}/${i}`).then((res) => res.json()));
      }
      pokemons.value = await Promise.all(promises);
    } catch (err: any) {
      error.value = err.message ?? "Unknown error";
    } finally {
      loading.value = false;
    }
  }

  // Fetch single Pokémon by name or ID
  async function fetchOne(nameOrId: string | number) {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_URL}/${nameOrId}`);
      if (!res.ok) throw new Error(`Failed to fetch pokemon: ${nameOrId}`);
      pokemon.value = await res.json();
    } catch (err: any) {
      error.value = err.message ?? "Unknown error";
    } finally {
      loading.value = false;
    }
  }

  return {
    pokemons,
    pokemon,
    loading,
    error,
    fetchAll,
    fetchOne,
  };
}
