<template>
  <van-tabbar
    v-model="active"
    class="app-tabbar"
    active-color="#dfc293"
    inactive-color="#666"
    :placeholder="true"
    :route="true"
    fixed
    :border="false"
  >
    <van-tabbar-item
      v-for="(item, index) in tabbarData"
      :key="index"
      :icon="item.icon"
      :to="item.to"
      :badge="item.badge"
    >
      {{ item.title }}
    </van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";

interface TabItem {
  icon: string;
  title: string;
  to: { name: string };
  badge?: number | string;
}

const active = ref(0);
const tabbarData = reactive<TabItem[]>([
  {
    icon: "home-o",
    title: "首页",
    to: { name: "Home" }
  },
  {
    icon: "guide-o",
    title: "动态",
    to: { name: "Tools" }
  },
  {
    icon: "chat-o",
    title: "消息",
    to: { name: "News" },
    badge: 14
  },
  {
    icon: "user-o",
    title: "我的",
    to: { name: "My" }
  }
]);
</script>

<style scoped>
.app-tabbar {
  z-index: 3000;
  background-color: #0d0d0d !important; /* Very dark background */
  border-top: 1px solid #1a1a1a;
}

:deep(.van-tabbar) {
  z-index: 3000 !important;
  background-color: transparent !important;
}

:deep(.van-tabbar-item--active) {
  background-color: transparent !important;
}

:deep(.van-badge) {
  background-color: #ec4899; /* Pinkish red badge */
  border: 1px solid #0d0d0d;
}
</style>
