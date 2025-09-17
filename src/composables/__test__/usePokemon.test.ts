// src/composables/__test__/usePokemon.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePokemonApi } from "../usePokemon";

// mock global fetch
global.fetch = vi.fn();

describe("usePokemonApi composable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists pokemons (paginated)", async () => {
    (fetch as unknown as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        count: 2,
        results: [
          { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" },
          { name: "ivysaur", url: "https://pokeapi.co/api/v2/pokemon/2/" },
        ],
      }),
    });

    const { list, pokemons, total } = usePokemonApi();
    const res = await list(1, 2);

    expect(res.count).toBe(2);
    expect(pokemons.value.length).toBe(2);
    expect(pokemons.value[0].name).toBe("bulbasaur");
    expect(pokemons.value[0].id).toBe(1);
    expect(total.value).toBe(2);
  });

  it("fetches a single pokemon by id", async () => {
    const mockPokemon = {
      id: 1,
      name: "bulbasaur",
      height: 7,
      weight: 69,
      sprites: {},
      types: [],
      abilities: [],
      stats: [],
      moves: [],
    };

    (fetch as unknown as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPokemon,
    });

    const { get, pokemon } = usePokemonApi();
    const res = await get(1);

    expect(res).toEqual(mockPokemon);
    expect(pokemon.value).toEqual(mockPokemon);
  });

  it("searches a pokemon by exact name", async () => {
    const mockPokemon = {
      id: 1,
      name: "bulbasaur",
      height: 7,
      weight: 69,
      sprites: {},
      types: [],
      abilities: [],
      stats: [],
      moves: [],
    };

    (fetch as unknown as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPokemon,
    });

    const { search } = usePokemonApi();
    const results = await search("bulbasaur");

    expect(results[0].name).toBe("bulbasaur");
    expect(results[0].id).toBe(1);
  });

  it("handles search fallback with substring", async () => {
    // 1) get(query) fails
    // 2) head fetch
    // 3) full list fetch
    (fetch as unknown as vi.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 2 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" },
            { name: "ivysaur", url: "https://pokeapi.co/api/v2/pokemon/2/" },
          ],
        }),
      });

    const { search } = usePokemonApi();
    const results = await search("saur");

    expect(results.length).toBe(2);
    expect(results[0].name).toContain("saur");
  });

  it("returns empty on search if no match", async () => {
    // 1) get(query) fails
    // 2) head fetch
    // 3) full list fetch returns empty
    (fetch as unknown as vi.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
        }),
      });

    const { search } = usePokemonApi();
    const results = await search("notapokemon");

    expect(results.length).toBe(0);
  });

  it("clearCache empties the cache indirectly", async () => {
    const mockPokemon = {
      id: 1,
      name: "bulbasaur",
      height: 7,
      weight: 69,
      sprites: {},
      types: [],
      abilities: [],
      stats: [],
      moves: [],
    };

    // 1st fetch for get()
    (fetch as unknown as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPokemon,
    });

    const { get, clearCache } = usePokemonApi();
    const first = await get(1);

    expect(first).toEqual(mockPokemon);

    // clear the cache
    clearCache();

    // 2nd fetch after clearing, must call fetch again
    (fetch as unknown as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPokemon,
    });

    const second = await get(1);

    expect(second).toEqual(mockPokemon);

    // fetch should have been called twice (once before and once after clearCache)
    expect((fetch as unknown as vi.Mock).mock.calls.length).toBe(2);
  });
});
