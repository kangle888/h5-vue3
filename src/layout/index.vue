<script setup lang="ts">
import tabbar from "@/components/tabbar/index.vue";
import NavBar from "@/components/nav-bar/index.vue";
import { useCachedViewStoreHook } from "@/store/modules/cached-view";
import {
  getCurrentLocation,
  getLocationCache,
  saveLocationCache
} from "@/utils/location";
import { computed, onMounted } from "vue";
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

const LOCATION_REFRESH_INTERVAL = 10 * 60;

const shouldRefreshLocation = () => {
  const cache = getLocationCache();
  if (!cache) return true;
  return Date.now() - cache.timestamp > LOCATION_REFRESH_INTERVAL;
};

const refreshLocationIfNeeded = async () => {
  if (!shouldRefreshLocation()) return;
  try {
    const location = await getCurrentLocation({
      timeout: 10000,
      enableHighAccuracy: true,
      maximumAge: 0
    });
    console.log("获取到位置信息：", location);
    saveLocationCache(location);
  } catch {
    // 定位失败不影响主流程
  }
};

// onMounted(() => {
//   refreshLocationIfNeeded();
// });
</script>

<template>
  <div class="app-wrapper">
    <nav-bar v-if="showNavBar" :title="navBarTitle" :leftArrow="true" @click-left="router.back" />

    <main class="app-content">
      <router-view v-slot="{ Component }">
        <keep-alive :include="cachedViews">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>

    <tabbar v-if="showTabBar" />
  </div>
</template>

<style lang="less" scoped>
@import "@/styles/mixin.less";

.app-wrapper {
  .clearfix();
  position: relative;
  width: 100%;
  min-height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
}
</style>
