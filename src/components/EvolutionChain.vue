<!-- components/EvolutionChain.vue -->
<template>
    <div class="evolution-chain w-full overflow-x-auto">
        <div
            class="flex flex-col lg:flex-row items-center justify-center space-y-6 lg:space-y-0 lg:space-x-8"
        >
            <EvolutionNode
                :node="props.evolutionChain.chain"
                :current-pokemon-id="props.currentPokemonId"
                :is-root="true"
                @pokemon-click="handlePokemonClick"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { EvolutionChain } from "@/composables/usePokemon";
import EvolutionNode from "./EvolutionNode.vue";

interface Props {
    evolutionChain: EvolutionChain;
    currentPokemonId: number;
}

interface Emits {
    (e: "pokemon-click", pokemonName: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

function handlePokemonClick(pokemonName: string) {
    emit("pokemon-click", pokemonName);
}
</script>
