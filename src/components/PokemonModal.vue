<!-- components/PokemonModal.vue -->
<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen && pokemon"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Modal Content -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 transform scale-95 translate-y-4"
          enter-to-class="opacity-100 transform scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 transform scale-100 translate-y-0"
          leave-to-class="opacity-0 transform scale-95 translate-y-4"
        >
          <Card
            v-if="isOpen && pokemon"
            class="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-full overflow-hidden bg-white shadow-md">
                  <img
                    :src="getMainImage(pokemon)"
                    :alt="pokemon.name"
                    class="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 class="text-2xl font-bold capitalize text-gray-800">
                    {{ pokemon.name }}
                  </h2>
                  <p class="text-lg text-gray-600">
                    {{ formatPokemonId(pokemon.id) }}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                class="rounded-full hover:bg-gray-100"
                @click="$emit('close')"
              >
                <X class="w-5 h-5" />
              </Button>
            </div>

            <!-- Content -->
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Image Section -->
                <div class="flex flex-col items-center">
                  <div class="relative">
                    <img
                      :src="getMainImage(pokemon)"
                      :alt="pokemon.name"
                      class="w-48 h-48 object-contain pokemon-showcase"
                    />
                  </div>

                  <!-- Types -->
                  <div class="flex gap-2 mt-4">
                    <span
                      v-for="type in pokemon.types"
                      :key="type.type.name"
                      :class="getTypeColor(type.type.name)"
                      class="px-3 py-1 rounded-full text-sm font-medium text-white capitalize shadow-md"
                    >
                      {{ type.type.name }}
                    </span>
                  </div>
                </div>

                <!-- Details Section -->
                <div class="space-y-4">
                  <!-- Basic Info -->
                  <div class="grid grid-cols-2 gap-4">
                    <div class="bg-gray-50 p-3 rounded-lg">
                      <p class="text-sm text-gray-600">Height</p>
                      <p class="text-lg font-semibold">{{ (pokemon.height / 10).toFixed(1) }} m</p>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg">
                      <p class="text-sm text-gray-600">Weight</p>
                      <p class="text-lg font-semibold">{{ (pokemon.weight / 10).toFixed(1) }} kg</p>
                    </div>
                  </div>

                  <!-- Base Experience -->
                  <div v-if="pokemon.base_experience" class="bg-blue-50 p-3 rounded-lg">
                    <p class="text-sm text-gray-600">Base Experience</p>
                    <p class="text-lg font-semibold text-blue-600">{{ pokemon.base_experience }}</p>
                  </div>

                  <!-- Abilities -->
                  <div>
                    <h3 class="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Zap class="w-5 h-5 text-yellow-500" />
                      Abilities
                    </h3>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="ability in pokemon.abilities"
                        :key="ability.ability.name"
                        :class="ability.is_hidden ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-green-100 text-green-700 border-green-200'"
                        class="px-3 py-1 rounded-lg text-sm font-medium capitalize border"
                      >
                        {{ ability.ability.name.replace('-', ' ') }}
                        <span v-if="ability.is_hidden" class="ml-1 text-xs">(Hidden)</span>
                      </span>
                    </div>
                  </div>

                  <!-- Base Stats Preview -->
                  <div>
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                      <BarChart3 class="w-5 h-5 text-blue-500" />
                      Stats Overview
                    </h3>
                    <div class="space-y-2">
                      <div
                        v-for="stat in pokemon.stats.slice(0, 3)"
                        :key="stat.stat.name"
                        class="flex items-center gap-3"
                      >
                        <span class="text-sm font-medium capitalize w-16 text-gray-600">
                          {{ getStatName(stat.stat.name) }}
                        </span>
                        <div class="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            :style="{ width: `${Math.min((stat.base_stat / 200) * 100, 100)}%` }"
                            :class="getStatColor(stat.base_stat)"
                            class="h-full rounded-full transition-all duration-500"
                          ></div>
                        </div>
                        <span class="text-sm font-semibold w-8 text-right">{{ stat.base_stat }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex justify-between items-center p-6 border-t bg-gray-50">
              <Button variant="outline" @click="$emit('close')">
                <ArrowLeft class="w-4 h-4 mr-2" />
                Back to List
              </Button>
              <Button
                class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                @click="$emit('view-full-details', pokemon)"
              >
                <Eye class="w-4 h-4 mr-2" />
                View Full Details
              </Button>
            </div>
          </Card>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PokemonDetail } from '@/composables/usePokemon';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Zap, BarChart3, Eye, ArrowLeft } from 'lucide-vue-next';

interface Props {
  pokemon: PokemonDetail | null;
  isOpen: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'view-full-details', pokemon: PokemonDetail): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('close');
  }
}

function formatPokemonId(id: number): string {
  return `#${id.toString().padStart(4, '0')}`;
}

function getMainImage(pokemon: PokemonDetail): string {
  // Priority: official artwork > animated > front_default
  return (
    pokemon.sprites.other?.['official-artwork']?.front_default ||
    pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default ||
    pokemon.sprites.front_default ||
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
  );
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    normal: 'bg-gray-400',
    fire: 'bg-red-500',
    water: 'bg-blue-500',
    electric: 'bg-yellow-400',
    grass: 'bg-green-500',
    ice: 'bg-blue-300',
    fighting: 'bg-red-700',
    poison: 'bg-purple-500',
    ground: 'bg-yellow-600',
    flying: 'bg-indigo-400',
    psychic: 'bg-pink-500',
    bug: 'bg-green-400',
    rock: 'bg-yellow-800',
    ghost: 'bg-purple-700',
    dragon: 'bg-indigo-700',
    dark: 'bg-gray-800',
    steel: 'bg-gray-500',
    fairy: 'bg-pink-300',
  };
  return colors[type] || 'bg-gray-400';
}

function getStatName(statName: string): string {
  const names: Record<string, string> = {
    hp: 'HP',
    attack: 'ATK',
    defense: 'DEF',
    'special-attack': 'SP.A',
    'special-defense': 'SP.D',
    speed: 'SPD',
  };
  return names[statName] || statName;
}

function getStatColor(value: number): string {
  if (value >= 120) return 'bg-green-500';
  if (value >= 90) return 'bg-yellow-500';
  if (value >= 60) return 'bg-orange-500';
  return 'bg-red-500';
}
</script>

<style scoped>
.pokemon-showcase {
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1));
  transition: transform 0.3s ease;
}

.pokemon-showcase:hover {
  transform: scale(1.05);
}

/* Custom scrollbar */
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
</style>
