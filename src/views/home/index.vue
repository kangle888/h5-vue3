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

const currentUserId = () => {
  try {
    const cUser = JSON.parse(localStorage.getItem("c_user_info") || "{}");
    return cUser?.id || "";
  } catch {
    return "";
  }
};

const loadCollectMap = async () => {
  try {
    const res = await pagePlayerCollect({
      pageNum: 1,
      pageSize: 1000,
      query: {
        isCancel: "0",
        collectPlayerId: currentUserId() || undefined
      }
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
  <div class="home-wrapper min-h-screen w-full">
    <div class="box-border min-h-screen pb-10">
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
          </div>
        </div>
        <div class="top-actions">
          <van-icon name="search" size="22" color="#ccc" />
          <van-icon name="filter-o" size="22" color="#ccc" />
        </div>
      </div>

      <div v-if="loading" class="loading-wrap">
        <van-loading color="#ccc" />
      </div>

      <div v-else class="list-wrap">
        <div
          v-for="(item, index) in cardList"
          :key="item.id || index"
          class="player-card"
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
              <div class="like-btn" @click.stop="toggleCollect(item)">
                <van-icon
                  :name="isCollected(item) ? 'like' : 'like-o'"
                  size="20"
                  :color="isCollected(item) ? '#ff4d4f' : '#666'"
                />
              </div>
            </div>

            <div class="meta-row">
              <span class="pill">{{ item.age || "20" }}岁</span>
              <span class="pill">{{ item.height || "165" }}CM</span>
              <span v-if="playerTag(item)" class="pill">{{ playerTag(item) }}</span>
            </div>

            <div class="city-row">
              <van-icon name="location-o" class="mr-1" />
              <span>{{ formatCityText(item.city) }} · {{ distanceText(item, index) }}</span>
            </div>

            <div class="album-row" v-if="cardImages(item).length > 0">
              <div
                v-for="(img, imgIdx) in cardImages(item)"
                :key="img"
                class="mini-wrap"
              >
                <img class="mini" :src="img" alt="album" />
                <div v-if="imgIdx === 2 && cardAlbumCount(item) > 3" class="more">
                  +{{ cardAlbumCount(item) - 3 }} >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.home-wrapper {
  background-color: #000000;
  color: #fff;
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
  background: #000000;
}

.top-tabs {
  display: flex;
  align-items: baseline;
  gap: 16px;

  .tab-item {
    font-size: 16px;
    color: #666;
    font-weight: normal;
    position: relative;
    cursor: pointer;
    transition: all 0.2s;

    &.active {
      color: #fff;
      font-weight: 600;
      font-size: 22px;
    }
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
  display: flex;
  flex-direction: column;
}

.player-card {
  display: flex;
  gap: 14px;
  padding: 16px;
  border-bottom: 1px solid #1a1a1a;
  background: #000000;
  
  &:active {
    background: #0a0a0a;
  }
}

.cover-wrap {
  width: 86px;
  position: relative;
  flex-shrink: 0;

  .cover,
  .cover-empty {
    width: 86px;
    height: 86px;
    border-radius: 12px;
    object-fit: cover;
    background: #111;
  }

  .cover-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #333;
    font-size: 12px;
  }

  .badge {
    position: absolute;
    left: 0;
    bottom: 0;
    background: linear-gradient(135deg, #fae2a5, #dbb56f);
    padding: 3px 8px;
    border-radius: 0 8px 0 12px;
    
    .badge-text {
      font-size: 11px;
      color: #382402;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
  }
}

.info-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-bottom: 4px;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .name {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    max-width: 180px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .like-btn {
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:active {
      opacity: 0.6;
    }
  }
}

.meta-row {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .pill {
    font-size: 11px;
    border-radius: 4px;
    height: 20px;
    line-height: 20px;
    padding: 0 6px;
    background: #1c1813;
    color: #dfc293;
    font-weight: normal;
  }
}

.city-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  color: #666;
  font-size: 12px;
}

.album-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 6px;

  .mini-wrap {
    position: relative;
    width: 32px;
    height: 32px;

    .mini {
      width: 100%;
      height: 100%;
      border-radius: 4px;
      object-fit: cover;
      background: #111;
    }

    .more {
      position: absolute;
      inset: 0;
      border-radius: 4px;
      font-size: 10px;
      color: #fff;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
