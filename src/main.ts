import { createApp } from "vue";
import { store } from "./store";
import "vant/lib/index.css";
import "normalize.css/normalize.css";
import "./styles/index.less";
import "./styles/tailwind.css";
import "virtual:svg-icons-register";
import { initializeDarkMode } from "@/utils/dark-mode";
import App from "./App.vue";
import router from "./router";

initializeDarkMode();

const app = createApp(App);
app.use(store);
app.use(router);

router.isReady().then(() => {
  app.mount("#app");
});
