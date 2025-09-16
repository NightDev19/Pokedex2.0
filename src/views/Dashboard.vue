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
                class="flex flex-col items-center p-4 card"
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
                    <!-- pass event to capture img.src -->
                    <Button
                        class="flex-1"
                        size="sm"
                        @click="showDetails(p, $event)"
                    >
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
                            selectedImg || spriteUrl(selected.name, selected.id)
                        "
                        :alt="selected.name"
                        class="w-32 h-32 object-contain pokemon-img"
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
import type { PokemonSummary, PokemonDetail } from "@/composables/usePokemon";
import { usePokemonApi } from "@/composables/usePokemon";

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
const selectedImg = ref<string | null>(null); // NEW: store clicked image src

// load Gen 1 (first 151) on mount
onMounted(async () => {
    await list(1, 151);
    displayList.value = pokemons.value.slice();
});

watch(pokemons, () => {
    if (!query.value) displayList.value = pokemons.value.slice();
});

/**
 * Sprite source strategy:
 *  - Prefer animated GIF from PokeAPI's "versions/generation-v/black-white/animated"
 *  - Fallback: official-artwork PNG
 */
function spriteUrl(nameOrNameStr: string | number, id?: number): string {
    if (
        typeof nameOrNameStr === "number" ||
        (/^\d+$/.test(String(nameOrNameStr)) && id)
    ) {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    }
    const normId = id || String(nameOrNameStr);
    // Animated sprite (BW gen V animated set)
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${normId}.gif`;
}

function onImageError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    const current = img.src || "";
    const dataId = img.getAttribute("data-id") || "";

    if (current.includes("/animated/")) {
        if (dataId) {
            img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dataId}.png`;
            return;
        }
    }

    if (current.includes("official-artwork")) {
        if (dataId) {
            img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dataId}.png`;
            return;
        }
    }

    img.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
}

function isLastType(t: any) {
    return selected.value?.types?.[selected.value.types.length - 1] === t;
}
function isLastAbility(a: any) {
    return (
        selected.value?.abilities?.[selected.value.abilities.length - 1] === a
    );
}

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

// UPDATED: capture clicked card image source
async function showDetails(s: PokemonSummary, ev: Event) {
    const imgEl = (ev.currentTarget as HTMLElement)
        ?.closest(".card")
        ?.querySelector("img") as HTMLImageElement | null;

    if (imgEl) {
        selectedImg.value = imgEl.src;
    } else {
        selectedImg.value = null;
    }

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
.text-muted-foreground {
    color: rgba(100, 116, 139, 1);
}

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

    /* NEW: make sprites sharp instead of blurry */
    image-rendering: pixelated;
    image-rendering: crisp-edges; /* fallback */
}

.pokemon-img:hover {
    transform: translateY(-6px) scale(1.04);
    filter: drop-shadow(0 8px 18px rgba(15, 23, 42, 0.08));
}

@media (prefers-reduced-motion: reduce) {
    .pokemon-img {
        animation: none !important;
        transition: none !important;
    }
}
</style>
