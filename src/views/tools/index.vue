<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { showFailToast } from "vant";
import {
  getAttachmentObjectUrl,
  getPlayerActivity,
  queryById,
  type IPlayerActivityItem,
  type IPlayerItem
} from "@/api/home";

defineOptions({ name: "Tools" });

type FeedItem = IPlayerActivityItem & {
  player?: IPlayerItem;
  imageUrl?: string;
};

const activeTab = ref<"recommend" | "heartbeat">("recommend");
const loading = ref(false);
const feedList = ref<FeedItem[]>([]);

const playerMap = ref<Record<string, IPlayerItem>>({});

const tabs = [
  { key: "recommend", label: "推荐" },
  { key: "heartbeat", label: "心动" }
] as const;

const currentList = computed(() => {
  if (activeTab.value === "recommend") return feedList.value;
  return feedList.value.filter((item, idx) => idx % 2 === 0);
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
  return `${p?.age || "20"}岁 · ${p?.occupation || "模特"}`;
};

const getImageFileName = (item: IPlayerActivityItem) => {
  return item.image1 || item.image2 || item.image3 || "";
};

const getPlayerAvatar = (item: FeedItem) => {
  return item.player?.avatarUrl || "";
};

const enrichPlayers = async (records: IPlayerActivityItem[]) => {
  const ids = Array.from(new Set(records.map((i) => i.playerId).filter(Boolean) as string[]));
  for (const id of ids) {
    if (playerMap.value[id]) continue;
    try {
      const detail = await queryById(id);
      const player = { ...(detail || {}), avatarUrl: "" } as IPlayerItem & { avatarUrl?: string };
      if (player.avatar) {
        player.avatarUrl = await getAttachmentObjectUrl(player.avatar);
      }
      playerMap.value[id] = player;
    } catch {
      // ignore single player load failure
    }
  }
};

const loadFeed = async () => {
  loading.value = true;
  try {
    const res = await getPlayerActivity({
      pageNum: 1,
      pageSize: 20,
      query: {}
    });
    const records = res?.records || [];
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
    feedList.value = list;
  } catch {
    showFailToast("动态加载失败");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadFeed();
});
</script>

<template>
  <div class="dynamic-page-wrapper relative min-h-screen w-full overflow-hidden">
    <!-- Animated background elements -->
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
    <div class="bg-shape shape-3"></div>

    <div class="relative z-10 box-border min-h-screen pb-20">
      <div class="top-tabs glass-nav">
        <div class="tabs-container">
          <div
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-item"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
            <div class="indicator"></div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-wrap">
        <van-loading size="24" color="#fbcfe8" />
      </div>

      <div v-else class="feed-wrap">
        <div v-for="item in currentList" :key="item.id" class="feed-card glass-panel">
          <div class="author-row">
            <div class="avatar-wrap">
              <img v-if="getPlayerAvatar(item)" :src="getPlayerAvatar(item)" class="avatar" alt="avatar" />
              <div v-else class="avatar placeholder"></div>
            </div>
            <div class="author-info">
              <div class="name">{{ item.player?.name || "神秘玩家" }}</div>
              <div class="sub">{{ getPlayerBrief(item) }}</div>
            </div>
            <div class="more">
              <van-icon name="ellipsis" size="20" />
            </div>
          </div>

          <div class="content">{{ item.content || "今天也是元气满满的一天~" }}</div>

          <img v-if="item.imageUrl" :src="item.imageUrl" class="cover" alt="cover" />
          <div v-else class="cover-empty">
             <van-icon name="photo-o" size="32" class="opacity-20" />
          </div>

          <div class="city">
            <span class="city-tag">
              <van-icon name="location-o" class="mr-1" />
              {{ item.city || "成都市" }}
            </span>
          </div>

          <div class="bottom-row">
            <div class="time">{{ formatDateText(item.createTime) }}</div>
            <div class="actions">
              <div class="action-btn">
                <van-icon name="like-o" size="18" />
                <span>0</span>
              </div>
              <div class="action-btn">
                <van-icon name="chat-o" size="18" />
                <span>评论</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button class="float-btn">
        <van-icon name="plus" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="less">
.dynamic-page-wrapper {
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
.shape-1 { width: 300px; height: 300px; background: rgba(236, 72, 153, 0.35); top: -50px; right: -50px; }
.shape-2 { width: 350px; height: 350px; background: rgba(139, 92, 246, 0.35); top: 40%; left: -100px; animation-delay: -3s; }
.shape-3 { width: 250px; height: 250px; background: rgba(56, 189, 248, 0.25); bottom: 50px; right: 20%; animation-delay: -5s; }

@keyframes float {
  0% { transform: translateY(0) scale(1); }
  100% { transform: translateY(30px) scale(1.05); }
}

.glass-nav {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(15, 12, 41, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.top-tabs {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;

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
  color: rgba(255, 255, 255, 0.5);
  font-size: 18px;
  font-weight: 600;
  transition: all 0.3s;
  cursor: pointer;

  &.active {
    color: #fff;
    font-size: 20px;
    font-weight: 800;

    .indicator {
      opacity: 1;
      transform: scaleX(1);
    }
  }

  .indicator {
    position: absolute;
    bottom: 8px;
    left: 10%;
    width: 80%;
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(90deg, #ec4899, #8b5cf6);
    opacity: 0;
    transform: scaleX(0);
    transition: all 0.3s;
    box-shadow: 0 0 8px rgba(236, 72, 153, 0.6);
  }
}

.loading-wrap {
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feed-wrap {
  padding: 16px 12px 80px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
  border-radius: 20px;
}

.feed-card {
  padding: 16px 16px 20px;
}

.author-row {
  display: flex;
  align-items: center;
}

.avatar-wrap {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(135deg, #ec4899, #8b5cf6, #38bdf8);
  flex-shrink: 0;
}

.avatar, .placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #111;
  border: 2px solid #1a1a1a;
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
  font-weight: 800;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub {
  margin-top: 4px;
  color: rgba(255,255,255,0.5);
  font-size: 12px;
}

.more {
  color: rgba(255,255,255,0.4);
  padding: 4px;
}

.content {
  margin-top: 14px;
  font-size: 15px;
  line-height: 1.6;
  color: rgba(255,255,255,0.9);
  word-break: break-word;
}

.cover,
.cover-empty {
  margin-top: 14px;
  width: 100%;
  border-radius: 12px;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.05);
}

.cover {
  max-height: 400px;
  object-fit: cover;
}

.cover-empty {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.city {
  margin-top: 12px;
}

.city-tag {
  display: inline-flex;
  align-items: center;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.bottom-row {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 14px;
}

.time {
  color: rgba(255,255,255,0.3);
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 20px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  
  &:active {
    color: #fbcfe8;
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
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  color: #fff;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
  transition: transform 0.2s;
  z-index: 50;

  &:active {
    transform: scale(0.95);
  }
}
</style>
