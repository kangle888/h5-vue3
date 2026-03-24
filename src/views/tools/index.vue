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
  <div class="dynamic-page">
    <div class="top-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </div>
    </div>

    <div v-if="loading" class="loading-wrap">
      <van-loading color="#d8bd87" />
    </div>

    <div v-else class="feed-wrap">
      <div v-for="item in currentList" :key="item.id" class="feed-card">
        <div class="author-row">
          <img v-if="getPlayerAvatar(item)" :src="getPlayerAvatar(item)" class="avatar" alt="avatar" />
          <div v-else class="avatar placeholder"></div>
          <div class="author-info">
            <div class="name">{{ item.player?.name || "宝宝" }}</div>
            <div class="sub">{{ getPlayerBrief(item) }}</div>
          </div>
          <div class="more">···</div>
        </div>

        <div class="content">{{ item.content || "无聊" }}</div>

        <img v-if="item.imageUrl" :src="item.imageUrl" class="cover" alt="cover" />
        <div v-else class="cover-empty">暂无图片</div>

        <div class="city">📍 {{ item.city || "北京市" }}</div>

        <div class="bottom-row">
          <div class="actions">
            <span>👍 0</span>
            <span>💬 评论</span>
          </div>
          <div class="time">{{ formatDateText(item.createTime) }}</div>
        </div>
      </div>
    </div>

    <button class="float-btn">＋</button>
  </div>
</template>

<style scoped lang="less">
.dynamic-page {
  min-height: calc(100vh - 50px);
  background: #000;
  color: #fff;
  position: relative;
}

.top-tabs {
  height: 50px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.tab-item {
  color: #656565;
  font-size: 31px;
  font-weight: 700;

  &.active {
    color: #fff;
  }
}

.loading-wrap {
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feed-wrap {
  padding: 0 12px 80px;
}

.feed-card {
  padding: 14px 0 16px;
  border-bottom: 1px solid #171717;
}

.author-row {
  display: flex;
  align-items: center;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  background: #222;
}

.placeholder {
  border: 1px solid #333;
}

.author-info {
  margin-left: 10px;
}

.name {
  font-size: 17px;
  font-weight: 700;
}

.sub {
  margin-top: 4px;
  color: #8f8f8f;
  font-size: 13px;
}

.more {
  margin-left: auto;
  color: #9a9a9a;
  font-size: 20px;
}

.content {
  margin-top: 10px;
  font-size: 17px;
}

.cover,
.cover-empty {
  margin-top: 10px;
  width: 100%;
  border-radius: 10px;
  background: #1b1b1b;
}

.cover {
  max-height: 430px;
  object-fit: cover;
}

.cover-empty {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #777;
}

.city {
  margin-top: 8px;
  color: #9d9d9d;
  font-size: 13px;
}

.bottom-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #9b9b9b;
  font-size: 13px;
}

.actions {
  display: flex;
  gap: 14px;
}

.float-btn {
  position: fixed;
  right: 18px;
  bottom: 82px;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  font-size: 30px;
  line-height: 48px;
  background: #f0d7a4;
  color: #1a140a;
}
</style>
