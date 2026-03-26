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
const hideNavRouteNames = ["Home", "Tools", "News", "My"];

const showNavBar = computed(() => {
  const currentName = route.name as string | undefined;
  return !currentName || !hideNavRouteNames.includes(currentName);
});

const navBarTitle = computed(() => {
  return typeof route.meta?.title === "string" ? route.meta.title : "";
});

// const isDetailPage = computed(() => {
//   return route.name === "Detail";
// });

const showTabBar = computed(() => {
  return route.meta?.hideTabBar !== true;
});
</script>

<template>
  <div class="app-wrapper">
    <nav-bar
      v-if="showNavBar"
      :title="navBarTitle"
      :leftArrow="true"
      @click-left="router.back"
    />
    <router-view v-slot="{ Component }">
      <keep-alive :include="cachedViews">
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <tabbar v-if="showTabBar" />
  </div>
</template>

<style lang="less" scoped>
@import "@/styles/mixin.less";

.app-wrapper {
  .clearfix();
  position: relative;
  height: calc(100vh - 50px);
  width: 100%;
}
</style>
