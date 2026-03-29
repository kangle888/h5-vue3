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
          title: "动态"
        }
      },
      {
        path: "my",
        name: "My",
        component: () => import("@/views/my/index.vue"),
        meta: {
          title: "我的",
          noCache: true
        }
      },
      {
        path: "my/edit",
        name: "MyEdit",
        component: () => import("@/views/my/edit.vue"),
        meta: {
          title: "编辑资料",
          noCache: true,
          hideTabBar: true
        }
      },
      {
        path: "my/settings",
        name: "MySettings",
        component: () => import("@/views/my/settings.vue"),
        meta: {
          title: "设置",
          noCache: true,
          hideTabBar: true
        }
      },
      {
        path: "my/change-password",
        name: "ChangePassword",
        component: () => import("@/views/my/change-password.vue"),
        meta: {
          title: "修改密码",
          noCache: true,
          hideTabBar: true
        }
      },
      {
        path: "news",
        name: "News",
        component: () => import("@/views/news/index.vue"),
        meta: {
          title: "消息",
          noCache: true
        }
      }
    ]
  },
  // 独立页面：不带 Tabbar，有自己的顶部导航栏
  {
    path: "/landingPage",
    name: "LandingPage",
    component: () => import("@/views/landingPage/index.vue"),
    meta: {
      title: "遇见app"
    }
  },
  {
    path: "/home/detail",
    name: "Detail",
    component: () => import("@/views/home/detail.vue"),
    meta: {
      title: "人物详情",
      hideTabBar: true
    }
  },
  {
    path: "/news/chatPage",
    name: "NewsChatPage",
    component: () => import("@/views/news/chatPage.vue"),
    meta: {
      title: "聊天",
      noCache: true,
      hideTabBar: true
    }
  }
];

export default routes;
