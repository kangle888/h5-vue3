<script setup lang="ts">
import { BackTop, showFailToast, showImagePreview } from "vant";
import { computed, ref } from "vue";
import {
  getAttachmentObjectUrl,
  getPlayerActivity,
  queryById,
  type IPlayerActivityItem,
  type IPlayerItem
} from "@/api/home";

defineOptions({ name: "Tools" });

type PlayerWithAvatar = IPlayerItem & { avatarUrl?: string };

type FeedItem = IPlayerActivityItem & {
  player?: PlayerWithAvatar;
  imageUrl?: string;
};

const activeTab = ref<"recommend" | "heartbeat">("recommend");
const loading = ref(false);
const refreshing = ref(false);
const error = ref(false);
const finished = ref(false);
const feedList = ref<FeedItem[]>([]);

const pageNum = ref(1);
const pageSize = 10;

const playerMap = ref<Record<string, PlayerWithAvatar>>({});

const tabs = [
  { key: "recommend", label: "推荐" },
  { key: "heartbeat", label: "心动" }
] as const;

const currentList = computed(() => {
  if (activeTab.value === "recommend") return feedList.value;
  return feedList.value.filter((_item, idx) => idx % 2 === 0);
});

const formatDateText = (value?: string) => {
  if (!value) return "刚刚";
  const dt = new Date(value.replace(" ", "T"));
  if (Number.isNaN(dt.getTime())) return "刚刚";
  const diff = Date.now() - dt.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min}分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}小时前`;
  const day = Math.floor(hour / 24);
  return `${day}天前`;
};

const getPlayerBrief = (item: FeedItem) => {
  const p = item.player;
  return `${p?.age || "20"}岁 · ${p?.occupation_dictText || "模特"}`;
};

const getImageFileName = (item: IPlayerActivityItem) => {
  return item.image1 || item.image2 || item.image3 || "";
};

const getPlayerAvatar = (item: FeedItem) => {
  return item.player?.avatarUrl || "";
};

const previewImage = (item: FeedItem) => {
  if (!item.imageUrl) return;
  showImagePreview({
    images: [item.imageUrl],
    startPosition: 0,
    closeable: true
  });
};

const enrichPlayers = async (records: IPlayerActivityItem[]) => {
  const ids = Array.from(new Set(records.map(i => i.playerId).filter(Boolean) as string[]));
  for (const id of ids) {
    if (playerMap.value[id]) continue;
    try {
      const detail = await queryById(id);
      const player = { ...(detail || {}), avatarUrl: "" } as PlayerWithAvatar;
      if (player.avatar) {
        player.avatarUrl = await getAttachmentObjectUrl(player.avatar);
      }
      playerMap.value[id] = player;
    } catch {
      // ignore single player load failure
    }
  }
};

const mapFeed = async (records: IPlayerActivityItem[]) => {
  await enrichPlayers(records);
  const list: FeedItem[] = [];

  for (const row of records) {
    const fileName = getImageFileName(row);
    let imageUrl = "";
    if (fileName) {
      imageUrl = await getAttachmentObjectUrl(fileName);
    }
    list.push({
      ...row,
      player: row.playerId ? playerMap.value[row.playerId] : undefined,
      imageUrl
    });
  }

  return list;
};

const loadFeedPage = async (reset = false) => {
  if (reset) {
    pageNum.value = 1;
    finished.value = false;
    error.value = false;
  }

  loading.value = true;
  try {
    const res = await getPlayerActivity({
      pageNum: pageNum.value,
      pageSize,
      query: {}
    });
    const records = res?.records || [];
    const list = await mapFeed(records);

    if (reset) {
      feedList.value = list;
    } else {
      feedList.value = [...feedList.value, ...list];
    }

    if (records.length < pageSize) {
      finished.value = true;
    } else {
      pageNum.value += 1;
    }
  } catch {
    error.value = true;
    showFailToast("动态加载失败");
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const onLoad = async () => {
  await loadFeedPage(false);
};

const onRefresh = async () => {
  await loadFeedPage(true);
};

const onTabChange = async (name: string | number) => {
  activeTab.value = (name as "recommend" | "heartbeat") || "recommend";
  await onRefresh();
};
</script>

<template>
  <div class="dynamic-page-wrapper">
    <div class="box-border">
      <div class="top-tabs">
        <van-tabs :active="activeTab" background="#000" color="#dfc293" title-inactive-color="#666"
          title-active-color="#fff" line-width="30" shrink @change="onTabChange">
          <van-tab v-for="tab in tabs" :key="tab.key" :name="tab.key" :title="tab.label" />
        </van-tabs>
      </div>

      <van-pull-refresh v-model="refreshing" success-text="刷新成功" @refresh="onRefresh">
        <van-list v-model:loading="loading" v-model:error="error" :finished="finished" loading-text="加载中..."
          finished-text="没有更多了" error-text="加载失败，点击重试" @load="onLoad">
          <van-empty v-if="!loading && !currentList.length" image="search" description="暂无动态" class="empty-wrap" />

          <div v-for="item in currentList" :key="item.id" class="feed-card">
            <div class="author-row">
              <van-image v-if="getPlayerAvatar(item)" :src="getPlayerAvatar(item)" width="44" height="44" round
                fit="cover" />
              <div v-else class="avatar placeholder">
                <van-icon name="user-circle-o" size="24" color="#333" />
              </div>

              <div class="author-info">
                <div class="name">{{ item.player?.name || "神秘玩家" }}</div>
                <div class="sub">{{ getPlayerBrief(item) }}</div>
              </div>
              <!-- <div class="more">
                <van-icon name="ellipsis" size="20" />
              </div> -->
            </div>

            <div class="content">{{ item.content || "今天也是元气满满的一天~" }}</div>

            <van-image v-if="item.imageUrl" :src="item.imageUrl" class="cover" fit="cover"
              @click="previewImage(item)" />
            <div v-else class="cover-empty">
              <van-icon name="photo-o" size="32" color="#333" />
            </div>

            <div class="city">
              <span class="city-tag">
                <van-icon name="location-o" class="mr-1" />
                {{ item.city || "成都市" }}
              </span>
              <span class="time">{{ formatDateText(item.createTime) }}</span>
            </div>

            <!-- <div class="bottom-row">
              <div class="time">{{ formatDateText(item.createTime) }}</div>
              <div class="actions">
                <van-button class="action-btn" size="mini" plain hairline type="default" icon="like-o">0</van-button>
                <van-button class="action-btn" size="mini" plain hairline type="default" icon="chat-o">评论</van-button>
              </div>
            </div> -->
          </div>
        </van-list>
      </van-pull-refresh>

      <!-- <BackTop :right="16" :bottom="80" /> -->
    </div>
  </div>
</template>

<style scoped lang="less">
.dynamic-page-wrapper {
  background-color: #000000;
  color: #fff;
  height: 100%;
  overflow-y: auto;
}

.top-tabs {
  position: sticky;
  top: 0;
  z-index: 40;
  height: 54px;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-bottom: 1px solid #111;

  .tabs-container {
    display: flex;
    gap: 30px;
    height: 100%;
  }
}

.tab-item {
  position: relative;
  display: flex;
  align-items: center;
  color: #666;
  font-size: 16px;
  transition: all 0.2s;
  cursor: pointer;

  &.active {
    color: #fff;
    font-size: 20px;
    font-weight: 600;
  }
}

.loading-wrap {
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feed-wrap {
  display: flex;
  flex-direction: column;
}

.feed-card {
  padding: 16px;
  background: #000000;
  border-bottom: 1px solid #0a0a0a;

  &:last-child {
    border-bottom: none;
  }
}

.author-row {
  display: flex;
  align-items: center;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  background: #111;
  flex-shrink: 0;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.author-info {
  margin-left: 12px;
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub {
  margin-top: 4px;
  color: #999;
  font-size: 12px;
}

.more {
  color: #666;
  padding: 4px;
}

.content {
  margin-top: 14px;
  font-size: 15px;
  line-height: 1.6;
  color: #e5e5e5;
  word-break: break-word;
}

.cover,
.cover-empty {
  margin-top: 14px;
  width: 50%;
  border-radius: 8px;
  background: #0a0a0a;
}

.cover {
  max-height: 150px;
  object-fit: cover;
}

.cover-empty {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.city {
  margin-top: 45px;
}

.city-tag {
  display: inline-flex;
  align-items: center;
  background: #1c1813;
  color: #dfc293;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 500;
}

.bottom-row {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.time {
  color: #666;
  font-size: 12px;
  margin-left: 12px;
}

.actions {
  display: flex;
  gap: 20px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #999;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;

  &:active {
    color: #dfc293;
    transform: scale(0.95);
  }
}

.float-btn {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 28px;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #dfc293;
  color: #000;
  box-shadow: 0 4px 16px rgba(223, 194, 147, 0.3);
  transition: transform 0.2s;
  z-index: 50;

  &:active {
    transform: scale(0.95);
  }
}
</style>
