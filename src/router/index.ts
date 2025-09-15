// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "@/views/Dashboard.vue";

const routes = [
  { path: "/", name: "Dashboard", component: Dashboard },
  // other routes...
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
