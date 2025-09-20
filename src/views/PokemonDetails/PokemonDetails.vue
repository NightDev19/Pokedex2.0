<template>
    <div
        class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"
    >
        <!-- Loading State -->
        <div
            v-if="loading"
            class="flex items-center justify-center min-h-screen px-4"
        >
            <div class="text-center space-y-4">
                <div
                    class="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"
                ></div>
                <p class="text-lg text-gray-600">Loading Pokémon data...</p>
            </div>
        </div>

        <!-- Error State -->
        <div
            v-else-if="error"
            class="flex items-center justify-center min-h-screen px-4"
        >
            <Card class="p-6 sm:p-8 text-center max-w-md w-full">
                <AlertCircle class="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 class="text-xl font-semibold mb-2">Pokémon Not Found</h2>
                <p class="text-gray-600 mb-4">{{ error }}</p>
                <Button @click="goBack" variant="outline">
                    <ArrowLeft class="w-4 h-4 mr-2" />
                    Go Back
                </Button>
            </Card>
        </div>

        <!-- Main Content -->
        <div
            v-else-if="pokemonData"
            class="container mx-auto px-4 py-4 sm:py-6"
        >
            <!-- Header -->
            <div class="mb-4 sm:mb-6">
                <div class="flex items-center justify-between gap-4 mb-4">
                    <div class="flex items-center gap-3">
                        <Button @click="goBack" variant="outline" class="mb-0">
                            <ArrowLeft class="w-4 h-4 mr-2" />
                            Back to List
                        </Button>

                        <!-- Debug toggle for easier debugging -->
                        <Button
                            @click="toggleDebug"
                            variant="ghost"
                            class="mb-0"
                        >
                            <Sparkles class="w-4 h-4 mr-2" />
                            <span class="text-sm">{{
                                debug ? "Hide Debug" : "Show Debug"
                            }}</span>
                        </Button>
                    </div>

                    <!-- quick info: formatted id and name for easier copy/paste -->
                    <div class="text-right text-sm text-gray-500">
                        <div class="font-medium">{{ pokemonName }}</div>
                        <div>{{ formattedId }}</div>
                    </div>
                </div>

                <div
                    class="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-white rounded-xl p-4 sm:p-6 shadow-lg"
                >
                    <div class="relative shrink-0">
                        <img
                            :src="mainImage"
                            :alt="pokemonName"
                            class="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain"
                        />

                        <Button
                            v-if="shinyAvailable"
                            @click="toggleShiny"
                            :variant="showShiny ? 'default' : 'outline'"
                            size="sm"
                            class="absolute -bottom-2 -right-2 sm:bottom-0 sm:right-0 rounded-full p-2"
                            :title="showShiny ? 'Show Normal' : 'Show Shiny'"
                        >
                            <Sparkles
                                class="w-4 h-4"
                                :class="showShiny ? 'text-yellow-300' : ''"
                            />
                        </Button>
                    </div>

                    <div class="flex-1 text-center sm:text-left">
                        <div
                            class="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mb-2"
                        >
                            <h1
                                class="text-2xl sm:text-3xl md:text-4xl font-bold capitalize"
                            >
                                {{ pokemonName }}
                            </h1>
                            <span class="text-xl sm:text-2xl text-gray-500">{{
                                formattedId
                            }}</span>
                        </div>

                        <div
                            class="flex flex-wrap justify-center sm:justify-start gap-2 mb-4"
                        >
                            <span
                                v-for="type in types"
                                :key="type"
                                :class="getTypeColor(type)"
                                class="px-3 py-1 sm:px-4 sm:py-2 rounded-full text-white font-medium capitalize shadow-md text-sm"
                            >
                                {{ type }}
                            </span>
                        </div>

                        <div
                            class="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm"
                        >
                            <div class="text-center">
                                <p class="text-gray-600">Height</p>
                                <p class="text-sm sm:text-lg font-semibold">
                                    {{ heightMeters }}m
                                </p>
                            </div>
                            <div class="text-center">
                                <p class="text-gray-600">Weight</p>
                                <p class="text-sm sm:text-lg font-semibold">
                                    {{ weightKg }}kg
                                </p>
                            </div>
                            <div class="text-center">
                                <p class="text-gray-600">Base Exp</p>
                                <p class="text-sm sm:text-lg font-semibold">
                                    {{ baseExp }}
                                </p>
                            </div>
                            <div class="text-center">
                                <p class="text-gray-600">Category</p>
                                <p class="text-sm sm:text-lg font-semibold">
                                    {{ genus }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Debug panel (collapsible) -->
                <div
                    v-if="debug"
                    class="mt-4 p-4 bg-gray-50 rounded-lg border overflow-x-auto text-xs"
                >
                    <div class="font-medium mb-2">Debug: Raw pokemonData</div>
                    <pre class="whitespace-pre-wrap">{{
                        safePrettyJson(pokemonData)
                    }}</pre>
                </div>
            </div>

            <!-- Tabs -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="border-b overflow-x-auto">
                    <nav class="flex px-2 sm:px-6 min-w-max">
                        <button
                            v-for="tab in tabs"
                            :key="tab.id"
                            @click="activeTab = tab.id"
                            :class="tabButtonClass(tab.id)"
                            class="py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap"
                        >
                            <component
                                :is="tab.icon"
                                class="w-3 h-3 sm:w-4 sm:h-4"
                            />
                            {{ tab.label }}
                        </button>
                    </nav>
                </div>

                <div class="p-4 sm:p-6">
                    <!-- Stats Tab -->
                    <section v-if="activeTab === 'stats'" class="space-y-6">
                        <div>
                            <h3
                                class="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2"
                            >
                                <BarChart3
                                    class="w-4 h-4 sm:w-5 sm:h-5 text-blue-500"
                                />
                                Base Stats
                            </h3>

                            <div class="space-y-3 sm:space-y-4">
                                <div
                                    v-for="stat in stats"
                                    :key="stat.stat.name"
                                    class="space-y-2"
                                >
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <span
                                            class="text-xs sm:text-sm font-medium capitalize"
                                            >{{
                                                getStatName(stat.stat.name)
                                            }}</span
                                        >
                                        <span
                                            class="text-xs sm:text-sm font-semibold"
                                            >{{ stat.base_stat }}</span
                                        >
                                    </div>
                                    <div
                                        class="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden"
                                    >
                                        <div
                                            :style="{
                                                width: statBarWidth(
                                                    stat.base_stat,
                                                ),
                                            }"
                                            :class="
                                                getStatColor(stat.base_stat)
                                            "
                                            class="h-full rounded-full transition-all duration-1000 ease-out"
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Total Stats -->
                            <div
                                class="mt-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"
                            >
                                <div class="flex justify-between items-center">
                                    <span
                                        class="font-medium text-sm sm:text-base"
                                        >Total Base Stats</span
                                    >
                                    <span
                                        class="text-lg sm:text-xl font-bold"
                                        >{{ totalStats }}</span
                                    >
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Evolution Tab -->
                    <section v-if="activeTab === 'evolution'" class="space-y-6">
                        <div v-if="pokemonData.evolution">
                            <h3
                                class="text-lg sm:text-xl font-semibold mb-6 flex items-center gap-2"
                            >
                                <Shuffle
                                    class="w-4 h-4 sm:w-5 sm:h-5 text-green-500"
                                />
                                Evolution Chain
                            </h3>
                            <EvolutionChain
                                :evolution-chain="pokemonData.evolution"
                                :current-pokemon-id="pokemonData.pokemon.id"
                            />
                        </div>
                        <div v-else>
                            <p class="text-gray-500 text-center py-8">
                                No evolution data available
                            </p>
                        </div>
                    </section>

                    <!-- Moves Tab -->
                    <section v-if="activeTab === 'moves'" class="space-y-6">
                        <div>
                            <h3
                                class="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2"
                            >
                                <Swords
                                    class="w-4 h-4 sm:w-5 sm:h-5 text-purple-500"
                                />
                                Moves ({{ moves.length }})
                            </h3>

                            <!-- Search moves -->
                            <div class="mb-4">
                                <Input
                                    v-model="moveSearch"
                                    placeholder="Search moves..."
                                    class="w-full sm:max-w-md"
                                />
                            </div>

                            <div
                                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 max-h-80 sm:max-h-96 overflow-y-auto"
                            >
                                <div
                                    v-for="move in filteredMoves"
                                    :key="move.move.name"
                                    class="p-2 sm:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <span
                                        class="font-medium capitalize text-xs sm:text-sm"
                                        >{{
                                            move.move.name.replace("-", " ")
                                        }}</span
                                    >
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Locations Tab -->
                    <section v-if="activeTab === 'locations'" class="space-y-6">
                        <div>
                            <h3
                                class="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2"
                            >
                                <MapPin
                                    class="w-4 h-4 sm:w-5 sm:h-5 text-red-500"
                                />
                                Locations
                            </h3>

                            <div
                                v-if="locations && locations.length > 0"
                                class="space-y-3"
                            >
                                <div
                                    v-for="location in locations"
                                    :key="location.location_area.name"
                                    class="p-3 sm:p-4 border border-gray-200 rounded-lg"
                                >
                                    <h4
                                        class="font-medium capitalize mb-2 text-sm sm:text-base"
                                    >
                                        {{
                                            location.location_area.name.replace(
                                                "-",
                                                " ",
                                            )
                                        }}
                                    </h4>
                                    <div
                                        class="text-xs sm:text-sm text-gray-600 space-y-1"
                                    >
                                        <div
                                            v-for="version in location.version_details"
                                            :key="version.version.name"
                                        >
                                            <span class="font-medium"
                                                >{{
                                                    version.version.name
                                                }}:</span
                                            >
                                            <span
                                                v-for="encounter in version.encounter_details"
                                                :key="encounter.method.name"
                                                class="ml-2 block sm:inline"
                                                >{{
                                                    encounter.method.name.replace(
                                                        "-",
                                                        " ",
                                                    )
                                                }}
                                                (Lv.
                                                {{ encounter.min_level }}-{{
                                                    encounter.max_level
                                                }},
                                                {{ encounter.chance }}%)</span
                                            >
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div v-else class="text-center py-8">
                                <MapPin
                                    class="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4"
                                />
                                <p class="text-gray-500 text-sm sm:text-base">
                                    This Pokémon cannot be found in the wild
                                </p>
                            </div>
                        </div>
                    </section>

                    <!-- Abilities Tab -->
                    <section v-if="activeTab === 'abilities'" class="space-y-6">
                        <div>
                            <h3
                                class="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2"
                            >
                                <Zap
                                    class="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500"
                                />
                                Abilities
                            </h3>
                            <div
                                class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
                            >
                                <div
                                    v-for="ability in abilities"
                                    :key="ability.ability.name"
                                    :class="
                                        ability.is_hidden
                                            ? 'border-purple-200 bg-purple-50'
                                            : 'border-green-200 bg-green-50'
                                    "
                                    class="p-3 sm:p-4 border rounded-lg"
                                >
                                    <h4
                                        class="font-semibold capitalize mb-2 flex flex-col sm:flex-row sm:items-center gap-2"
                                    >
                                        <span class="text-sm sm:text-base">{{
                                            ability.ability.name.replace(
                                                "-",
                                                " ",
                                            )
                                        }}</span>
                                        <span
                                            v-if="ability.is_hidden"
                                            class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full w-fit"
                                            >Hidden</span
                                        >
                                    </h4>
                                    <p class="text-xs sm:text-sm text-gray-600">
                                        Slot {{ ability.slot }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Sprites Tab -->
                    <section v-if="activeTab === 'sprites'" class="space-y-6">
                        <div>
                            <h3
                                class="text-lg sm:text-xl font-semibold mb-6 flex items-center gap-2"
                            >
                                <ImageIcon
                                    class="w-4 h-4 sm:w-5 sm:h-5 text-pink-500"
                                />
                                Sprites & Forms
                            </h3>

                            <!-- Main Sprites -->
                            <div
                                class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8"
                            >
                                <div
                                    v-for="(sprite, name) in mainSprites"
                                    :key="name"
                                    class="text-center"
                                >
                                    <div
                                        class="bg-gray-50 rounded-lg p-2 sm:p-4 border"
                                    >
                                        <img
                                            v-if="sprite"
                                            :src="sprite"
                                            :alt="name"
                                            class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto object-contain"
                                        />
                                        <div
                                            v-else
                                            class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto flex items-center justify-center text-gray-400"
                                        >
                                            <ImageOff
                                                class="w-6 h-6 sm:w-8 sm:h-8"
                                            />
                                        </div>
                                        <p
                                            class="text-xs sm:text-sm font-medium mt-2 capitalize"
                                        >
                                            {{ name.replace("_", " ") }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Shiny Sprites -->
                            <div v-if="shinyAvailable">
                                <h4
                                    class="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2"
                                >
                                    <Sparkles class="w-4 h-4 text-yellow-500" />
                                    Shiny Forms
                                </h4>
                                <div
                                    class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
                                >
                                    <div
                                        v-for="(sprite, name) in shinySprites"
                                        :key="name"
                                        class="text-center"
                                    >
                                        <div
                                            class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-2 sm:p-4 border border-yellow-200"
                                        >
                                            <img
                                                v-if="sprite"
                                                :src="sprite"
                                                :alt="`${name} shiny`"
                                                class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto object-contain"
                                            />
                                            <div
                                                v-else
                                                class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto flex items-center justify-center text-gray-400"
                                            >
                                                <ImageOff
                                                    class="w-6 h-6 sm:w-8 sm:h-8"
                                                />
                                            </div>
                                            <p
                                                class="text-xs sm:text-sm font-medium mt-2 capitalize"
                                            >
                                                {{ name.replace("_", " ") }} ✨
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/*
  Refactored for easier debugging and easier access:
  - Organized state & computed properties for clarity
  - Added a debug panel (toggleable) showing pretty JSON
  - Added route watcher to re-fetch when id changes
  - Consolidated helper functions and added defensive guards
  - Kept all original functionality and component API intact
*/

import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { PokemonDetail } from "@/composables/usePokemon";
import { usePokemonApi } from "@/composables/usePokemon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    BarChart3,
    Shuffle,
    Swords,
    MapPin,
    Zap,
    ImageIcon,
    Sparkles,
    ImageOff,
    AlertCircle,
} from "lucide-vue-next";
import EvolutionChain from "@/components/EvolutionChain.vue";

const route = useRoute();
const router = useRouter();
const { getCompletePokemonData, loading, error } = usePokemonApi();

// --- local state ---
const pokemonData = ref<any>(null);
// Strongly-typed tab identifiers to avoid assigning plain `string` values
type TabId =
    | "stats"
    | "evolution"
    | "moves"
    | "abilities"
    | "locations"
    | "sprites";
const activeTab = ref<TabId>("stats");
const moveSearch = ref("");
const showShiny = ref(false);
const debug = ref(false); // toggle this to enable debug output and logging

// tabs metadata (kept for template)
const tabs: Array<{ id: TabId; label: string; icon: any }> = [
    { id: "stats", label: "Stats", icon: BarChart3 },
    { id: "evolution", label: "Evolution", icon: Shuffle },
    { id: "moves", label: "Moves", icon: Swords },
    { id: "abilities", label: "Abilities", icon: Zap },
    { id: "locations", label: "Locations", icon: MapPin },
    { id: "sprites", label: "Sprites", icon: ImageIcon },
];

// --- derived / computed fields for easier access ---
const pokemonName = computed(
    () => pokemonData.value?.pokemon?.name || "Unknown",
);
const formattedId = computed(() => {
    const id = pokemonData.value?.pokemon?.id;
    return id ? `#${id.toString().padStart(4, "0")}` : "#0000";
});

const types = computed(() => {
    return (pokemonData.value?.pokemon?.types || []).map(
        (t: any) => t.type.name,
    );
});

const stats = computed(() => pokemonData.value?.pokemon?.stats || []);
const moves = computed(() => pokemonData.value?.pokemon?.moves || []);
const abilities = computed(() => pokemonData.value?.pokemon?.abilities || []);
const locations = computed(() => pokemonData.value?.locations || []);

const shinyAvailable = computed(() => {
    const p = pokemonData.value?.pokemon;
    return !!(
        p?.sprites?.front_shiny ||
        p?.sprites?.other?.["official-artwork"]?.front_shiny
    );
});

const mainImage = computed(() => {
    const p: PokemonDetail | undefined = pokemonData.value?.pokemon;
    if (!p) return "";
    if (showShiny.value) {
        return (
            p.sprites.other?.["official-artwork"]?.front_shiny ||
            p.sprites.front_shiny ||
            p.sprites.other?.["official-artwork"]?.front_default ||
            p.sprites.front_default ||
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
        );
    }

    return (
        p.sprites.other?.["official-artwork"]?.front_default ||
        p.sprites.versions?.["generation-v"]?.["black-white"]?.animated
            ?.front_default ||
        p.sprites.front_default ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
    );
});

const mainSprites = computed(() => {
    const p = pokemonData.value?.pokemon;
    if (!p) return {};
    return {
        front_default: p.sprites.front_default,
        back_default: p.sprites.back_default,
        front_female: p.sprites.front_female,
        back_female: p.sprites.back_female,
    };
});

const shinySprites = computed(() => {
    const p = pokemonData.value?.pokemon;
    if (!p) return {};
    return {
        front_shiny: p.sprites.front_shiny,
        back_shiny: p.sprites.back_shiny,
        front_shiny_female: p.sprites.front_shiny_female,
        back_shiny_female: p.sprites.back_shiny_female,
    };
});

const heightMeters = computed(() => {
    const h = pokemonData.value?.pokemon?.height;
    return h ? (h / 10).toFixed(1) : "0.0";
});

const weightKg = computed(() => {
    const w = pokemonData.value?.pokemon?.weight;
    return w ? (w / 10).toFixed(1) : "0.0";
});

const baseExp = computed(
    () => pokemonData.value?.pokemon?.base_experience ?? "N/A",
);

const genus = computed(() => {
    const gens = pokemonData.value?.species?.genera || [];
    const englishGenus = gens.find((g: any) => g.language?.name === "en");
    return englishGenus?.genus || "Unknown";
});

const totalStats = computed(() => {
    return stats.value.reduce(
        (acc: number, s: any) => acc + (s.base_stat || 0),
        0,
    );
});

// --- filtered moves for the Moves tab ---
const filteredMoves = computed(() => {
    const search = moveSearch.value.trim().toLowerCase();
    if (!search) return moves.value;
    return moves.value.filter((m: any) =>
        m.move.name.toLowerCase().includes(search),
    );
});

// --- helpers (kept small & testable) ---
function getTypeColor(type: string): string {
    const colors: Record<string, string> = {
        normal: "bg-gray-400",
        fire: "bg-red-500",
        water: "bg-blue-500",
        electric: "bg-yellow-400",
        grass: "bg-green-500",
        ice: "bg-blue-300",
        fighting: "bg-red-700",
        poison: "bg-purple-500",
        ground: "bg-yellow-600",
        flying: "bg-indigo-400",
        psychic: "bg-pink-500",
        bug: "bg-green-400",
        rock: "bg-yellow-800",
        ghost: "bg-purple-700",
        dragon: "bg-indigo-700",
        dark: "bg-gray-800",
        steel: "bg-gray-500",
        fairy: "bg-pink-300",
    };
    return colors[type] || "bg-gray-400";
}

function getStatName(statName: string): string {
    const names: Record<string, string> = {
        hp: "HP",
        attack: "Attack",
        defense: "Defense",
        "special-attack": "Sp. Attack",
        "special-defense": "Sp. Defense",
        speed: "Speed",
    };
    return names[statName] || statName;
}

function getStatColor(value: number): string {
    if (value >= 120) return "bg-green-500";
    if (value >= 90) return "bg-yellow-500";
    if (value >= 60) return "bg-orange-500";
    return "bg-red-500";
}

function statBarWidth(value: number): string {
    const percent = Math.min((value / 200) * 100, 100);
    return `${percent}%`;
}

function toggleShiny() {
    showShiny.value = !showShiny.value;
}

function goBack() {
    router.go(-1);
}

function toggleDebug() {
    debug.value = !debug.value;
    if (debug.value)
        console.debug("Debug enabled for PokemonDetails", {
            pokemonData: pokemonData.value,
        });
}

function tabButtonClass(id: TabId) {
    return activeTab.value === id
        ? "border-blue-500 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-700";
}

function safePrettyJson(obj: any) {
    try {
        return JSON.stringify(obj, null, 2);
    } catch (e) {
        return String(obj);
    }
}

// --- data fetching ---
async function fetchPokemon(pokemonId: string | number) {
    if (!pokemonId) return;
    try {
        if (debug.value) console.debug(`Fetching pokemon ${pokemonId}`);
        pokemonData.value = await getCompletePokemonData(String(pokemonId));
        if (debug.value)
            console.debug("Fetched pokemonData", pokemonData.value);
    } catch (err) {
        // bubble up to the composable's error state; keep local logging for debugging
        console.error("Failed to fetch pokemon:", err);
        // keep pokemonData null on error to show error state handled by composable
        pokemonData.value = null;
    }
}

onMounted(() => {
    const id = route.params.id as string | undefined;
    if (id) fetchPokemon(id);
});

// refetch when route param changes (useful during navigation)
watch(
    () => route.params.id,
    (newId, oldId) => {
        if (newId && newId !== oldId) {
            fetchPokemon(String(newId));
            // return to default tab and clear search for clarity when debugging
            activeTab.value = "stats";
            moveSearch.value = "";
        }
    },
);
</script>

<style scoped>
/* Custom scrollbar for moves list */
.overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.7);
}

/* Stat bar animations */
.transition-all {
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Tab active state */
.border-blue-500 {
    border-color: rgb(59 130 246);
}

/* Smooth image transitions */
img {
    transition: transform 0.2s ease-in-out;
}

img:hover {
    transform: scale(1.05);
}

/* Mobile scroll for tabs */
@media (max-width: 640px) {
    .overflow-x-auto::-webkit-scrollbar {
        height: 4px;
    }

    .overflow-x-auto::-webkit-scrollbar-track {
        background: transparent;
    }

    .overflow-x-auto::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.3);
        border-radius: 2px;
    }
}
</style>
