import { mount, flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRouter, createWebHistory } from "vue-router";
import App from "../App.vue";
import Dashboard from "../pages/Dashboard.vue";

// shared mock state
let mockPokemons: any[] = [];

vi.mock("@/composables/usePokemonApi", () => {
  return {
    usePokemonApi: () => ({
      pokemons: mockPokemons,
      loading: false,
      error: null,
      fetchAll: vi.fn(),
    }),
  };
});

// router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/dashboard" },
    { path: "/dashboard", component: Dashboard },
  ],
});

describe("App.vue with router", () => {
  beforeEach(async () => {
    mockPokemons = []; // reset before each test
    await router.push("/dashboard");
    await router.isReady();
  });

  it("renders Dashboard with animated Pokémon", async () => {
    mockPokemons = [
      {
        id: 1,
        name: "bulbasaur",
        sprites: {
          front_default: "bulba.png",
          versions: {
            "generation-v": {
              "black-white": { animated: { front_default: "bulba-anim.gif" } },
            },
          },
        },
      },
    ];

    const wrapper = mount(App, { global: { plugins: [router] } });
    await flushPromises();

    const items = wrapper.findAll(".pokemon-item");
    expect(items).toHaveLength(1);
    expect(items[0].text()).toContain("bulbasaur");
    expect(items[0].find("img").attributes("src")).toBe("bulba-anim.gif");
  });
});
