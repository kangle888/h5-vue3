<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { showFailToast, showSuccessToast, Swipe, SwipeItem } from "vant";
import { useRoute } from "vue-router";
import iosQr from "@/assets/download.png";
import {
  getAttachmentObjectUrl,
  getPromotionPageInfo,
  initTraceApi,
  trackPromotionEvent,
  writeClipboard,
  type IPromotionPageInfo
} from "@/api/home";
import { getSysBannerInfoApi, type ISysBannerItem } from "@/api/sys-banner";

defineOptions({ name: "LandingPage" });
const route = useRoute();
const loading = ref(false);
const banners = ref<(ISysBannerItem & { imageSrc: string })[]>([]);
const pageInfo = ref<IPromotionPageInfo>({});
// traceId: 服务端生成，存入 localStorage 和剪贴板，用于 App 首次登录归因
const currentTraceId = ref("");

const promotionParams = computed(() => {
  const query = route.query;
  return {
    pageId: String(query.pageId || query.pid || ""),
    channelId: String(query.channelId || query.cid || ""),
    staffId: String(query.staffId || query.sid || ""),
    traceId: String(query.traceId || "")
  };
});

const normalizeList = (res: ISysBannerItem[] | ISysBannerItem) => {
  if (Array.isArray(res)) return res;
  if (!res) return [];
  return [res];
};

const getBannerFiles = (item: ISysBannerItem) => {
  const list = [
    item.banner1,
    item.banner2,
    item.banner3,
    item.banner4,
    item.banner5
  ];
  return list.map(v => (v || "").trim()).filter(Boolean);
};

const loadBanners = async () => {
  loading.value = true;
  try {
    const res = await getSysBannerInfoApi();
    const list = normalizeList(res).filter(item => item.status !== "0");

    const rows: (ISysBannerItem & { imageSrc: string })[] = [];

    for (const item of list) {
      const files = getBannerFiles(item);

      if (!files.length) {
        const fallback = item.imageUrl || item.image || "";
        if (fallback) {
          let imageSrc = "";
          if (
            fallback.startsWith("http://") ||
            fallback.startsWith("https://") ||
            fallback.startsWith("blob:")
          ) {
            imageSrc = fallback;
          } else {
            imageSrc = await getAttachmentObjectUrl(fallback);
          }
          if (imageSrc) rows.push({ ...item, imageSrc });
        }
        continue;
      }

      for (const fileName of files) {
        const imageSrc = await getAttachmentObjectUrl(fileName);
        if (imageSrc) {
          rows.push({ ...item, imageSrc });
        }
      }
    }

    banners.value = rows;
  } catch {
    showFailToast("落地页加载失败");
  } finally {
    loading.value = false;
  }
};

const loadPromotionPageInfo = async () => {
  try {
    const res = await getPromotionPageInfo(promotionParams.value);
    pageInfo.value = res || {};
  } catch {
    pageInfo.value = {};
  }
};

const trackEvent = async (eventType: "download_click") => {
  try {
    await trackPromotionEvent({
      ...promotionParams.value,
      traceId: currentTraceId.value,
      eventType,
      sourcePath: route.fullPath,
      userAgent: navigator.userAgent,
      platform: route.query.platform ? String(route.query.platform) : "h5"
    });
  } catch {
    // ignore
  }
};

/** 初始化推广追踪：由服务端生成 traceId，并将其写入剪贴板和 localStorage */
const initTrace = async () => {
  try {
    const res = await initTraceApi(promotionParams.value);
    const traceId = (res as any)?.data?.traceId || (res as any)?.traceId || "";
    if (!traceId) return;
    currentTraceId.value = traceId;
    // 写入 localStorage（供同域 H5 登录页读取）
    localStorage.setItem("promotion_trace_id", traceId);
    localStorage.setItem(
      "promotion_page_id",
      promotionParams.value.pageId || ""
    );
    localStorage.setItem(
      "promotion_channel_id",
      promotionParams.value.channelId || ""
    );
    localStorage.setItem(
      "promotion_staff_id",
      promotionParams.value.staffId || ""
    );
    // 写入剪贴板（格式固定，App 读取后解析）
    await writeClipboard(
      `PROMO:${traceId}:${promotionParams.value.channelId || ""}:${promotionParams.value.staffId || ""}`
    );
  } catch {
    // ignore
  }
};

/**
 * 下载处理：
 * 1. 先调后端记录 download_click 事件（等待完成再跳转，防止网络差导致没记到）
 * 2. 通过后端 /promotion/download 中转跳转，自动携带 pageId/channelId/staffId/traceId 等归因参数
 * 3. 如果后端中转失败，应急备用直连下载URL，不阻塞用户
 */
const handleDownload = async () => {
  // 先记录下载点击事件（await 确保记录到了再跳转）
  try {
    await trackPromotionEvent({
      ...promotionParams.value,
      traceId: currentTraceId.value,
      eventType: "download_click",
      userAgent: navigator.userAgent,
      platform: /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "android"
    });
  } catch {
    // 记录失败不阻塞下载
  }

  // 构建带归因参数的后端中转地址
  const platform = /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "android";
  const params = new URLSearchParams();
  if (promotionParams.value.pageId)    params.set("pageId",    promotionParams.value.pageId);
  if (promotionParams.value.channelId) params.set("channelId", promotionParams.value.channelId);
  if (promotionParams.value.staffId)   params.set("staffId",   promotionParams.value.staffId);
  if (currentTraceId.value)            params.set("traceId",   currentTraceId.value);
  params.set("platform", platform);

  const baseApi = import.meta.env.VITE_BASE_API || "";
  const redirectUrl = baseApi
    ? `${baseApi}/promotion/download?${params.toString()}`
    : "https://beta4.appdone.club/UlWG";  // 备用，不应该走到这里

  // 跳转：后端会 302 重定向到真实下载地址
  window.location.href = redirectUrl;
};

onMounted(async () => {
  await loadPromotionPageInfo();
  // initTrace 替代旧的 visit track：服务端生成 traceId，写剪贴板，写 localStorage
  await initTrace();
  await loadBanners();
});
</script>

<template>
  <div class="landing-page">
    <div v-if="loading" class="loading-wrap">
      <van-loading color="#d7b98f" />
    </div>

    <template v-else>
      <Swipe
        v-if="banners.length"
        class="landing-swiper"
        vertical
        :loop="true"
        :autoplay="3500"
        :show-indicators="true"
        indicator-color="#d7b98f"
      >
        <SwipeItem v-for="item in banners" :key="item.id || item.imageSrc">
          <div class="slide-page">
            <img class="hero-bg" :src="item.imageSrc" alt="banner" />
            <div class="overlay"></div>

            <div class="center-content">
              <div class="download-section">
                <div class="qr-grid">
                  <div class="qr-card">
                    <p class="qr-label">iOS 下载</p>
                    <button class="download-link" @click="handleDownload()">
                      下载 iOS
                    </button>
                  </div>
                  <div class="qr-card">
                    <p class="qr-label">Android 下载</p>
                    <button class="download-link" @click="handleDownload()">
                      下载 Android
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SwipeItem>
      </Swipe>

      <div v-else class="empty-wrap">
        <p>暂无落地页内容</p>
      </div>
    </template>
  </div>
</template>

<style scoped lang="less">
.landing-page {
  min-height: 100vh;
  background: #030412;
  color: #fff;
}

.loading-wrap,
.empty-wrap {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
}

.landing-swiper {
  height: 100%;

  :deep(.van-swipe__indicators--right) {
    right: 10px;
  }

  :deep(.van-swipe__indicator) {
    width: 8px;
    height: 8px;
    margin: 5px 0;
    background: rgba(255, 255, 255, 0.3);
  }

  :deep(.van-swipe__indicator--active) {
    background: #d7b98f;
    height: 18px;
    border-radius: 10px;
  }
}

.slide-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: visible;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 40px;
}

.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(4, 6, 20, 0.4) 0%,
    rgba(4, 6, 20, 0.75) 100%
  );
}

.center-content {
  position: relative;
  margin: 0 24px 40px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.brand {
  font-size: 42px;
  font-weight: 700;
  color: #e6caa0;
  margin: 0;
}

.slogan {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 700;
  color: #e6caa0;
}

.download-section {
  width: 100%;
  margin-top: 18px;
  padding: 14px 14px 12px;
  border-radius: 18px;
  background: linear-gradient(
    180deg,
    rgba(12, 17, 36, 0.36) 0%,
    rgba(12, 17, 36, 0.12) 100%
  );
  border: 1px solid rgba(215, 185, 143, 0.18);
  backdrop-filter: blur(4px);
}

.download-title {
  font-size: 15px;
  font-weight: 700;
  color: #f1d8b3;
  text-align: center;
}

.qr-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.qr-card {
  padding: 10px 8px 8px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-img {
  width: 112px;
  height: 112px;
  border-radius: 10px;
  background: #fff;
  padding: 6px;
  object-fit: contain;
}

.qr-label {
  margin: 8px 0 0;
  font-size: 13px;
  color: #f7e5ca;
}

.qr-tip {
  margin: 10px 0 0;
  font-size: 12px;
  text-align: center;
  color: rgba(255, 255, 255, 0.72);
}

.download-link {
  width: 100%;
  border: none;
  height: 30px;
  padding: 0 14px;
  border-radius: 15px;
  background: rgba(243, 228, 204, 0.9);
  color: #4f3620;
  font-size: 12px;
  margin-top: 8px;
}

.full-btn {
  width: 100%;
}
</style>
