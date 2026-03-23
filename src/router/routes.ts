import Layout from "@/layout/index.vue";
import type { RouteRecordRaw } from "vue-router";
import Home from "@/views/home/index.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: "登录",
      noCache: true
    }
  },
  {
    path: "/",
    name: "root",
    component: Layout,
    redirect: { name: "Login" },
    children: [
      {
        path: "home",
        name: "Home",
        component: Home,
        meta: {
          title: "主页"
        }
      },
      {
        path: "detail",
        name: "Detail",
        component: () => import("@/views/home/detail.vue"),
        meta: {
          title: "详情"
        }
      },
      {
        path: "tools",
        name: "Tools",
        component: () => import("@/views/tools/index.vue"),
        meta: {
          title: "工具"
        }
      },
      {
        path: "about",
        name: "About",
        component: () => import("@/views/about/index.vue"),
        meta: {
          title: "关于",
          noCache: true
        }
      }
    ]
  },
  // 独立页面：不带 Tabbar，有自己的顶部导航栏
  {
    path: "/demo-index",
    name: "DemoIndex",
    component: () => import("@/views/demo-index/index.vue"),
    meta: {
      title: "导航示例"
    }
  }
];

export default routes;
