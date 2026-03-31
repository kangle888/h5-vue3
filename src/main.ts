import { createApp } from "vue";
import { store } from "./store";
import "vant/lib/index.css";
import { ImagePreview } from "vant";
// normalize.css
import "normalize.css/normalize.css";
// 全局样式
import "./styles/index.less";
// tailwindcss
import "./styles/tailwind.css";
// svg icon
import "virtual:svg-icons-register";
import { initializeDarkMode } from "@/utils/dark-mode";
import App from "./App.vue";
import router from "./router";

initializeDarkMode();

const app = createApp(App);
app.use(store);
app.use(router);
app.use(ImagePreview);

app.mount("#app");
