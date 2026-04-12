<script setup lang="ts">
import "vant/es/image-preview/style";
import { computed, onMounted, ref, nextTick } from "vue";
import { showImagePreview, showFailToast } from "vant";
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

const currentUserId = computed(() => {
  try {
    const userInfo = JSON.parse(localStorage.getItem("c_user_info") || "{}");
    return userInfo?.id || "";
  } catch {
    return "";
  }
});

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

const openAlbumPreview = async (start: number) => {
  if (!albumPreviewList.value.length) return;

  await nextTick(); // 等待 Vue 更新 DOM

  showImagePreview({
    images: albumPreviewList.value,
    startPosition: start,
    closeable: true
  });
};

const openActivityPreview = async (activityId: string, start: number) => {
  const list = activityImageMap.value[activityId] || [];
  if (!list.length) return;
  await nextTick(); // 等待 Vue 更新 DOM
  showImagePreview({
    images: list,
    startPosition: start,
    closeable: true
  });
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
      playerName: player.value.name || "神秘玩家",
      playerCreateBy: player.value.createBy || ""
    }
  });
};

const loadCollectStatus = async (id: string) => {
  try {
    const res = await pagePlayerCollect({
      pageNum: 1,
      pageSize: 1,
      query: {
        playerId: id,
        collectPlayerId: currentUserId.value,
        isCancel: "0"
      }
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
  <div class="detail-page-wrapper w-full">
    <div class="relative z-10 box-border">
      <!-- Top Actions Over Image -->
      <div class="top-bar">
        <div class="icon-btn" @click="router.back()">
          <van-icon name="arrow-left" size="20" color="#fff" />
        </div>
        <!-- <div class="icon-btn">
          <van-icon name="ellipsis" size="20" color="#fff" />
        </div> -->
      </div>

      <div v-if="loading" class="skeleton-wrap">
        <div class="skeleton-hero skeleton-block"></div>
        <div class="base-card-wrapper">
          <div class="base-card">
            <div class="name-row">
              <div class="name-wrap">
                <div
                  class="skeleton-block"
                  style="width: 120px; height: 28px; border-radius: 4px"
                ></div>
                <div
                  class="skeleton-block"
                  style="width: 32px; height: 16px; border-radius: 4px"
                ></div>
              </div>
              <div
                class="skeleton-block"
                style="width: 24px; height: 24px; border-radius: 50%"
              ></div>
            </div>

            <div class="meta-list" style="gap: 10px; margin-top: 16px">
              <div
                class="skeleton-block"
                style="width: 60%; height: 16px; border-radius: 4px"
              ></div>
              <div
                class="skeleton-block"
                style="width: 80%; height: 16px; border-radius: 4px"
              ></div>
              <div
                class="skeleton-block"
                style="width: 40%; height: 16px; border-radius: 4px"
              ></div>
            </div>

            <div class="tag-row mt-4">
              <div
                class="skeleton-block"
                style="width: 48px; height: 24px; border-radius: 4px"
              ></div>
              <div
                class="skeleton-block"
                style="width: 64px; height: 24px; border-radius: 4px"
              ></div>
              <div
                class="skeleton-block"
                style="width: 56px; height: 24px; border-radius: 4px"
              ></div>
              <div
                class="skeleton-block"
                style="width: 60px; height: 24px; border-radius: 4px"
              ></div>
            </div>

            <!-- Content Sections -->
            <div class="section">
              <div class="section-title">
                <div class="divider"></div>
                <div
                  class="skeleton-block"
                  style="width: 40px; height: 20px; border-radius: 4px"
                ></div>
              </div>
              <div class="album-grid">
                <div
                  v-for="i in 8"
                  :key="i"
                  class="album-item-wrap skeleton-block"
                ></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">
                <div class="divider"></div>
                <div
                  class="skeleton-block"
                  style="width: 40px; height: 20px; border-radius: 4px"
                ></div>
              </div>
              <div class="activity-list">
                <div v-for="j in 2" :key="'act' + j" class="activity-item">
                  <div class="activity-date">
                    <div
                      class="skeleton-block"
                      style="width: 28px; height: 28px; border-radius: 4px"
                    ></div>
                  </div>
                  <div class="activity-body">
                    <div
                      class="skeleton-block"
                      style="
                        width: 100%;
                        height: 16px;
                        border-radius: 4px;
                        margin-bottom: 8px;
                      "
                    ></div>
                    <div
                      class="skeleton-block"
                      style="
                        width: 70%;
                        height: 16px;
                        border-radius: 4px;
                        margin-bottom: 12px;
                      "
                    ></div>
                    <div class="activity-image-grid">
                      <div class="activity-image skeleton-block"></div>
                      <div class="activity-image skeleton-block"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="content-wrap">
        <div v-if="player" class="hero-section">
          <div class="hero-img-box">
            <img
              v-if="coverPreview"
              :src="coverPreview"
              class="hero-cover"
              alt="cover"
            />
            <div v-else class="hero-empty">暂无图片</div>
          </div>

          <!-- Bottom Base Card -->
          <div class="base-card-wrapper">
            <div class="base-card">
              <div class="name-row">
                <div class="name-wrap">
                  <span class="name">{{ player.name || "神秘玩家" }}</span>
                  <span class="auth-badge">
                    <span class="badge-text">真颜</span>
                  </span>
                </div>
                <div
                  class="like-btn"
                  :class="{ 'is-liked': collectId }"
                  @click.stop="toggleCollect"
                >
                  <van-icon
                    :name="collectId ? 'like' : 'like-o'"
                    size="20"
                    :color="collectId ? '#ff4d4f' : '#888'"
                  />
                </div>
              </div>

              <div class="meta-list mt-1">
                <div class="meta-item">
                  <van-icon name="idcard" class="mr-1" />
                  ID {{ player.id || "-" }}
                </div>
                <div class="meta-item">
                  <van-icon name="location-o" class="mr-1" />
                  {{ player.area || "" }}
                </div>
                <div class="meta-item van-ellipsis">
                  <van-icon name="records-o" class="mr-1" />
                  {{ player.introduction || "暂无介绍" }}
                </div>
              </div>

              <div class="tag-row mt-4">
                <span class="tag-pill">🎂{{ player.age || "25" }}岁</span>
                <span class="tag-pill" v-if="player.constellation"
                  >⭐{{ player.constellation }}</span
                >
                <span class="tag-pill" v-if="player.height"
                  >🧍{{ player.height }}CM</span
                >
                <span class="tag-pill" v-if="player.weight"
                  >⚖️{{ player.weight }}KG</span
                >
                <span class="tag-pill">💼{{ occupationText }}</span>
              </div>

              <!-- Content Sections -->
              <div class="section">
                <div class="section-title">
                  <div class="divider"></div>
                  相册
                </div>
                <div class="album-grid" v-if="albumPreviewList.length > 0">
                  <div
                    v-for="(img, idx) in albumPreviewList.slice(0, 8)"
                    :key="img + idx"
                    class="album-item-wrap"
                    @click="openAlbumPreview(idx)"
                  >
                    <img class="album-item" :src="img" alt="album" />
                    <div
                      class="overlay-more"
                      v-if="idx === 7 && albumPreviewList.length > 8"
                    >
                      +{{ albumPreviewList.length - 8 }}
                    </div>
                  </div>
                </div>
                <div v-else class="empty-hint">暂无相册</div>
              </div>

              <div class="section">
                <div class="section-title">
                  <div class="divider"></div>
                  动态
                </div>
                <div v-if="activities.length" class="activity-list">
                  <div
                    v-for="act in activities.slice(0, 2)"
                    :key="act.id"
                    class="activity-item"
                  >
                    <div class="activity-date">
                      <span class="date-day">14</span>
                    </div>
                    <div class="activity-body">
                      <div class="activity-content">
                        {{ act.content || "半夜睡醒了咋整" }}
                      </div>
                      <div
                        class="activity-image-grid"
                        v-if="(activityImageMap[act.id || ''] || []).length"
                      >
                        <img
                          v-for="(img, idx) in activityImageMap[
                            act.id || ''
                          ].slice(0, 2)"
                          :key="img + idx"
                          class="activity-image"
                          :src="img"
                          alt="activity-image"
                          @click="openActivityPreview(act.id || '', idx)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-hint">暂无动态</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-wrap">
          <div class="empty">暂无数据</div>
          <van-button
            round
            class="back-home-btn"
            @click="router.replace({ name: 'Home' })"
          >
            返回首页
          </van-button>
        </div>
      </div>

      <!-- Detail bottom actions -->
      <div v-if="player" class="bottom-action">
        <button class="btn-chat" @click="goContactAdmin">
          <van-icon name="chat-o" size="18" class="mr-1" /> 私聊她
        </button>
        <!-- <button class="btn-wechat" @click="goContactAdmin">
          <van-icon name="wechat" size="18" class="mr-1" /> 微信
        </button> -->
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.detail-page-wrapper {
  background-color: #000000;
  color: #fff;
  height: 100%;
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
  justify-content: space-between;
  padding: 0 16px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skeleton-wrap {
  width: 100%;
  padding-bottom: 77px;
}

.skeleton-hero {
  width: 100%;
  height: 300px;
}

.content-wrap {
  padding-bottom: 77px;
}

.hero-section {
  position: relative;
}

.hero-img-box {
  width: 100%;
  height: 300px;
  /* Large cover */
  position: relative;
}

.hero-cover,
.hero-empty {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #111;
}

.hero-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
}

.base-card-wrapper {
  margin-top: -30px;
  position: relative;
  z-index: 10;
}

.base-card {
  background: #000000;
  border-radius: 24px 24px 0 0;
  padding: 24px 16px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
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
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.auth-badge {
  background: #ff4d6a;
  /* Reddish badge for "真颜" */
  padding: 2px 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;

  .badge-text {
    font-size: 10px;
    color: #fff;
    font-weight: 500;
  }
}

.like-btn {
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    background: #0d0d0d;
  }
}

.meta-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #888;
  font-size: 13px;

  .meta-item {
    display: flex;
    align-items: center;
  }

  .van-ellipsis {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.tag-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-pill {
  height: 24px;
  line-height: 24px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: #1c1813;
  color: #dfc293;
}

.section {
  margin-top: 32px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #fff;
  display: flex;
  align-items: center;

  .divider {
    width: 3px;
    height: 14px;
    background: #dfc293;
    margin-right: 6px;
    border-radius: 2px;
  }
}

.empty-hint {
  font-size: 13px;
  color: #666;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.album-item-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  background: #111;
  cursor: pointer;
}

.album-item {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay-more {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.activity-item {
  display: flex;
  gap: 12px;
}

.activity-date {
  width: 40px;
  flex-shrink: 0;

  .date-day {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }
}

.activity-body {
  flex: 1;
  min-width: 0;
}

.activity-content {
  font-size: 14px;
  color: #ccc;
  line-height: 1.5;
  margin-bottom: 8px;
}

.activity-image-grid {
  display: flex;
  gap: 8px;

  .activity-image {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    object-fit: cover;
    background: #111;
  }
}

.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  padding: 10px 16px 20px;
  display: flex;
  gap: 12px;
  background: #000000;
  border-top: 1px solid #1a1a1a;
}

.btn-chat {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: #dfc293;
  color: #000;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    opacity: 0.8;
  }
}

.btn-wechat {
  width: 100px;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: #222;
  color: #dfc293;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    background: #111;
  }
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
  color: #666;
}

:deep(.back-home-btn) {
  background: #222 !important;
  border: none !important;
  color: #dfc293 !important;
}

@keyframes skeleton-blink {
  0% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.4;
  }
}

.skeleton-block {
  background-color: #222;
  animation: skeleton-blink 1.5s ease-in-out infinite;
}

.van-image-preview .van-swipe-item {
  width: 100vw !important;
}
</style>
