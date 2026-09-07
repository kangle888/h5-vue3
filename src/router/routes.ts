import type { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/activity/draw"
  },
  {
    path: "/activity/home",
    redirect: "/activity/draw"
  },
  {
    path: "/activity/draw",
    name: "ActivityDraw",
    component: () => import("@/views/activity/index.vue"),
    meta: {
      title: "幸运大转盘抽奖",
      noCache: true,
      hideTabBar: true,
      hideNavBar: true,
      fullScreen: true
    }
  }
];

export default routes;
