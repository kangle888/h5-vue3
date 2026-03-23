<script setup lang="ts">
import tabbar from "@/components/tabbar/index.vue";
import NavBar from "@/components/nav-bar/index.vue";
import { useCachedViewStoreHook } from "@/store/modules/cached-view";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const cachedViews = computed(() => {
  return useCachedViewStoreHook().cachedViewList;
});

const route = useRoute();
const router = useRouter();
const hideNavRouteNames = ["Home", "Tools", "About", "Mine"];

const showNavBar = computed(() => {
  const currentName = route.name as string | undefined;
  return !currentName || !hideNavRouteNames.includes(currentName);
});

const navBarTitle = computed(() => {
  return typeof route.meta?.title === "string" ? route.meta.title : "";
});

const isDetailPage = computed(() => {
  return route.name === "Detail";
});
</script>

<template>
  <div class="app-wrapper">
    <nav-bar v-if="showNavBar" :title="navBarTitle" :leftArrow="isDetailPage" @click-left="router.back" />
    <router-view v-slot="{ Component }">
      <keep-alive :include="cachedViews">
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <tabbar />
  </div>
</template>

<style lang="less" scoped>
@import "@/styles/mixin.less";

.app-wrapper {
  .clearfix();
  position: relative;
  height: 100%;
  width: 100%;
}
</style>
