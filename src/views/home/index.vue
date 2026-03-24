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
  <div class="home-page">
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
        <van-icon name="search" size="20" />
        <van-icon name="filter-o" size="20" />
      </div>
    </div>

    <div v-if="loading" class="loading-wrap">
      <van-loading color="#d4b076" />
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
          <div v-else class="cover-empty">暂无图片</div>
          <div class="badge">真人认证</div>
        </div>

        <div class="info-wrap">
          <div class="name-row">
            <div class="name">{{ item.name || "匿名" }}</div>
            <van-icon
              :name="isCollected(item) ? 'like' : 'like-o'"
              size="18"
              :color="isCollected(item) ? '#ff4d6d' : '#8a8a8a'"
              @click.stop="toggleCollect(item)"
            />
          </div>

          <div class="meta-row">
            <span class="pill">{{ item.age || "20" }}岁</span>
            <span class="pill">{{ item.height || "165" }}CM</span>
            <span class="pill tag">{{ playerTag(item) }}</span>
          </div>

          <div class="city-row">📍 {{ formatCityText(item.city) }} · {{ distanceText(item, index) }}</div>

          <div class="album-row">
            <template v-for="img in cardImages(item)" :key="img">
              <img class="mini" :src="img" alt="album" />
            </template>
            <div v-if="cardAlbumCount(item) > 3" class="more">+{{ cardAlbumCount(item) - 3 }}</div>
            <van-icon name="arrow" size="14" color="#9a9a9a" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.home-page {
  min-height: calc(100vh - 50px);
  background: #000;
  color: #fff;
  padding-bottom: 18px;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  height: 50px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid #171717;
}

.top-tabs {
  display: flex;
  align-items: center;
  gap: 20px;

  .tab-item {
    font-size: 17px;
    color: #6e6e6e;
    font-weight: 500;

    &.active {
      color: #fff;
      font-weight: 700;
    }
  }
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.loading-wrap {
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-wrap {
  padding: 0 10px;
}

.player-card {
  display: flex;
  gap: 10px;
  padding: 14px 0;
  border-bottom: 1px solid #1b1b1b;
  cursor: pointer;
}

.cover-wrap {
  width: 98px;
  position: relative;

  .cover,
  .cover-empty {
    width: 98px;
    height: 118px;
    border-radius: 10px;
    object-fit: cover;
    background: #202020;
  }

  .cover-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9f9f9f;
    font-size: 12px;
  }

  .badge {
    position: absolute;
    left: 0;
    bottom: 0;
    font-size: 10px;
    color: #3f2f14;
    background: #e2c58d;
    padding: 2px 6px;
    border-radius: 0 6px 0 10px;
  }
}

.info-wrap {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;

  .name {
    font-size: 26px;
    font-weight: 800;
    line-height: 1.1;
    max-width: 170px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.meta-row {
  margin-top: 8px;
  display: flex;
  gap: 6px;

  .pill {
    font-size: 12px;
    color: #dbdbdb;
    background: #2a2a2a;
    border-radius: 6px;
    line-height: 20px;
    height: 20px;
    padding: 0 8px;
  }

  .tag {
    color: #d7bc8d;
  }
}

.city-row {
  margin-top: 8px;
  color: #b3b3b3;
  font-size: 13px;
}

.album-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;

  .mini {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    object-fit: cover;
    background: #1f1f1f;
  }

  .more {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    font-size: 12px;
    color: #fff;
    background: #2f2f2f;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
