// router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "@/views/Dashboard.vue";
import PokemonDetails from "@/views/PokemonDetails.vue";

const routes = [
  {
    path: "/",
    name: "Dashboard",
    component: Dashboard,
    meta: { title: "Pokémon Dashboard" },
  },
  {
    path: "/pokemon/:id",
    name: "PokemonDetails",
    component: PokemonDetails,
    meta: { title: "Pokémon Details" },
    props: true,
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

// Global navigation guard for setting page titles
router.beforeEach((to, from, next) => {
  document.title = (to.meta.title as string) || "Pokémon App";
  next();
});

export default router;
