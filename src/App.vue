<script setup lang="ts">
import { reactive } from "vue";

const data = reactive({
    name: "Pokedex",
    version: "2.0",
});
</script>

<template>
    <div>
        <header>
            <h1>{{ data.name }} {{ data.version }}</h1>
        </header>

        <!-- Render route views here -->
        <router-view />
    </div>
</template>

<style scoped>
header {
    background: #ef5350;
    color: white;
    padding: 1rem;
    font-size: 1.5rem;
}
</style>
