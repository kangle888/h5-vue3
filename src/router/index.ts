import {
  createRouter,
  createWebHashHistory,
  type RouteLocationNormalized
} from "vue-router";
import routes from "./routes";
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

  if (!to.meta.title) {
    setPageTitle("活动抽奖");
  } else {
    setPageTitle(to.meta.title);
  }

  next();
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
