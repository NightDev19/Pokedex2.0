// main.ts
import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router"; // ✅ default import

createApp(App).use(router).mount("#app");
