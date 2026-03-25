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
  if (!player.value?.id) {
    showFailToast("缺少人物信息");
    return;
  }

  router.push({
    name: "NewsChatPage",
    query: {
      scene: "player",
      playerId: player.value.id,
      playerName: player.value.name || "神秘玩家"
    }
  });
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
  <div class="detail-page-wrapper relative min-h-screen w-full overflow-hidden">
    <!-- Animated background elements -->
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
    <div class="bg-shape shape-3"></div>

    <div class="relative z-10 box-border min-h-screen">
      <div class="top-bar">
        <div class="back-btn" @click="router.back()">
          <van-icon name="arrow-left" size="20" color="#fff" />
        </div>
      </div>

      <div v-if="loading" class="loading-wrap">
        <van-loading color="#fbcfe8" />
      </div>

      <div v-else class="content-wrap">
        <div v-if="player" class="hero-section">
          <div class="hero-img-box">
            <img v-if="coverPreview" :src="coverPreview" class="hero-cover" alt="cover" />
            <div v-else class="hero-empty">暂无图片</div>
            <div class="hero-gradient"></div>
          </div>

          <div class="base-card-wrapper px-4">
            <div class="base-card glass-panel">
              <div class="name-row">
                <div class="name-wrap">
                  <span class="name">{{ player.name || "神秘玩家" }}</span>
                  <span class="auth-badge">
                    <span class="badge-text">真人</span>
                  </span>
                </div>
                <div class="like-btn" :class="{ 'is-liked': collectId }" @click.stop="toggleCollect">
                  <van-icon
                    :name="collectId ? 'like' : 'like-o'"
                    size="22"
                    :color="collectId ? '#ec4899' : '#a1a1aa'"
                  />
                </div>
              </div>

              <div class="id-row">ID {{ player.id || "-" }}</div>
              
              <div class="city-row mt-3 flex items-center">
                <van-icon name="location-o" class="mr-1 text-white/50" />
                <span>{{ cityText }} · 397m</span>
              </div>
              <div class="occupation-row mt-1 ml-4">{{ occupationText }}</div>

              <div class="tag-row">
                <span v-for="(tag, idx) in profileBadges" :key="tag" class="tag-pill" :class="`type-${idx % 3}`">
                  {{ tag }}
                </span>
              </div>

              <div v-if="player.signature_dictText || player.signature" class="single-tag-row mt-3">
                <span class="tag-pill type-signature">
                  "{{ player.signature_dictText || player.signature }}"
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-wrap z-10 relative">
          <div class="empty">暂无数据</div>
          <van-button 
            round
            class="back-home-btn"
            @click="router.replace({ name: 'Home' })"
          >
            返回首页
          </van-button>
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
              <div v-for="act in activities" :key="act.id" class="activity-item glass-panel">
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
        <button class="btn-chat" @click="goContactAdmin">
          <span>联系 Ta</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.detail-page-wrapper {
  background-color: #0f0c29;
  background: linear-gradient(to bottom right, #0f0c29, #302b63, #24243e);
  color: #fff;
}

/* Background floating shapes */
.bg-shape {
  position: absolute;
  filter: blur(80px);
  border-radius: 50%;
  z-index: 1;
  opacity: 0.55;
  animation: float 10s infinite ease-in-out alternate;
  pointer-events: none;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: rgba(236, 72, 153, 0.35); /* Pink */
  top: -50px;
  right: -50px;
}

.shape-2 {
  width: 350px;
  height: 350px;
  background: rgba(139, 92, 246, 0.35); /* Violet */
  top: 40%;
  left: -100px;
  animation-delay: -3s;
}

.shape-3 {
  width: 250px;
  height: 250px;
  background: rgba(56, 189, 248, 0.25); /* Sky Blue */
  bottom: 50px;
  right: 20%;
  animation-delay: -5s;
}

@keyframes float {
  0% { transform: translateY(0) scale(1); }
  100% { transform: translateY(30px) scale(1.05); }
}

.top-bar {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  z-index: 30;
  height: 54px;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.back-btn {
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-wrap {
  min-height: 400px;
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

.hero-img-box {
  position: relative;
  width: 100%;
  height: 420px;
}

.hero-cover,
.hero-empty {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.05);
}

.hero-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9f9f9f;
}

.hero-gradient {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 140px;
  background: linear-gradient(to top, rgba(15, 12, 41, 1) 0%, rgba(15, 12, 41, 0) 100%);
  pointer-events: none;
}

.base-card-wrapper {
  margin-top: -60px;
  position: relative;
  z-index: 10;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

.base-card {
  border-radius: 24px;
  padding: 24px 20px;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.name-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.name {
  font-size: 26px;
  line-height: 1.1;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.5px;
}

.auth-badge {
  background: linear-gradient(135deg, #fcd34d, #f59e0b);
  padding: 2px 8px;
  border-radius: 6px 10px 10px 2px;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.4);
  
  .badge-text {
    font-size: 11px;
    color: #451a03;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
}

.like-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  &.is-liked {
    background: rgba(236, 72, 153, 0.15);
    box-shadow: 0 0 12px rgba(236, 72, 153, 0.4);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.9);
  }
}

.id-row {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

.city-row {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.occupation-row {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.tag-row,
.single-tag-row {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-pill {
  height: 26px;
  line-height: 26px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;

  &.type-0 {
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
  }
  &.type-1 {
    background: rgba(167, 139, 250, 0.15);
    color: #a78bfa;
  }
  &.type-2 {
    background: rgba(236, 72, 153, 0.15);
    color: #f472b6;
  }
  &.type-signature {
    background: linear-gradient(90deg, rgba(236, 72, 153, 0.1), rgba(167, 139, 250, 0.1));
    border: 1px solid rgba(236, 72, 153, 0.2);
    color: #fbcfe8;
    font-size: 14px;
    height: auto;
    line-height: 1.5;
    padding: 8px 14px;
    border-radius: 12px;
    font-style: italic;
  }
}

.section {
  padding: 24px 16px 0;
}

.section-title {
  font-size: 22px;
  line-height: 1;
  font-weight: 800;
  margin-bottom: 16px;
  color: #fff;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding-bottom: 16px;
}

.album-item {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px;
}

.activity-item {
  border-radius: 16px;
  padding: 16px;
}

.activity-content {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

.activity-meta {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.activity-image-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.activity-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.05);
}

.intro-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px;
  line-height: 1.7;
  padding-bottom: 16px;
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
  border-radius: 16px;
  text-align: center;
}

.bottom-action {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 20px;
  z-index: 40;
}

.btn-chat {
  width: 100%;
  height: 54px;
  border-radius: 27px;
  border: none;
  background: linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
  transition: transform 0.2s, box-shadow 0.2s;
  letter-spacing: 2px;
}

.btn-chat:active {
  transform: scale(0.97);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.empty-wrap {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
}

.empty {
  color: rgba(255, 255, 255, 0.4);
}

:deep(.back-home-btn) {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
  backdrop-filter: blur(4px);
}
</style>
