<!-- components/PokemonCard.vue -->
<template>
  <Card 
    :data-pokemon-id="pokemon.id"
    class="flex flex-col items-center p-4 card hover:shadow-lg transition-all duration-200 cursor-pointer group"
    @click="$emit('show-details', pokemon)"
  >
    <div class="w-full flex justify-center relative">
      <!-- Loading skeleton -->
      <div 
        v-if="!imageLoaded && !imageError"
        class="w-24 h-24 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center"
      >
        <div class="w-8 h-8 bg-gray-300 rounded"></div>
      </div>
      
      <!-- Pokemon Image -->
      <img
        v-show="imageLoaded && !imageError"
        ref="imageRef"
        :src="imageSrc"
        :alt="pokemon.name"
        class="w-24 h-24 object-contain select-none pokemon-img transition-all duration-300"
        @load="onImageLoad"
        @error="onImageError"
        loading="lazy"
      />
      
      <!-- Error state -->
      <div 
        v-if="imageError"
        class="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"
      >
        <ImageOff class="w-8 h-8" />
      </div>
      
      <!-- Pokemon ID Badge -->
      <div class="absolute top-0 right-0 bg-black/20 text-white text-xs px-2 py-1 rounded-bl-lg backdrop-blur-sm">
        #{{ pokemon.id }}
      </div>
    </div>

    <div class="w-full text-center mt-3 space-y-1">
      <h3 class="font-medium text-lg capitalize group-hover:text-blue-600 transition-colors">
        {{ pokemon.name }}
      </h3>
      <p class="text-sm text-muted-foreground">
        {{ formatPokemonId(pokemon.id) }}
      </p>
    </div>

    <div class="w-full mt-3">
      <Button
        class="w-full group-hover:bg-blue-600 group-hover:text-white transition-all"
        size="sm"
        variant="outline"
        @click.stop="$emit('show-details', pokemon)"
      >
        <Eye class="w-4 h-4 mr-2" />
        View Details
      </Button>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { PokemonSummary } from '@/composables/usePokemon';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, ImageOff } from 'lucide-vue-next';

interface Props {
  pokemon: PokemonSummary;
  imageSrc: string;
}

interface Emits {
  (e: 'show-details', pokemon: PokemonSummary): void;
  (e: 'image-loaded', pokemon: PokemonSummary): void;
  (e: 'image-error', pokemon: PokemonSummary): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const imageRef = ref<HTMLImageElement>();
const imageLoaded = ref(false);
const imageError = ref(false);
const observer = ref<IntersectionObserver | null>(null);

// Format Pokemon ID with leading zeros
function formatPokemonId(id: number): string {
  return `#${id.toString().padStart(4, '0')}`;
}

function onImageLoad() {
  imageLoaded.value = true;
  imageError.value = false;
  emit('image-loaded', props.pokemon);
}

function onImageError() {
  imageError.value = true;
  imageLoaded.value = false;
  emit('image-error', props.pokemon);
}

// Setup intersection observer for lazy loading
onMounted(() => {
  if (!imageRef.value) return;
  
  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && imageRef.value) {
          // Load the image when it comes into view
          if (props.imageSrc && props.imageSrc !== 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=') {
            imageRef.value.src = props.imageSrc;
          }
          observer.value?.disconnect();
        }
      });
    },
    {
      rootMargin: '50px',
      threshold: 0.1
    }
  );

  observer.value.observe(imageRef.value);
});

onUnmounted(() => {
  observer.value?.disconnect();
});
</script>

<style scoped>
.text-muted-foreground {
  color: rgba(100, 116, 139, 1);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.pokemon-img {
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.group:hover .pokemon-img {
  transform: translateY(-4px) scale(1.05);
  filter: drop-shadow(0 8px 16px rgba(15, 23, 42, 0.15));
  animation: float 2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .pokemon-img {
    animation: none !important;
    transition: none !important;
  }
}

/* Card hover effects */
.card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}
</style>