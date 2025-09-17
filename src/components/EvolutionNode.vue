<!-- components/EvolutionNode.vue -->
<template>
    <div class="flex flex-col lg:flex-row items-center">
        <!-- Current Pokemon -->
        <div class="flex flex-col items-center group">
            <div
                :class="
                    isCurrentPokemon
                        ? 'ring-4 ring-blue-400 ring-opacity-60'
                        : 'hover:ring-2 hover:ring-gray-300'
                "
                class="relative bg-white rounded-xl p-4 shadow-lg transition-all duration-200 cursor-pointer border-2 border-gray-100"
                @click="$emit('pokemon-click', node.species.name)"
            >
                <img
                    :src="getPokemonImage()"
                    :alt="node.species.name"
                    class="w-20 h-20 object-contain transition-transform group-hover:scale-110"
                    @error="onImageError"
                />
                <div
                    class="absolute top-1 right-1 bg-gray-800 text-white text-xs px-2 py-1 rounded-full"
                >
                    #{{ getPokemonId() }}
                </div>
            </div>

            <div class="mt-2 text-center">
                <h4 class="font-medium capitalize text-gray-800">
                    {{ formatName(node.species.name) }}
                </h4>
                <div
                    v-if="isCurrentPokemon"
                    class="text-xs text-blue-600 font-medium mt-1"
                >
                    Current
                </div>
            </div>
        </div>

        <!-- Evolution Arrow and Next Evolutions -->
        <div
            v-if="node.evolves_to.length > 0"
            class="flex flex-col lg:flex-row items-center"
        >
            <!-- Evolution Requirements and Arrow -->
            <div class="flex flex-col items-center mx-4 my-2 lg:my-0">
                <div class="evolution-requirements mb-2">
                    <div
                        v-for="(evolution, index) in node.evolves_to"
                        :key="index"
                        class="text-center space-y-1"
                    >
                        <div
                            v-if="evolution.evolution_details.length > 0"
                            class="text-xs bg-gray-100 rounded-lg px-3 py-2 max-w-32"
                        >
                            <div
                                v-for="detail in evolution.evolution_details"
                                :key="detail.trigger.name"
                                class="space-y-1"
                            >
                                <div class="font-medium text-gray-700">
                                    {{ formatTrigger(detail.trigger.name) }}
                                </div>
                                <div
                                    v-if="detail.min_level"
                                    class="text-gray-600"
                                >
                                    Lv. {{ detail.min_level }}
                                </div>
                                <div v-if="detail.item" class="text-gray-600">
                                    {{ formatName(detail.item.name) }}
                                </div>
                                <div
                                    v-if="detail.time_of_day"
                                    class="text-gray-600"
                                >
                                    {{ formatTimeOfDay(detail.time_of_day) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Arrow -->
                <div class="flex items-center justify-center">
                    <ArrowRight
                        class="w-6 h-6 text-gray-400 transform lg:rotate-0 rotate-90"
                    />
                </div>
            </div>

            <!-- Next Evolution Level -->
            <div
                class="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8"
            >
                <EvolutionNode
                    v-for="evolution in node.evolves_to"
                    :key="evolution.species.name"
                    :node="evolution"
                    :current-pokemon-id="currentPokemonId"
                    :is-root="false"
                    @pokemon-click="$emit('pokemon-click', $event)"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { EvolutionNode as EvolutionNodeType } from "@/composables/usePokemon";
import { ArrowRight } from "lucide-vue-next";

interface Props {
    node: EvolutionNodeType;
    currentPokemonId: number;
    isRoot: boolean;
}

interface Emits {
    (e: "pokemon-click", pokemonName: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const imageError = ref(false);

const isCurrentPokemon = computed(() => {
    const pokemonId = getPokemonId();
    return pokemonId === props.currentPokemonId;
});

function getPokemonId(): number {
    // Extract ID from species URL
    const match = props.node.species.url.match(/\/(\d+)\/$/);
    return match ? parseInt(match[1]) : 0;
}

function getPokemonImage(): string {
    const pokemonId = getPokemonId();
    if (imageError.value) {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
    }
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
}

function onImageError() {
    imageError.value = true;
}

function formatName(name: string): string {
    return name.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatTrigger(trigger: string): string {
    const triggers: Record<string, string> = {
        "level-up": "Level Up",
        "use-item": "Use Item",
        trade: "Trade",
        shed: "Shed",
        spin: "Spin",
        "tower-of-darkness": "Tower of Darkness",
        "tower-of-waters": "Tower of Waters",
        "three-critical-hits": "3 Critical Hits",
        "take-damage": "Take Damage",
        other: "Other",
    };
    return triggers[trigger] || formatName(trigger);
}

function formatTimeOfDay(time: string): string {
    const times: Record<string, string> = {
        day: "Day",
        night: "Night",
        dusk: "Dusk",
    };
    return times[time] || formatName(time);
}
</script>

<style scoped>
.evolution-requirements {
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Responsive arrow rotation */
@media (max-width: 1024px) {
    .transform {
        transform: rotate(90deg);
    }
}

/* Hover effects */
.group:hover img {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

/* Current Pokemon highlight */
.ring-4 {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6);
}

/* Smooth transitions */
* {
    transition: all 0.2s ease-in-out;
}
</style>
