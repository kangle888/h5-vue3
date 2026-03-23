import {
  createRouter,
  createWebHashHistory,
  type RouteLocationNormalized
} from "vue-router";
import routes from "./routes";
import { useCachedViewStoreHook } from "@/store/modules/cached-view";
import NProgress from "@/utils/progress";
import setPageTitle from "@/utils/set-page-title";

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export interface toRouteType extends RouteLocationNormalized {
  meta: {
    title?: string;
    noCache?: boolean;
  };
}

router.beforeEach((to: toRouteType, _from, next) => {
  NProgress.start();

  const token = localStorage.getItem("token");
  const isLoginPage = to.name === "Login";

  // 未登录：仅允许访问登录页
  if (!token && !isLoginPage) {
    next({ name: "Login" });
    return;
  }

  // 已登录：访问登录页时跳转首页
  if (token && isLoginPage) {
    next({ name: "Home" });
    return;
  }

  // 路由缓存
  useCachedViewStoreHook().addCachedView(to);
  // 页面 title
  setPageTitle(to.meta.title);
  next();
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
