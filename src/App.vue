<script setup lang="ts">
import { reactive } from "vue";

const data = reactive({
    name: "Pokedex",
    version: "2.0",
});
</script>

<template>
    <h1>{{ data.name }} {{ data.version }}</h1>
</template>

<style scoped></style>
