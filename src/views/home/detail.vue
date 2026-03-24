<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ImagePreview, showFailToast } from "vant";
import { codeToText } from "element-china-area-data";
import {
  addPlayerCollect,
  deletePlayerCollect,
  getAttachmentObjectUrl,
  getPlayerActivity,
  pagePlayerCollect,
  queryById,
  type IPlayerActivityItem,
  type IPlayerItem
} from "@/api/home";
import { useRoute, useRouter } from "vue-router";

defineOptions({
  name: "Detail"
});

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const player = ref<IPlayerItem | null>(null);
const coverPreview = ref("");
const albumPreviewList = ref<string[]>([]);
const activities = ref<IPlayerActivityItem[]>([]);
const activityImageMap = ref<Record<string, string[]>>({});
const collectId = ref("");

const playerId = computed(() => {
  const raw = route.query.playerId ?? route.query.id;
  const v = Array.isArray(raw) ? raw[0] : raw;
  return typeof v === "string" ? v : "";
});

const albumFileNames = computed(() => {
  return (player.value?.album || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
});

const profileBadges = computed(() => {
  const list: string[] = [];
  list.push(`${player.value?.age || "25"}岁`);
  if (player.value?.constellation) list.push(player.value.constellation);
  if (player.value?.height) list.push(`${player.value.height}CM`);
  if (player.value?.weight) list.push(`${player.value.weight}KG`);
  return list;
});

const cityText = computed(() => {
  const city = player.value?.city;
  const fallback = "武汉市";
  if (!city) return fallback;
  const parts = city.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const lastCode = parts[parts.length - 1];
  return (codeToText as Record<string, string>)[lastCode] || lastCode;
});

const occupationText = computed(() => {
  return (
    player.value?.occupation_dictText || player.value?.occupation || "个人"
  );
});

const formatDateTime = (value?: string) => {
  if (!value) return "";
  return value.replace("T", " ");
};

const openAlbumPreview = (start: number) => {
  if (!albumPreviewList.value.length) return;
  ImagePreview({ images: albumPreviewList.value, startPosition: start });
};

const openActivityPreview = (activityId: string, start: number) => {
  const list = activityImageMap.value[activityId] || [];
  if (!list.length) return;
  ImagePreview({ images: list, startPosition: start });
};

const goContactAdmin = () => {
  router.push({ name: "NewsChatPage" });
};

const loadCollectStatus = async (id: string) => {
  try {
    const res = await pagePlayerCollect({
      pageNum: 1,
      pageSize: 1,
      query: { playerId: id, isCancel: "0" }
    });
    collectId.value = res?.records?.[0]?.id || "";
  } catch {
    collectId.value = "";
  }
};

const toggleCollect = async () => {
  if (!player.value?.id) return;
  try {
    if (collectId.value) {
      await deletePlayerCollect(collectId.value);
      collectId.value = "";
    } else {
      const res = await addPlayerCollect({ playerId: player.value.id });
      collectId.value = res || "";
    }
  } catch {
    showFailToast("收藏操作失败");
  }
};

const buildPreviewData = async () => {
  const avatarFile = player.value?.avatar || "";
  const firstAlbum = albumFileNames.value[0] || "";
  coverPreview.value = await getAttachmentObjectUrl(avatarFile || firstAlbum);

  const urls: string[] = [];
  for (const fileName of albumFileNames.value) {
    const url = await getAttachmentObjectUrl(fileName);
    if (url) urls.push(url);
  }
  albumPreviewList.value = urls;
};

const loadActivities = async (id: string) => {
  const params = { playerId: id, pageNum: 1, pageSize: 100 };
  const activityRes = await getPlayerActivity(params);
  activities.value = activityRes?.records || [];

  const nextMap: Record<string, string[]> = {};
  for (const act of activities.value) {
    if (!act.id) continue;
    const names = [act.image1, act.image2, act.image3].filter(
      Boolean
    ) as string[];
    const urls: string[] = [];
    for (const name of names) {
      const url = await getAttachmentObjectUrl(name);
      if (url) urls.push(url);
    }
    nextMap[act.id] = urls;
  }
  activityImageMap.value = nextMap;
};

const loadDetail = async () => {
  const id = playerId.value;
  if (!id) {
    showFailToast("缺少详情参数");
    return;
  }

  loading.value = true;
  try {
    const detailRes = await queryById(id);
    player.value = detailRes ?? null;
    await buildPreviewData();
    await loadActivities(id);
    await loadCollectStatus(id);
  } catch {
    showFailToast("加载详情失败");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDetail();
});
</script>

<template>
  <div class="detail-page">
    <div class="top-bar">
      <van-icon name="arrow-left" size="20" @click="router.back()" />
    </div>

    <div v-if="loading" class="loading-wrap">
      <van-loading color="#d4b076" />
    </div>

    <div v-else class="content-wrap">
      <div v-if="player" class="hero-section">
        <img
          v-if="coverPreview"
          :src="coverPreview"
          class="hero-cover"
          alt="cover"
        />
        <div v-else class="hero-empty">暂无图片</div>

        <div class="base-card">
          <div class="name-row">
            <div class="name-wrap">
              <span class="name">{{ player.name || "匿名" }}</span>
              <span class="auth-badge">真人</span>
            </div>
            <van-icon
              :name="collectId ? 'like' : 'like-o'"
              size="20"
              :color="collectId ? '#ff4d6d' : '#7c7c7c'"
              @click.stop="toggleCollect"
            />
          </div>

          <div class="id-row">ID {{ player.id || "-" }}</div>
          <div class="city-row">{{ cityText }} · 397m</div>
          <div class="occupation-row">{{ occupationText }}</div>

          <div class="tag-row">
            <span v-for="tag in profileBadges" :key="tag" class="tag-pill">{{
              tag
            }}</span>
          </div>

          <div
            v-if="player.signature_dictText || player.signature"
            class="single-tag-row"
          >
            <span class="tag-pill">{{
              player.signature_dictText || player.signature
            }}</span>
          </div>
        </div>
      </div>

      <div v-else class="empty-wrap">
        <div class="empty">暂无数据</div>
        <van-button type="default" @click="router.replace({ name: 'Home' })"
          >返回首页</van-button
        >
      </div>

      <template v-if="player">
        <div class="section">
          <div class="section-title">相册</div>
          <div class="album-grid">
            <img
              v-for="(img, idx) in albumPreviewList"
              :key="img + idx"
              class="album-item"
              :src="img"
              alt="album"
              @click="openAlbumPreview(idx)"
            />
          </div>
        </div>

        <div class="section">
          <div class="section-title">动态</div>
          <div v-if="activities.length" class="activity-list">
            <div v-for="act in activities" :key="act.id" class="activity-item">
              <div class="activity-content">
                {{ act.content || "[无内容]" }}
              </div>
              <div class="activity-meta">
                {{ act.city || cityText }} ·
                {{ formatDateTime(act.createTime) || "刚刚" }}
              </div>
              <div
                v-if="(activityImageMap[act.id || ''] || []).length"
                class="activity-image-grid"
              >
                <img
                  v-for="(img, idx) in activityImageMap[act.id || '']"
                  :key="img + idx"
                  class="activity-image"
                  :src="img"
                  alt="activity-image"
                  @click="openActivityPreview(act.id || '', idx)"
                />
              </div>
            </div>
          </div>
          <div v-else class="intro-text">
            {{ player.introduction || "这个人很懒，暂时还没有发布动态。" }}
          </div>
        </div>
      </template>
    </div>

    <div v-if="player" class="bottom-action">
      <button class="btn-chat" @click="goContactAdmin">联系管理员</button>
      <!-- <button class="btn-wechat">微信</button> -->
    </div>
  </div>
</template>

<style scoped lang="less">
.detail-page {
  min-height: 100vh;
  background: #000;
  color: #fff;
  position: relative;
}

.top-bar {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  z-index: 20;
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 14px;
}

.loading-wrap {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-wrap {
  padding-bottom: 94px;
}

.hero-section {
  position: relative;
}

.hero-cover,
.hero-empty {
  width: 100%;
  height: 360px;
  object-fit: cover;
  background: #181818;
}

.hero-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9f9f9f;
}

.base-card {
  margin-top: -22px;
  background: #050505;
  border-radius: 16px 16px 0 0;
  padding: 14px 14px 10px;
  border-top: 1px solid #151515;
  border-bottom: 1px solid #151515;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.name-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name {
  font-size: 28px;
  line-height: 1.1;
  font-weight: 800;
}

.auth-badge {
  font-size: 11px;
  color: #fff;
  background: #ef5479;
  padding: 2px 6px;
  border-radius: 6px;
}

.id-row,
.city-row,
.occupation-row {
  margin-top: 10px;
  color: #9a9a9a;
  font-size: 14px;
}

.tag-row,
.single-tag-row {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-pill {
  height: 28px;
  line-height: 28px;
  padding: 0 10px;
  border-radius: 14px;
  background: #27231d;
  color: #d8bc8b;
  font-size: 13px;
}

.section {
  padding: 16px 14px 0;
  border-bottom: 1px solid #121212;
}

.section-title {
  font-size: 30px;
  line-height: 1;
  font-weight: 800;
  margin-bottom: 12px;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding-bottom: 16px;
}

.album-item {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  object-fit: cover;
  background: #202020;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 16px;
}

.activity-item {
  border: 1px solid #1f1f1f;
  background: #0a0a0a;
  border-radius: 12px;
  padding: 10px;
}

.activity-content {
  font-size: 14px;
  color: #efefef;
  line-height: 1.7;
}

.activity-meta {
  margin-top: 8px;
  font-size: 12px;
  color: #929292;
}

.activity-image-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.activity-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  object-fit: cover;
  background: #222;
}

.intro-text {
  color: #d3d3d3;
  font-size: 15px;
  line-height: 1.7;
  padding-bottom: 16px;
}

.bottom-action {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 10px;
  z-index: 30;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn-chat,
.btn-wechat {
  border: none;
  height: 48px;
  border-radius: 14px;
  font-size: 34px;
  font-weight: 700;
}

.btn-chat {
  background: #f0d4a2;
  color: #17130d;
}

.btn-wechat {
  background: #3c3529;
  color: #f1d5a0;
}

.empty-wrap {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

.empty {
  color: #a4a4a4;
}
</style>
