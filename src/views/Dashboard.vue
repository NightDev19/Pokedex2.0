<!-- views/Dashboard.vue -->
<template>
    <div class="p-6">
        <!-- Search Bar -->
        <div class="flex items-center gap-4 mb-6">
            <Input
                v-model="query"
                placeholder="Search by name or ID (press Enter or click Search)"
                @keyup.enter="onSearch"
                @input="onSearchInput"
                class="flex-1 max-w-md"
            />
            <Button @click="onSearch" :disabled="loading">
                <Search class="w-4 h-4 mr-2" />
                Search
            </Button>
            <Button variant="ghost" @click="resetList" :disabled="loading">
                <RotateCcw class="w-4 h-4 mr-2" />
                Reset
            </Button>
        </div>

        <!-- Feedback Messages -->
        <div
            v-if="error"
            class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600"
        >
            {{ error }}
        </div>
        <div
            v-if="loading && displayList.length === 0"
            class="mb-4 flex items-center gap-2 text-blue-600"
        >
            <div
                class="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
            ></div>
            Loading Pokémon...
        </div>

        <!-- Stats -->
        <div v-if="displayList.length > 0" class="mb-4 text-sm text-gray-600">
            Showing {{ displayList.length }} of {{ total || "many" }} Pokémon
        </div>

        <!-- Grid of Cards with Intersection Observer -->
        <div
            ref="gridRef"
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
            <PokemonCard
                v-for="pokemon in displayList"
                :key="`${pokemon.id}-${pokemon.name}`"
                :pokemon="pokemon"
                :image-src="getImageSrc(pokemon)"
                @show-details="showDetails"
                @image-loaded="onImageLoaded"
                @image-error="onImageError"
            />
        </div>

        <!-- Load More Button -->
        <div v-if="canLoadMore" class="mt-8 text-center">
            <Button
                @click="loadMore"
                :disabled="loading"
                variant="outline"
                size="lg"
            >
                <Plus class="w-4 h-4 mr-2" />
                Load More Pokémon
            </Button>
        </div>

        <!-- Loading indicator for more items -->
        <div v-if="loading && displayList.length > 0" class="mt-4 text-center">
            <div
                class="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"
            ></div>
        </div>

        <!-- Basic Details Modal -->
        <PokemonModal
            :pokemon="selected"
            :is-open="!!selected"
            @close="closeModal"
            @view-full-details="goToDetails"
        />

        <!-- Floating Scroll-to-Top Button -->
        <Button
            v-if="showScrollTop"
            @click="scrollToTop"
            variant="outline"
            class="fixed bottom-6 right-6 rounded-full p-3 shadow-lg flex items-center justify-center hover:bg-gray-200 transition z-40"
        >
            <ChevronUp class="h-5 w-5" />
        </Button>
    </div>
</template>

<script setup lang="ts">
import {
    ref,
    reactive,
    onMounted,
    watch,
    computed,
    nextTick,
    onUnmounted,
} from "vue";
import { useRouter } from "vue-router";
import type { PokemonSummary, PokemonDetail } from "@/composables/usePokemon";
import { usePokemonApi } from "@/composables/usePokemon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RotateCcw, Plus, ChevronUp } from "lucide-vue-next";
import PokemonCard from "@/components/PokemonCard.vue";
import PokemonModal from "@/components/PokemonModal.vue";

const router = useRouter();

// API hooks
const {
    pokemons,
    list,
    get,
    search,
    loading,
    error,
    total,
    page: _page,
    pageSize: _pageSize,
} = usePokemonApi();

// Reactive state
const query = ref("");
const displayList = ref<PokemonSummary[]>([]);
const selected = ref<PokemonDetail | null>(null);
const imageLoaded = reactive<Record<number, string>>({});
const showScrollTop = ref(false);
const gridRef = ref<HTMLElement>();

// Search debouncing
let searchTimeout: NodeJS.Timeout;

// Pagination state
const currentPage = ref(1);
const itemsPerPage = 20;
const isSearchMode = ref(false);

// Placeholder for unloaded images
const placeholder =
    "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

// Image management with lazy loading
const loadedImages = new Set<number>();
const loadingImages = new Set<number>();

// Computed properties
const canLoadMore = computed(() => {
    if (isSearchMode.value) return false;
    return displayList.value.length < (total.value || 1000) && !loading.value;
});

// Lifecycle
onMounted(async () => {
    await loadInitialData();
    setupScrollListener();
    await nextTick();
    setupIntersectionObserver();
});

onUnmounted(() => {
    removeScrollListener();
});

// Watchers
watch(pokemons, (newVal) => {
    if (!isSearchMode.value) {
        displayList.value = newVal.slice();
    }
});

// --- Image Helpers ---
function getImageSrc(pokemon: PokemonSummary): string {
    if (imageLoaded[pokemon.id]) {
        return imageLoaded[pokemon.id];
    }
    return placeholder;
}

function spriteUrl(
    id: number,
    type: "animated" | "official" | "normal" = "animated",
): string {
    switch (type) {
        case "animated":
            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;
        case "official":
            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
        case "normal":
            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
        default:
            return placeholder;
    }
}

async function loadImage(pokemon: PokemonSummary): Promise<void> {
    if (loadedImages.has(pokemon.id) || loadingImages.has(pokemon.id)) {
        return;
    }

    loadingImages.add(pokemon.id);

    try {
        // Try animated first
        const animatedSrc = spriteUrl(pokemon.id, "animated");
        const img = new Image();

        await new Promise<void>((resolve, reject) => {
            img.onload = () => {
                imageLoaded[pokemon.id] = animatedSrc;
                loadedImages.add(pokemon.id);
                resolve();
            };
            img.onerror = () => reject();
            img.src = animatedSrc;
        });
    } catch {
        // Fallback to official artwork
        try {
            const officialSrc = spriteUrl(pokemon.id, "official");
            const img = new Image();

            await new Promise<void>((resolve, reject) => {
                img.onload = () => {
                    imageLoaded[pokemon.id] = officialSrc;
                    loadedImages.add(pokemon.id);
                    resolve();
                };
                img.onerror = () => reject();
                img.src = officialSrc;
            });
        } catch {
            // Final fallback to normal sprite
            const normalSrc = spriteUrl(pokemon.id, "normal");
            imageLoaded[pokemon.id] = normalSrc;
            loadedImages.add(pokemon.id);
        }
    } finally {
        loadingImages.delete(pokemon.id);
    }
}

// Batch load images for visible items
async function loadVisibleImages() {
    const visiblePokemon = displayList.value.slice(0, 40); // Load first 40 images
    const promises = visiblePokemon.map(loadImage);
    await Promise.allSettled(promises);
}

// --- Intersection Observer for Lazy Loading ---
let observer: IntersectionObserver | null = null;

function setupIntersectionObserver() {
    if (!gridRef.value) return;

    observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const pokemonId =
                        entry.target.getAttribute("data-pokemon-id");
                    if (pokemonId) {
                        const pokemon = displayList.value.find(
                            (p) => p.id.toString() === pokemonId,
                        );
                        if (pokemon) {
                            loadImage(pokemon);
                        }
                    }
                }
            });
        },
        {
            rootMargin: "100px",
            threshold: 0.1,
        },
    );

    // Observe all current cards
    const cards = gridRef.value.querySelectorAll("[data-pokemon-id]");
    cards.forEach((card) => observer?.observe(card));
}

// --- Data Loading ---
async function loadInitialData() {
    currentPage.value = 1;
    await list(1, itemsPerPage);
    displayList.value = pokemons.value.slice();
    await loadVisibleImages();
}

async function loadMore() {
    if (loading.value || isSearchMode.value) return;

    currentPage.value += 1;
    await list(currentPage.value, itemsPerPage);

    const currentIds = new Set(displayList.value.map((p) => p.id));
    const newItems = pokemons.value.filter((p) => !currentIds.has(p.id));
    displayList.value.push(...newItems);

    await nextTick();
    const newCards = gridRef.value?.querySelectorAll("[data-pokemon-id]");
    newCards?.forEach((card) => observer?.observe(card));
}

// --- Search Functions ---
function onSearchInput() {
    clearTimeout(searchTimeout);
    if (!query.value.trim()) {
        onSearchClear();
        return;
    }

    searchTimeout = setTimeout(() => {
        onSearch();
    }, 300); // Debounce search
}

async function onSearch() {
    const q = query.value.trim();
    if (!q) {
        await onSearchClear();
        return;
    }

    isSearchMode.value = true;
    const results = await search(q, 100);
    displayList.value = results;
    await loadVisibleImages();
}

async function onSearchClear() {
    isSearchMode.value = false;
    currentPage.value = 1;
    await list(1, itemsPerPage);
    displayList.value = pokemons.value.slice();
    await loadVisibleImages();
}

async function resetList() {
    query.value = "";
    await onSearchClear();
}

// --- Event Handlers ---
function onImageLoaded(pokemon: PokemonSummary) {
    loadedImages.add(pokemon.id);
}

function onImageError(pokemon: PokemonSummary) {
    // Try fallback image
    const fallbackSrc = spriteUrl(pokemon.id, "normal");
    imageLoaded[pokemon.id] = fallbackSrc;
}

async function showDetails(pokemon: PokemonSummary) {
    const details = await get(pokemon.id || pokemon.name);
    if (details) {
        selected.value = details;
    }
}

function closeModal() {
    selected.value = null;
}

function goToDetails(pokemon: PokemonDetail) {
    router.push(`/pokemon/${pokemon.id}`);
    closeModal();
}

// --- Scroll Handling ---
function setupScrollListener() {
    window.addEventListener("scroll", onScroll, { passive: true });
}

function removeScrollListener() {
    window.removeEventListener("scroll", onScroll);
}

function onScroll() {
    showScrollTop.value = window.scrollY > 500;
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}
</script>

<style scoped>
.text-muted-foreground {
    color: rgba(100, 116, 139, 1);
}

/* Loading animation */
@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Smooth transitions */
.grid > * {
    transition:
        transform 0.2s ease,
        opacity 0.2s ease;
}

/* Responsive grid improvements */
@media (min-width: 1536px) {
    .grid {
        grid-template-columns: repeat(6, minmax(0, 1fr));
    }
}
</style>
