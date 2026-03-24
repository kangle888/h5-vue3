<template>
  <van-tabbar v-model="active" :placeholder="true" :route="true" fixed>
    <van-tabbar-item v-for="(item, index) in tabbarData" :key="index" :icon="item.icon" :to="item.to">
      {{ item.title }}
    </van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";

const active = ref(0);
const tabbarData = reactive([
  {
    icon: "home-o",
    title: "首页",
    to: { name: "Home" }
  },
  {
    icon: "fire-o",
    title: "动态",
    to: { name: "Tools" }
  },
  {
    icon: "chat-o",
    title: "消息",
    to: { name: "News" }
  },
  {
    icon: "contact-o",
    title: "我的",
    to: { name: "My" }
  }
]);
</script>
