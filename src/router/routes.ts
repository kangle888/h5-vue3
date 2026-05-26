import type { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/activity/home"
  },
  {
    path: "/activity/home",
    name: "ActivityHome",
    component: () => import("../views/activity/home.vue"),
    meta: {
      title: "活动首页",
      noCache: true,
      hideTabBar: true,
      hideNavBar: true,
      fullScreen: true
    }
  },
  {
    path: "/activity/draw",
    name: "ActivityDraw",
    component: () => import("@/views/activity/index.vue"),
    meta: {
      title: "活动抽奖",
      noCache: true,
      hideTabBar: true,
      hideNavBar: true,
      fullScreen: true
    }
  }
];

export default routes;
