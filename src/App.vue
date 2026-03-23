<script setup lang="ts">
import { useDarkMode } from "@/composables/useToggleDarkMode";
</script>

<template>
  <van-config-provider :theme="useDarkMode() ? 'dark' : 'light'">
    <router-view />
  </van-config-provider>
</template>

<style></style>
