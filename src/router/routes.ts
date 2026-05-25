import type { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/activity",
    name: "Activity",
    component: () => import("@/views/activity/index.vue"),
    meta: {
      title: "活动抽奖",
      noCache: true
    }
  },
];

export default routes;
