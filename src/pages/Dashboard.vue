<script setup lang="ts">
import { onMounted, watch } from "vue";
import { usePokemonApi } from "@/composables/usePokemonApi";

const { pokemons, loading, error, fetchAll } = usePokemonApi();

onMounted(() => {
    fetchAll(20);
});

// Debug: log whenever pokemons change
watch(pokemons, (newValue) => {
    console.log("Pokémon loaded:", newValue);
});
</script>

<template>
    <div class="dashboard">
        <h1>Pokédex Dashboard</h1>

        <div v-if="loading">Loading Pokémon...</div>
        <div v-if="error" class="error">{{ error }}</div>

        <ul v-if="pokemons.length" class="pokemon-list">
            <li v-for="p in pokemons" :key="p.id" class="pokemon-item">
                <img
                    :src="
                        p.sprites.versions['generation-v']['black-white']
                            .animated.front_default || p.sprites.front_default
                    "
                    :alt="p.name"
                />
                <div>{{ p.id }}. {{ p.name }}</div>
            </li>
        </ul>
    </div>
</template>

<style scoped>
.dashboard {
    padding: 1.5rem;
    font-family: sans-serif;
}
.pokemon-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
    list-style: none;
    padding: 0;
}
.pokemon-item {
    background: #f3f3f3;
    border-radius: 8px;
    text-align: center;
    padding: 0.5rem;
    font-weight: bold;
    text-transform: capitalize;
    transition: background 0.2s ease;
}
.pokemon-item:hover {
    background: #e0e0e0;
}
.error {
    color: red;
    font-weight: bold;
}
.pokemon-item img {
    width: 96px;
    height: 96px;
    image-rendering: pixelated;
}
</style>
