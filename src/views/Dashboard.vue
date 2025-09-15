<!-- src/views/Dashboard.vue -->
<template>
    <div class="p-6">
        <div class="flex items-center gap-4 mb-6">
            <!-- shadcn Input -->
            <Input
                v-model="query"
                placeholder="Search by name or id (press Enter or click Search)"
                @keyup.enter="onSearch"
                class="flex-1 max-w-md"
            />

            <!-- shadcn Button -->
            <Button @click="onSearch" :disabled="loading"> Search </Button>

            <Button variant="ghost" @click="resetList" :disabled="loading">
                Reset
            </Button>
        </div>

        <div v-if="error" class="mb-4 text-red-600">{{ error }}</div>
        <div v-if="loading" class="mb-4">Loading…</div>

        <!-- Grid of cards -->
        <div
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
            <Card
                v-for="p in displayList"
                :key="p.id + '-' + p.name"
                class="flex flex-col items-center p-4"
            >
                <div class="w-full flex justify-center">
                    <img
                        :src="spriteUrl(p.name, p.id)"
                        :alt="p.name"
                        class="w-32 h-32 object-contain select-none pokemon-img"
                        :data-name="p.name"
                        :data-id="p.id"
                        @error="onImageError"
                        loading="lazy"
                    />
                </div>

                <div class="w-full text-center mt-3">
                    <h3 class="font-medium text-lg capitalize">{{ p.name }}</h3>
                    <p class="text-sm text-muted-foreground">#{{ p.id }}</p>
                </div>

                <div class="w-full mt-3 flex gap-2">
                    <Button class="flex-1" size="sm" @click="showDetails(p)">
                        Details
                    </Button>
                    <Button
                        class="flex-1"
                        size="sm"
                        variant="outline"
                        @click="scrollToTop"
                    >
                        Top
                    </Button>
                </div>
            </Card>
        </div>

        <!-- Simple details modal (native) -->
        <div
            v-if="selected"
            class="fixed inset-0 z-50 flex items-center justify-center"
        >
            <div
                class="absolute inset-0 bg-black/40"
                @click="selected = null"
            ></div>
            <div class="bg-white rounded-lg p-6 z-10 max-w-xl w-full">
                <div class="flex justify-between items-start">
                    <h2 class="text-xl font-semibold capitalize">
                        {{ selected.name }}
                    </h2>
                    <button class="ml-4" @click="selected = null">✕</button>
                </div>

                <div class="mt-4 flex gap-6">
                    <img
                        :src="
                            selected.sprites?.front_default ||
                            spriteUrl(selected.name, selected.id)
                        "
                        :alt="selected.name"
                        class="w-32 h-32 object-contain"
                    />
                    <div>
                        <p><strong>ID:</strong> {{ selected.id }}</p>
                        <p><strong>Height:</strong> {{ selected.height }}</p>
                        <p><strong>Weight:</strong> {{ selected.weight }}</p>
                        <p class="mt-2">
                            <strong>Types:</strong>
                            <span
                                v-for="t in selected.types"
                                :key="t.type.name"
                                class="capitalize"
                            >
                                {{ t.type.name
                                }}<span v-if="!isLastType(t)">, </span>
                            </span>
                        </p>
                        <p class="mt-2">
                            <strong>Abilities:</strong>
                            <span
                                v-for="a in selected.abilities"
                                :key="a.ability.name"
                                class="capitalize"
                            >
                                {{ a.ability.name
                                }}<span v-if="!isLastAbility(a)">, </span>
                            </span>
                        </p>
                    </div>
                </div>

                <div class="mt-6 text-right">
                    <Button @click="selected = null">Close</Button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import type { PokemonSummary, PokemonDetail } from "@/composables/usePokemon"; // types exported by your composable
import { usePokemonApi } from "@/composables/usePokemon";

// shadcn-vue components (CLI will place these under src/components/ui/...)
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const {
    pokemons,
    list,
    get,
    search,
    fetchDetailsForSummaries,
    loading,
    error,
} = usePokemonApi();

// UI state
const query = ref("");
const displayList = ref<PokemonSummary[]>([]);
const selected = ref<PokemonDetail | null>(null);

// load Gen 1 (first 151) on mount
onMounted(async () => {
    await list(1, 151);
    displayList.value = pokemons.value.slice();
});

// keep display list in sync if list() is used elsewhere
watch(pokemons, () => {
    if (!query.value) displayList.value = pokemons.value.slice();
});

/**
 * Prefer animated GIF from Pokémon Showdown, fall back to official-artwork PNG.
 *
 * Notes (practical):
 *  - Animated GIFs are not provided by the PokeAPI. Play.PokemonShowdown hosts many animated
 *    sprites at /sprites/ani/<normalized-name>.gif. Normalization here is conservative:
 *    lowercase, spaces -> hyphens, strip non-alphanum/hyphen characters.
 *  - Some edge cases (Nidoran♀/♂, forms like "farfetch'd", or regional forms) may not map perfectly.
 *    in those cases the onImageError fallback will use official artwork by numeric id.
 */
function normalizeNameForGif(name = ""): string {
    return String(name)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-") // spaces to hyphen
        .replace(/[^a-z0-9-]/g, ""); // strip punctuation/unicode (best-effort)
}

function spriteUrl(nameOrNameStr: string | number, id?: number): string {
    // if provided a number-like name (rare here), prefer using the id fallback
    if (
        typeof nameOrNameStr === "number" ||
        (/^\d+$/.test(String(nameOrNameStr)) && id)
    ) {
        // official artwork (static) as fallback; but try GIF by name if we have name separately
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    }

    const name = String(nameOrNameStr);
    const norm = normalizeNameForGif(name);
    // Animated GIF endpoint (preferred)
    return `https://play.pokemonshowdown.com/sprites/ani/${norm}.gif`;
}

/**
 * Error handler: fallback chain
 * 1) If current src was the gif (Play.Showdown), try official-artwork PNG (by data-id)
 * 2) If official-artwork fails, try the basic sprites PNG
 * 3) Final fallback: a tiny transparent 1x1 or local placeholder (you may replace path)
 */
function onImageError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    const current = img.src || "";
    const dataName = img.getAttribute("data-name") || "";
    const dataId = img.getAttribute("data-id") || "";

    // if we were trying GIF from showdown, fallback to official-artwork by id
    if (current.includes("play.pokemonshowdown.com/sprites/ani")) {
        if (dataId) {
            img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dataId}.png`;
            return;
        }
        // if id missing, try non-official sprite by normalized name
        const norm = normalizeNameForGif(dataName);
        img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${norm}.png`;
        return;
    }

    // if we were trying official-artwork and failed, try the basic sprite by numeric id
    if (current.includes("official-artwork")) {
        if (dataId) {
            img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dataId}.png`;
            return;
        }
    }

    // final fallback - transparent placeholder (replace with your project's image if desired)
    img.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="; // 1x1 gif
}

/* helpers used by the modal */
function isLastType(t: any) {
    return selected.value?.types?.[selected.value.types.length - 1] === t;
}
function isLastAbility(a: any) {
    return (
        selected.value?.abilities?.[selected.value.abilities.length - 1] === a
    );
}

/* search / list / show details unchanged logic */
async function onSearch() {
    const q = (query.value || "").trim();
    if (!q) {
        await list(1, 151);
        displayList.value = pokemons.value.slice();
        return;
    }

    const results = await search(q, 151);
    displayList.value = results;
}

function resetList() {
    query.value = "";
    list(1, 151).then(() => (displayList.value = pokemons.value.slice()));
}

async function showDetails(s: PokemonSummary) {
    const details = await get(s.id || s.name);
    if (details) selected.value = details;
    else {
        const arr = await fetchDetailsForSummaries([s], 1);
        selected.value = arr[0] || null;
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}
</script>

<style scoped>
/* You can add small tweaks here. Primary layout uses Tailwind. */
.text-muted-foreground {
    color: rgba(100, 116, 139, 1);
}

/* Subtle float animation + hover lift for Pokémon images. Respect users who prefer reduced motion. */
@keyframes float-slow {
    0% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-6px);
    }
    100% {
        transform: translateY(0);
    }
}

.pokemon-img {
    transition:
        transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
        filter 220ms;
    will-change: transform;
    animation: float-slow 3.8s ease-in-out infinite;
}

.pokemon-img:hover {
    transform: translateY(-6px) scale(1.04);
    filter: drop-shadow(0 8px 18px rgba(15, 23, 42, 0.08));
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
    .pokemon-img {
        animation: none !important;
        transition: none !important;
    }
}
</style>
