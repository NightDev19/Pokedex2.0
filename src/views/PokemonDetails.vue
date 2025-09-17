<!-- views/PokemonDetails.vue -->
<template>
    <div
        class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"
    >
        <!-- Loading State -->
        <div
            v-if="loading"
            class="flex items-center justify-center min-h-screen"
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
            class="flex items-center justify-center min-h-screen"
        >
            <Card class="p-8 text-center max-w-md">
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
        <div v-else-if="pokemonData" class="container mx-auto px-4 py-6">
            <!-- Header -->
            <div class="mb-6">
                <Button @click="goBack" variant="outline" class="mb-4">
                    <ArrowLeft class="w-4 h-4 mr-2" />
                    Back to List
                </Button>

                <div
                    class="flex flex-col md:flex-row items-start md:items-center gap-6 bg-white rounded-xl p-6 shadow-lg"
                >
                    <div class="relative">
                        <img
                            :src="getMainImage(pokemonData.pokemon)"
                            :alt="pokemonData.pokemon.name"
                            class="w-32 h-32 md:w-40 md:h-40 object-contain"
                        />
                        <Button
                            v-if="hasShiny(pokemonData.pokemon)"
                            @click="toggleShiny"
                            :variant="showShiny ? 'default' : 'outline'"
                            size="sm"
                            class="absolute bottom-0 right-0 rounded-full"
                            :title="showShiny ? 'Show Normal' : 'Show Shiny'"
                        >
                            <Sparkles
                                class="w-4 h-4"
                                :class="showShiny ? 'text-yellow-300' : ''"
                            />
                        </Button>
                    </div>

                    <div class="flex-1">
                        <div class="flex items-center gap-4 mb-2">
                            <h1
                                class="text-3xl md:text-4xl font-bold capitalize"
                            >
                                {{ pokemonData.pokemon.name }}
                            </h1>
                            <span class="text-2xl text-gray-500">{{
                                formatPokemonId(pokemonData.pokemon.id)
                            }}</span>
                        </div>

                        <div class="flex flex-wrap gap-2 mb-4">
                            <span
                                v-for="type in pokemonData.pokemon.types"
                                :key="type.type.name"
                                :class="getTypeColor(type.type.name)"
                                class="px-4 py-2 rounded-full text-white font-medium capitalize shadow-md"
                            >
                                {{ type.type.name }}
                            </span>
                        </div>

                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="text-center">
                                <p class="text-sm text-gray-600">Height</p>
                                <p class="text-lg font-semibold">
                                    {{
                                        (
                                            pokemonData.pokemon.height / 10
                                        ).toFixed(1)
                                    }}m
                                </p>
                            </div>
                            <div class="text-center">
                                <p class="text-sm text-gray-600">Weight</p>
                                <p class="text-lg font-semibold">
                                    {{
                                        (
                                            pokemonData.pokemon.weight / 10
                                        ).toFixed(1)
                                    }}kg
                                </p>
                            </div>
                            <div class="text-center">
                                <p class="text-sm text-gray-600">Base Exp</p>
                                <p class="text-lg font-semibold">
                                    {{
                                        pokemonData.pokemon.base_experience ||
                                        "N/A"
                                    }}
                                </p>
                            </div>
                            <div class="text-center">
                                <p class="text-sm text-gray-600">Category</p>
                                <p class="text-lg font-semibold">
                                    {{ getPokemonGenus() }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="border-b">
                    <nav class="flex space-x-8 px-6">
                        <button
                            v-for="tab in tabs"
                            :key="tab.id"
                            @click="activeTab = tab.id"
                            :class="
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            "
                            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2"
                        >
                            <component :is="tab.icon" class="w-4 h-4" />
                            {{ tab.label }}
                        </button>
                    </nav>
                </div>

                <div class="p-6">
                    <!-- Stats Tab -->
                    <div v-if="activeTab === 'stats'" class="space-y-6">
                        <div>
                            <h3
                                class="text-xl font-semibold mb-4 flex items-center gap-2"
                            >
                                <BarChart3 class="w-5 h-5 text-blue-500" />
                                Base Stats
                            </h3>
                            <div class="space-y-4">
                                <div
                                    v-for="stat in pokemonData.pokemon.stats"
                                    :key="stat.stat.name"
                                    class="space-y-2"
                                >
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <span
                                            class="text-sm font-medium capitalize"
                                        >
                                            {{ getStatName(stat.stat.name) }}
                                        </span>
                                        <span class="text-sm font-semibold">{{
                                            stat.base_stat
                                        }}</span>
                                    </div>
                                    <div
                                        class="w-full bg-gray-200 rounded-full h-3 overflow-hidden"
                                    >
                                        <div
                                            :style="{
                                                width: `${Math.min((stat.base_stat / 200) * 100, 100)}%`,
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
                                class="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"
                            >
                                <div class="flex justify-between items-center">
                                    <span class="font-medium"
                                        >Total Base Stats</span
                                    >
                                    <span class="text-xl font-bold">{{
                                        getTotalStats()
                                    }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Evolution Tab -->
                    <div v-if="activeTab === 'evolution'" class="space-y-6">
                        <div v-if="pokemonData.evolution">
                            <h3
                                class="text-xl font-semibold mb-6 flex items-center gap-2"
                            >
                                <Shuffle class="w-5 h-5 text-green-500" />
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
                    </div>

                    <!-- Moves Tab -->
                    <div v-if="activeTab === 'moves'" class="space-y-6">
                        <div>
                            <h3
                                class="text-xl font-semibold mb-4 flex items-center gap-2"
                            >
                                <Swords class="w-5 h-5 text-purple-500" />
                                Moves ({{ pokemonData.pokemon.moves.length }})
                            </h3>

                            <!-- Search moves -->
                            <div class="mb-4">
                                <Input
                                    v-model="moveSearch"
                                    placeholder="Search moves..."
                                    class="max-w-md"
                                />
                            </div>

                            <div
                                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto"
                            >
                                <div
                                    v-for="move in filteredMoves"
                                    :key="move.move.name"
                                    class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <span
                                        class="font-medium capitalize text-sm"
                                    >
                                        {{ move.move.name.replace("-", " ") }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Locations Tab -->
                    <div v-if="activeTab === 'locations'" class="space-y-6">
                        <div>
                            <h3
                                class="text-xl font-semibold mb-4 flex items-center gap-2"
                            >
                                <MapPin class="w-5 h-5 text-red-500" />
                                Locations
                            </h3>

                            <div
                                v-if="
                                    pokemonData.locations &&
                                    pokemonData.locations.length > 0
                                "
                                class="space-y-3"
                            >
                                <div
                                    v-for="location in pokemonData.locations"
                                    :key="location.location_area.name"
                                    class="p-4 border border-gray-200 rounded-lg"
                                >
                                    <h4 class="font-medium capitalize mb-2">
                                        {{
                                            location.location_area.name.replace(
                                                "-",
                                                " ",
                                            )
                                        }}
                                    </h4>
                                    <div
                                        class="text-sm text-gray-600 space-y-1"
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
                                                class="ml-2"
                                            >
                                                {{
                                                    encounter.method.name.replace(
                                                        "-",
                                                        " ",
                                                    )
                                                }}
                                                (Lv.
                                                {{ encounter.min_level }}-{{
                                                    encounter.max_level
                                                }}, {{ encounter.chance }}%)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="text-center py-8">
                                <MapPin
                                    class="w-16 h-16 text-gray-300 mx-auto mb-4"
                                />
                                <p class="text-gray-500">
                                    This Pokémon cannot be found in the wild
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Abilities Tab -->
                    <div v-if="activeTab === 'abilities'" class="space-y-6">
                        <div>
                            <h3
                                class="text-xl font-semibold mb-4 flex items-center gap-2"
                            >
                                <Zap class="w-5 h-5 text-yellow-500" />
                                Abilities
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div
                                    v-for="ability in pokemonData.pokemon
                                        .abilities"
                                    :key="ability.ability.name"
                                    :class="
                                        ability.is_hidden
                                            ? 'border-purple-200 bg-purple-50'
                                            : 'border-green-200 bg-green-50'
                                    "
                                    class="p-4 border rounded-lg"
                                >
                                    <h4
                                        class="font-semibold capitalize mb-2 flex items-center gap-2"
                                    >
                                        {{
                                            ability.ability.name.replace(
                                                "-",
                                                " ",
                                            )
                                        }}
                                        <span
                                            v-if="ability.is_hidden"
                                            class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                                        >
                                            Hidden
                                        </span>
                                    </h4>
                                    <p class="text-sm text-gray-600">
                                        Slot {{ ability.slot }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sprites Tab -->
                    <div v-if="activeTab === 'sprites'" class="space-y-6">
                        <div>
                            <h3
                                class="text-xl font-semibold mb-6 flex items-center gap-2"
                            >
                                <ImageIcon class="w-5 h-5 text-pink-500" />
                                Sprites & Forms
                            </h3>

                            <!-- Main Sprites -->
                            <div
                                class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                            >
                                <div
                                    v-for="(sprite, name) in getMainSprites(
                                        pokemonData.pokemon,
                                    )"
                                    :key="name"
                                    class="text-center"
                                >
                                    <div
                                        class="bg-gray-50 rounded-lg p-4 border"
                                    >
                                        <img
                                            v-if="sprite"
                                            :src="sprite"
                                            :alt="name"
                                            class="w-24 h-24 mx-auto object-contain"
                                        />
                                        <div
                                            v-else
                                            class="w-24 h-24 mx-auto flex items-center justify-center text-gray-400"
                                        >
                                            <ImageOff class="w-8 h-8" />
                                        </div>
                                        <p
                                            class="text-sm font-medium mt-2 capitalize"
                                        >
                                            {{ name.replace("_", " ") }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Shiny Sprites -->
                            <div v-if="hasShiny(pokemonData.pokemon)">
                                <h4
                                    class="text-lg font-semibold mb-4 flex items-center gap-2"
                                >
                                    <Sparkles class="w-4 h-4 text-yellow-500" />
                                    Shiny Forms
                                </h4>
                                <div
                                    class="grid grid-cols-2 md:grid-cols-4 gap-4"
                                >
                                    <div
                                        v-for="(
                                            sprite, name
                                        ) in getShinySprites(
                                            pokemonData.pokemon,
                                        )"
                                        :key="name"
                                        class="text-center"
                                    >
                                        <div
                                            class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200"
                                        >
                                            <img
                                                v-if="sprite"
                                                :src="sprite"
                                                :alt="`${name} shiny`"
                                                class="w-24 h-24 mx-auto object-contain"
                                            />
                                            <div
                                                v-else
                                                class="w-24 h-24 mx-auto flex items-center justify-center text-gray-400"
                                            >
                                                <ImageOff class="w-8 h-8" />
                                            </div>
                                            <p
                                                class="text-sm font-medium mt-2 capitalize"
                                            >
                                                {{ name.replace("_", " ") }} ✨
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
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
    ImageIcon as ImageIcon,
    Sparkles,
    ImageOff,
    AlertCircle,
} from "lucide-vue-next";
import EvolutionChain from "@/components/EvolutionChain.vue";

const route = useRoute();
const router = useRouter();
const { getCompletePokemonData, loading, error } = usePokemonApi();

const pokemonData = ref<any>(null);
const activeTab = ref("stats");
const moveSearch = ref("");
const showShiny = ref(false);

const tabs = [
    { id: "stats", label: "Stats", icon: BarChart3 },
    { id: "evolution", label: "Evolution", icon: Shuffle },
    { id: "moves", label: "Moves", icon: Swords },
    { id: "abilities", label: "Abilities", icon: Zap },
    { id: "locations", label: "Locations", icon: MapPin },
    { id: "sprites", label: "Sprites", icon: ImageIcon },
];

const filteredMoves = computed(() => {
    if (!pokemonData.value?.pokemon.moves) return [];

    const search = moveSearch.value.toLowerCase();
    return pokemonData.value.pokemon.moves.filter((move: any) =>
        move.move.name.toLowerCase().includes(search),
    );
});

onMounted(async () => {
    const pokemonId = route.params.id as string;
    if (pokemonId) {
        pokemonData.value = await getCompletePokemonData(pokemonId);
    }
});

function goBack() {
    router.go(-1);
}

function formatPokemonId(id: number): string {
    return `#${id.toString().padStart(4, "0")}`;
}

function getMainImage(pokemon: PokemonDetail): string {
    if (showShiny.value) {
        return (
            pokemon.sprites.other?.["official-artwork"]?.front_shiny ||
            pokemon.sprites.front_shiny ||
            pokemon.sprites.other?.["official-artwork"]?.front_default ||
            pokemon.sprites.front_default ||
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
        );
    }

    return (
        pokemon.sprites.other?.["official-artwork"]?.front_default ||
        pokemon.sprites.versions?.["generation-v"]?.["black-white"]?.animated
            ?.front_default ||
        pokemon.sprites.front_default ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
    );
}

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

function getTotalStats(): number {
    if (!pokemonData.value?.pokemon.stats) return 0;
    return pokemonData.value.pokemon.stats.reduce(
        (total: number, stat: any) => total + stat.base_stat,
        0,
    );
}

function getPokemonGenus(): string {
    if (!pokemonData.value?.species?.genera) return "Unknown";
    const englishGenus = pokemonData.value.species.genera.find(
        (g: any) => g.language.name === "en",
    );
    return englishGenus?.genus || "Unknown";
}

function hasShiny(pokemon: PokemonDetail): boolean {
    return !!(
        pokemon.sprites.front_shiny ||
        pokemon.sprites.other?.["official-artwork"]?.front_shiny
    );
}

function toggleShiny() {
    showShiny.value = !showShiny.value;
}

function getMainSprites(pokemon: PokemonDetail) {
    return {
        front_default: pokemon.sprites.front_default,
        back_default: pokemon.sprites.back_default,
        front_female: pokemon.sprites.front_female,
        back_female: pokemon.sprites.back_female,
    };
}

function getShinySprites(pokemon: PokemonDetail) {
    return {
        front_shiny: pokemon.sprites.front_shiny,
        back_shiny: pokemon.sprites.back_shiny,
        front_shiny_female: pokemon.sprites.front_shiny_female,
        back_shiny_female: pokemon.sprites.back_shiny_female,
    };
}
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
</style>
