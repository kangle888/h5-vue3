<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { showFailToast } from "vant";
import { useRouter } from "vue-router";
import {
  countUnreadApi,
  pageChatRoomApi,
  type IChatRoomItem
} from "@/api/news";

defineOptions({ name: "News" });

const router = useRouter();
const activeTab = ref<"chat" | "system">("chat");
const loading = ref(false);
const pollTimer = ref<number | null>(null);
const roomList = ref<IChatRoomItem[]>([]);

const BASE_POLL_INTERVAL = 8000;
const MAX_POLL_INTERVAL = 60000;
const FAILURE_BACKOFF_FACTOR = 2;
const MIN_UNREAD_REFRESH_INTERVAL = 30000;

let destroyed = false;
let polling = false;
let failCount = 0;
let lastUnreadFetchAt = 0;

const roomTitle = (room: IChatRoomItem) => {
  const userName = room.targetUserName || room.targetUserId || "用户";
  if (room.scene === "player") {
    return `${userName}（${room.playerName || room.playerId || "卡片会话"}）`;
  }
  return `${userName}（客服会话）`;
};

const roomSubText = (room: IChatRoomItem) => {
  return room.lastContent || "点击进入聊天";
};

const roomTime = (room: IChatRoomItem) => {
  const value = room.lastTime;
  if (!value) return "--:--";
  const text = value.replace("T", " ");
  return text.length >= 16 ? text.slice(11, 16) : text;
};

const fallbackAvatar = "https://picsum.photos/seed/admin-chat/120/120";

const avatarUrl = (_room: IChatRoomItem) => {
  return fallbackAvatar;
};

const mergeUnreadCount = async (rows: IChatRoomItem[]) => {
  const now = Date.now();
  const shouldRefreshUnread = now - lastUnreadFetchAt >= MIN_UNREAD_REFRESH_INTERVAL;
  if (!shouldRefreshUnread) {
    return rows.map(room => {
      const oldRoom = roomList.value.find(
        item => item.targetUserId === room.targetUserId && (item.sessionKey || "service_default") === (room.sessionKey || "service_default")
      );
      return {
        ...room,
        unreadCount: oldRoom?.unreadCount || 0
      } as IChatRoomItem;
    });
  }

  const withUnread = await Promise.all(
    rows.map(async room => {
      try {
        const unread = await countUnreadApi(room.targetUserId, room.sessionKey || "service_default");
        return {
          ...room,
          unreadCount: unread || 0
        } as IChatRoomItem;
      } catch {
        const oldRoom = roomList.value.find(
          item => item.targetUserId === room.targetUserId && (item.sessionKey || "service_default") === (room.sessionKey || "service_default")
        );
        return {
          ...room,
          unreadCount: oldRoom?.unreadCount || 0
        } as IChatRoomItem;
      }
    })
  );

  lastUnreadFetchAt = now;
  return withUnread;
};

const loadData = async () => {
  if (polling) return false;
  polling = true;
  loading.value = true;

  try {
    const res = await pageChatRoomApi({
      pageNum: 1,
      pageSize: 200,
      query: {}
    });

    const rows = res?.records || [];
    roomList.value = await mergeUnreadCount(rows);
    failCount = 0;
    return true;
  } catch {
    failCount += 1;
    if (failCount <= 1) {
      showFailToast("加载消息失败");
    }
    return false;
  } finally {
    loading.value = false;
    polling = false;
  }
};

const scheduleNextPoll = () => {
  if (destroyed) return;
  const delay = Math.min(
    BASE_POLL_INTERVAL * Math.pow(FAILURE_BACKOFF_FACTOR, failCount),
    MAX_POLL_INTERVAL
  );

  pollTimer.value = window.setTimeout(async () => {
    await loadData();
    scheduleNextPoll();
  }, delay);
};

const openChat = (room: IChatRoomItem) => {
  router.push({
    name: "NewsChatPage",
    query: {
      scene: room.scene || "service",
      playerId: room.playerId,
      playerName: room.playerName,
      sessionKey: room.sessionKey || "service_default"
    }
  });
};

onMounted(async () => {
  await loadData();
  scheduleNextPoll();
});

onBeforeUnmount(() => {
  destroyed = true;
  if (pollTimer.value) clearTimeout(pollTimer.value);
});
</script>

<template>
  <div class="news-page-wrapper  w-full">
    <div class="box-border  pb-20">
      <div class="top-bar">
        <div class="tabs">
          <div class="tab" :class="{ 'active-tab': activeTab === 'chat' }" @click="activeTab = 'chat'">
            聊天
          </div>
          <div class="tab" :class="{ 'active-tab': activeTab === 'system' }" @click="activeTab = 'system'">
            系统消息
          </div>
        </div>
        <div class="icons">
          <van-icon name="comment-o" size="20" />
          <van-icon name="delete-o" size="20" />
        </div>
      </div>

      <div class="content-container">
        <!-- Notify Banner -->
        <div class="notice-card" v-if="activeTab === 'chat'">
          <div class="notice-left">
            <van-icon name="cross" class="close-icon" />
            <span class="notice-text">收不到新消息？点击开启通知</span>
          </div>
          <button class="open-notify-btn">开启通知</button>
        </div>

        <!-- Chat List -->
        <div v-if="activeTab === 'chat'" class="list-wrap">
          <div v-for="room in roomList" :key="`${room.targetUserId}-${room.sessionKey || 'service_default'}`" class="chat-card" @click="openChat(room)">
            <div class="avatar-wrap">
              <img class="avatar" :src="avatarUrl(room)" alt="avatar" />
            </div>
            <div class="main">
              <div class="name-row">
                <span class="name">{{ roomTitle(room) }}</span>
                <span class="time">{{ roomTime(room) }}</span>
              </div>
              <div class="msg-row">
                <span class="msg">{{ roomSubText(room) }}</span>
                <div v-if="(room.unreadCount || 0) > 0" class="badge">
                  {{ (room.unreadCount || 0) > 99 ? "99+" : room.unreadCount }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="!loading && !roomList.length" class="empty-state">
            <p>暂无消息</p>
          </div>
        </div>

        <!-- System List -->
        <div v-else class="system-wrap">
          <div class="empty-state">
            <p>暂无系统消息</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.news-page-wrapper {
  background-color: #000000;
  color: #fff;
  box-sizing: border-box;
  height: 100%;
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 40;
  height: 54px;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;

  .tabs {
    display: flex;
    gap: 16px;
    align-items: baseline;
  }

  .tab {
    color: #666;
    font-size: 16px;
    font-weight: normal;
    transition: all 0.2s;
    cursor: pointer;

    &.active-tab {
      color: #fff;
      font-size: 22px;
      font-weight: 600;
    }
  }

  .icons {
    display: flex;
    gap: 16px;
    color: #999;
  }
}

.content-container {
  padding: 0;
}

.notice-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1a1a1a;
  padding: 12px 16px;
}

.notice-left {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .close-icon {
    color: #666;
    font-size: 14px;
  }
  
  .notice-text {
    color: #888;
    font-size: 13px;
  }
}

.open-notify-btn {
  border: none;
  background: rgba(223, 194, 147, 0.15);
  color: #dfc293;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 14px;
}

.list-wrap {
  display: flex;
  flex-direction: column;
}

.chat-card {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  background: #000000;
  transition: background 0.2s;

  &:active {
    background: #0a0a0a;
  }
}

.avatar-wrap {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #111;
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .name {
    font-size: 16px;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 240px;
  }

  .time {
    color: #666;
    font-size: 12px;
  }
}

.msg-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .msg {
    font-size: 14px;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 10px;
  }

  .badge {
    min-width: 18px;
    height: 18px;
    line-height: 18px;
    border-radius: 9px;
    background: #ff4d4f;
    text-align: center;
    color: #fff;
    font-size: 11px;
    font-weight: 500;
    padding: 0 5px;
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #666;
  font-size: 14px;
}
</style>
