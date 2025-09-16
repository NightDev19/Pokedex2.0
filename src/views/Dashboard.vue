<!-- src/views/Dashboard.vue -->
<template>
    <div class="p-6">
        <div class="flex items-center gap-4 mb-6">
            <Input
                v-model="query"
                placeholder="Search by name or id (press Enter or click Search)"
                @keyup.enter="onSearch"
                class="flex-1 max-w-md"
            />
            <Button @click="onSearch" :disabled="loading">Search</Button>
            <Button variant="ghost" @click="resetList" :disabled="loading"
                >Reset</Button
            >
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
                        :src="imageLoaded[p.id] || placeholder"
                        :data-name="p.name"
                        :data-id="p.id"
                        class="w-32 h-32 object-contain select-none pokemon-img"
                        @load="() => onImageLoad(p)"
                        @error="onImageError"
                        loading="lazy"
                    />
                </div>

                <div class="w-full text-center mt-3">
                    <h3 class="font-medium text-lg capitalize">{{ p.name }}</h3>
                    <p class="text-sm text-muted-foreground">#{{ p.id }}</p>
                </div>

                <div class="w-full mt-3 flex gap-2">
                    <Button
                        class="flex-1"
                        size="sm"
                        @click="showDetails(p, $event)"
                    >
                        Details
                    </Button>
                </div>
            </Card>
        </div>

        <!-- Modal -->
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
                            selectedImg ||
                            imageLoaded[selected.id] ||
                            placeholder
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

        <!-- Floating Scroll-to-Top Button -->
        <Button
            @click="scrollToTop"
            variant="outline"
            class="fixed bottom-6 right-6 rounded-full p-3 shadow-lg flex items-center justify-center hover:bg-gray-200 transition"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 15l7-7 7 7"
                />
            </svg>
        </Button>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
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

const query = ref("");
const displayList = ref<PokemonSummary[]>([]);
const selected = ref<PokemonDetail | null>(null);
const selectedImg = ref<string | null>(null);

// Progressive loading
const placeholder =
    "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
const imageLoaded = reactive<Record<number, string>>({});

onMounted(async () => {
    await list(1, 151);
    displayList.value = pokemons.value.slice();
    loadAllImages(displayList.value);
});

watch(pokemons, () => {
    if (!query.value) displayList.value = pokemons.value.slice();
    loadAllImages(displayList.value);
});

function spriteUrl(nameOrNameStr: string | number, id?: number): string {
    if (
        typeof nameOrNameStr === "number" ||
        (/^\d+$/.test(String(nameOrNameStr)) && id)
    ) {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    }
    const normId = id || String(nameOrNameStr);
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${normId}.gif`;
}

// Preload images asynchronously
function loadAllImages(list: PokemonSummary[]) {
    list.forEach((p) => {
        const img = new Image();
        img.src = spriteUrl(p.name, p.id);
        img.onload = () => {
            imageLoaded[p.id] = img.src;
        };
        img.onerror = () => onImageError(img as any);
    });
}

function onImageLoad(p: PokemonSummary) {
    // no-op because images loaded via preload
}

function onImageError(ev: Event | HTMLImageElement) {
    let img: HTMLImageElement;
    if (ev instanceof Event) img = ev.target as HTMLImageElement;
    else img = ev;
    const dataId = img.getAttribute("data-id") || "";
    if (dataId)
        img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dataId}.png`;
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
        loadAllImages(displayList.value);
        return;
    }
    const results = await search(q, 151);
    displayList.value = results;
    loadAllImages(displayList.value);
}

function resetList() {
    query.value = "";
    list(1, 151).then(() => {
        displayList.value = pokemons.value.slice();
        loadAllImages(displayList.value);
    });
}

// Show details modal
async function showDetails(s: PokemonSummary, ev: Event) {
    const imgEl = (ev.currentTarget as HTMLElement)
        ?.closest(".card")
        ?.querySelector("img") as HTMLImageElement | null;

    selectedImg.value = imgEl?.src || null;

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
    image-rendering: pixelated;
    image-rendering: crisp-edges;
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
