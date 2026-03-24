<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { showFailToast, showSuccessToast } from "vant";
import { codeToText } from "element-china-area-data";
import { useRouter } from "vue-router";
import {
  addPlayerCollect,
  deletePlayerCollect,
  getAttachmentObjectUrl,
  listPlayer,
  pagePlayerCollect,
  type IPlayerItem
} from "@/api/home";

defineOptions({
  name: "Home"
});

const tabs = ["附近", "活跃", "新人"] as const;
const activeTab = ref(0);
const loading = ref(false);
const players = ref<IPlayerItem[]>([]);
const router = useRouter();

const filterForm = reactive({
  name: ""
});

const coverPreviewMap = ref<Record<string, string>>({});
const albumPreviewMap = ref<Record<string, string[]>>({});
const collectIdMap = ref<Record<string, string>>({});

const cardAlbumCount = (item: IPlayerItem) => {
  const list = (item.album || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
  return list.length;
};

const buildPreviewMap = async (rows: IPlayerItem[]) => {
  const nextCoverMap: Record<string, string> = {};
  const nextAlbumMap: Record<string, string[]> = {};

  for (const item of rows) {
    const id = item.id;
    if (!id) continue;

    const albumNames = (item.album || "")
      .split(",")
      .map(v => v.trim())
      .filter(Boolean);

    const coverFile = item.avatar || albumNames[0] || "";
    const coverUrl = await getAttachmentObjectUrl(coverFile);
    if (coverUrl) nextCoverMap[id] = coverUrl;

    const firstThree = albumNames.slice(0, 3);
    const albumUrls: string[] = [];
    for (const fileName of firstThree) {
      const url = await getAttachmentObjectUrl(fileName);
      if (url) albumUrls.push(url);
    }
    if (albumUrls.length) nextAlbumMap[id] = albumUrls;
  }

  coverPreviewMap.value = nextCoverMap;
  albumPreviewMap.value = nextAlbumMap;
};

const loadCollectMap = async () => {
  try {
    const res = await pagePlayerCollect({
      pageNum: 1,
      pageSize: 1000,
      query: { isCancel: "0" }
    });
    const rows = res?.records || [];
    const map: Record<string, string> = {};
    for (const row of rows) {
      if (row.playerId && row.id) {
        map[row.playerId] = row.id;
      }
    }
    collectIdMap.value = map;
  } catch {
    collectIdMap.value = {};
  }
};

const coverUrl = (item: IPlayerItem) => {
  if (!item.id) return "";
  return coverPreviewMap.value[item.id] || "";
};

const cardImages = (item: IPlayerItem) => {
  if (!item.id) return [];
  return albumPreviewMap.value[item.id] || [];
};

const playerTag = (item: IPlayerItem) => {
  return item.occupation_dictText || item.occupation || "优质陪玩";
};

const distanceText = (_item: IPlayerItem, index: number) => {
  const base = 390;
  return `${base + index * 120}m`;
};

const formatCityText = (city?: string) => {
  const fallback = "武汉市";
  if (!city) return fallback;
  const parts = city.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const lastCode = parts[parts.length - 1];
  return (codeToText as Record<string, string>)[lastCode] || lastCode;
};

const cardList = computed(() => players.value);

const isCollected = (item: IPlayerItem) => {
  if (!item.id) return false;
  return Boolean(collectIdMap.value[item.id]);
};

const toggleCollect = async (item: IPlayerItem) => {
  if (!item.id) return;
  try {
    const collectId = collectIdMap.value[item.id];
    if (collectId) {
      await deletePlayerCollect(collectId);
      delete collectIdMap.value[item.id];
      showSuccessToast("已取消收藏");
    } else {
      const res = await addPlayerCollect({ playerId: item.id });
      if (res) {
        collectIdMap.value[item.id] = res;
      }
      showSuccessToast("收藏成功");
    }
  } catch {
    showFailToast("操作失败，请稍后重试");
  }
};

const loadPlayers = async () => {
  loading.value = true;
  try {
    const res = await listPlayer({
      pageNum: 1,
      pageSize: 20,
      query: {
        name: filterForm.name || undefined
      }
    });
    players.value = res?.records || [];
    await buildPreviewMap(players.value);
    await loadCollectMap();
  } catch {
    showFailToast("加载人物失败");
  } finally {
    loading.value = false;
  }
};

const onTabChange = (index: number) => {
  activeTab.value = index;
  loadPlayers();
};

const goDetail = (item: IPlayerItem) => {
  if (!item.id) return;
  router.push({ name: "Detail", query: { playerId: item.id } });
};

onMounted(() => {
  loadPlayers();
});
</script>

<template>
  <div class="home-wrapper relative min-h-screen w-full overflow-hidden">
    <!-- Animated background elements -->
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
    <div class="bg-shape shape-3"></div>

    <div class="relative z-10 box-border min-h-screen pb-10">
      <div class="sticky-header">
        <div class="top-tabs">
          <div
            v-for="(tab, index) in tabs"
            :key="tab"
            class="tab-item"
            :class="{ active: activeTab === index }"
            @click="onTabChange(index)"
          >
            {{ tab }}
            <!-- Glowing underline for active tab -->
            <div v-if="activeTab === index" class="tab-indicator"></div>
          </div>
        </div>
        <div class="top-actions">
          <van-icon name="search" size="22" color="#fff" />
          <van-icon name="filter-o" size="22" color="#fff" />
        </div>
      </div>

      <div v-if="loading" class="loading-wrap">
        <van-loading color="#fbcfe8" />
      </div>

      <div v-else class="list-wrap">
        <div
          v-for="(item, index) in cardList"
          :key="item.id || index"
          class="player-card glass-card"
          @click="goDetail(item)"
        >
          <div class="cover-wrap">
            <img v-if="coverUrl(item)" :src="coverUrl(item)" class="cover" alt="cover" />
            <div v-else class="cover-empty">暂无照片</div>
            <div class="badge">
              <span class="badge-text">真人认证</span>
            </div>
          </div>

          <div class="info-wrap">
            <div class="name-row">
              <div class="name">{{ item.name || "神秘玩家" }}</div>
              <div class="like-btn" :class="{ 'is-liked': isCollected(item) }" @click.stop="toggleCollect(item)">
                <van-icon
                  :name="isCollected(item) ? 'like' : 'like-o'"
                  size="18"
                  :color="isCollected(item) ? '#ec4899' : '#a1a1aa'"
                />
              </div>
            </div>

            <div class="meta-row">
              <span class="pill tag-age">{{ item.age || "20" }}岁</span>
              <span class="pill tag-height">{{ item.height || "165" }}CM</span>
              <span class="pill tag-game">{{ playerTag(item) }}</span>
            </div>

            <div class="city-row">
              <van-icon name="location-o" class="mr-1" />
              <span>{{ formatCityText(item.city) }} · {{ distanceText(item, index) }}</span>
            </div>

            <div class="album-row">
              <template v-for="img in cardImages(item)" :key="img">
                <img class="mini" :src="img" alt="album" />
              </template>
              <div v-if="cardAlbumCount(item) > 3" class="more">+{{ cardAlbumCount(item) - 3 }}</div>
              <van-icon name="arrow" size="14" color="rgba(255,255,255,0.4)" class="ml-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.home-wrapper {
  background-color: #0f0c29;
  background: linear-gradient(to bottom right, #0f0c29, #302b63, #24243e);
  color: #fff;
}

/* Base shape for energetic aesthetic */
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
  bottom: -50px;
  right: 20%;
  animation-delay: -5s;
}

@keyframes float {
  0% { transform: translateY(0) scale(1); }
  100% { transform: translateY(30px) scale(1.05); }
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  
  /* Glassmorphism for header */
  background: rgba(15, 12, 41, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.top-tabs {
  display: flex;
  align-items: center;
  gap: 24px;

  .tab-item {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
    position: relative;
    padding: 8px 0;
    cursor: pointer;
    transition: all 0.3s;

    &.active {
      color: #fff;
      font-weight: 700;
      font-size: 18px;
    }
  }

  .tab-indicator {
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 3px;
    border-radius: 2px;
    background: linear-gradient(90deg, #ec4899, #8b5cf6);
    box-shadow: 0 0 8px rgba(236, 72, 153, 0.6);
  }
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.loading-wrap {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-wrap {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.player-card {
  display: flex;
  gap: 14px;
  padding: 14px;
}

.cover-wrap {
  width: 96px;
  position: relative;
  flex-shrink: 0;

  .cover,
  .cover-empty {
    width: 96px;
    height: 124px;
    border-radius: 12px;
    object-fit: cover;
    background: rgba(255,255,255,0.08);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }

  .cover-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.3);
    font-size: 12px;
  }

  .badge {
    position: absolute;
    left: 0;
    bottom: 0;
    background: linear-gradient(135deg, #fcd34d, #f59e0b);
    padding: 2px 8px;
    border-radius: 0 8px 0 12px;
    box-shadow: 0 2px 6px rgba(245, 158, 11, 0.4);
    
    .badge-text {
      font-size: 10px;
      color: #451a03;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
  }
}

.info-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .name {
    font-size: 18px;
    font-weight: 800;
    color: #fff;
    max-width: 160px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.5px;
  }

  .like-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    
    &.is-liked {
      background: rgba(236, 72, 153, 0.15);
      box-shadow: 0 0 12px rgba(236, 72, 153, 0.3);
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.9);
    }
  }
}

.meta-row {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .pill {
    font-size: 11px;
    border-radius: 8px;
    height: 22px;
    line-height: 22px;
    padding: 0 8px;
    font-weight: 600;
  }

  .tag-age {
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
  }

  .tag-height {
    background: rgba(167, 139, 250, 0.15);
    color: #a78bfa;
  }

  .tag-game {
    background: linear-gradient(90deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15));
    border: 1px solid rgba(236,72,153,0.2);
    color: #fbcfe8;
  }
}

.city-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.album-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;

  .mini {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    object-fit: cover;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.05);
  }

  .more {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    font-size: 11px;
    color: rgba(255,255,255,0.8);
    background: rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
  }
}
</style>
