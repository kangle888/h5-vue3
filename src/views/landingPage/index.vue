<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { showFailToast, showSuccessToast, Swipe, SwipeItem } from "vant";
import { useRoute } from "vue-router";
import iosQr from "@/assets/download.png";
import { getAttachmentObjectUrl, getPromotionDownloadUrl, getPromotionPageInfo, trackPromotionEvent, type IPromotionPageInfo } from "@/api/home";
import { getSysBannerInfoApi, type ISysBannerItem } from "@/api/sys-banner";

defineOptions({ name: "LandingPage" });
const route = useRoute();
const loading = ref(false);
const banners = ref<(ISysBannerItem & { imageSrc: string })[]>([]);
const pageInfo = ref<IPromotionPageInfo>({});
const trackedVisitKey = ref("");

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
  const list = [item.banner1, item.banner2, item.banner3, item.banner4, item.banner5];
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
          if (fallback.startsWith("http://") || fallback.startsWith("https://") || fallback.startsWith("blob:")) {
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

const buildTrackPayload = (eventType: "visit" | "download_click" | "install_open") => ({
  ...promotionParams.value,
  eventType,
  sourcePath: route.fullPath,
  userAgent: navigator.userAgent,
  platform: route.query.platform ? String(route.query.platform) : "h5",
  extra: {
    pageTitle: pageInfo.value.title || ""
  }
});

const trackEvent = async (eventType: "visit" | "download_click" | "install_open") => {
  const cacheKey = `${eventType}-${promotionParams.value.pageId}-${promotionParams.value.channelId}-${promotionParams.value.staffId}`;
  if (eventType === "visit" && trackedVisitKey.value === cacheKey) return;
  try {
    await trackPromotionEvent(buildTrackPayload(eventType));
    if (eventType === "visit") trackedVisitKey.value = cacheKey;
  } catch {
    // ignore track error
  }
};

const copyText = async (text: string) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showSuccessToast("已复制链接");
  } catch {
    showFailToast("复制失败，请手动复制");
  }
};

const downloadUrl = computed(() => pageInfo.value.downloadUrl || pageInfo.value.qrLink || "");
const iosQrUrl = computed(() => pageInfo.value.iosQr || iosQr);
const androidQrUrl = computed(() => pageInfo.value.androidQr || iosQr);
const pageTitle = computed(() => pageInfo.value.title || "遇见");

const buildDownloadUrl = (platform: "ios" | "android") => {
  return getPromotionDownloadUrl({
    pageId: promotionParams.value.pageId,
    channelId: promotionParams.value.channelId,
    staffId: promotionParams.value.staffId,
    traceId: promotionParams.value.traceId,
    platform
  });
};

const handleDownload = async (platform: "ios" | "android") => {
  await trackEvent("download_click");
  const url = buildDownloadUrl(platform);
  window.location.href = url;
};

onMounted(async () => {
  await loadPromotionPageInfo();
  await trackEvent("visit");
  await loadBanners();
});
</script>

<template>
  <div class="landing-page">
    <div v-if="loading" class="loading-wrap">
      <van-loading color="#d7b98f" />
    </div>

    <template v-else>
      <Swipe v-if="banners.length" class="landing-swiper" vertical :loop="true" :autoplay="3500" :show-indicators="true"
        indicator-color="#d7b98f">
        <SwipeItem v-for="item in banners" :key="item.id || item.imageSrc">
          <div class="slide-page">
            <img class="hero-bg" :src="item.imageSrc" alt="banner" />
            <div class="overlay"></div>

            <div class="center-content">
              <h1 class="brand">{{ pageTitle }}</h1>
              <p class="slogan">达人认证 · 超高颜值</p>

              <div class="download-section">
                <div class="download-title">扫码下载 App</div>
                <div class="qr-grid">
                  <div class="qr-card">
                    <img :src="iosQrUrl" class="qr-img" alt="ios-qr" />
                    <p class="qr-label">iOS 下载</p>
                    <button class="download-link" @click="handleDownload('ios')">下载 iOS</button>
                  </div>
                  <div class="qr-card">
                    <img :src="androidQrUrl" class="qr-img" alt="android-qr" />
                    <p class="qr-label">Android 下载</p>
                    <button class="download-link" @click="handleDownload('android')">下载 Android</button>
                  </div>
                </div>
                <p class="qr-tip">安装完成后返回桌面打开 App，系统将自动记录激活</p>
                <button class="download-link full-btn" @click="copyText(downloadUrl || buildDownloadUrl('android'))">复制真实下载链接</button>
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
  height: 100vh;
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
  height: 100vh;
  width: 100%;
  overflow: hidden;
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
  background: linear-gradient(180deg, rgba(4, 6, 20, 0.4) 0%, rgba(4, 6, 20, 0.75) 100%);
}

.center-content {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 120px;
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
  background: linear-gradient(180deg, rgba(12, 17, 36, 0.66) 0%, rgba(12, 17, 36, 0.42) 100%);
  border: 1px solid rgba(215, 185, 143, 0.3);
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
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
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
  background: #f3e4cc;
  color: #4f3620;
  font-size: 12px;
  margin-top: 8px;
}

.full-btn {
  width: 100%;
}
</style>
