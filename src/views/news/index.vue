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

const loadData = async () => {
  loading.value = true;
  try {
    const res = await pageChatRoomApi({
      pageNum: 1,
      pageSize: 200,
      query: {}
    });

    const rows = res?.records || [];
    const withUnread = await Promise.all(
      rows.map(async room => {
        const unread = await countUnreadApi(room.targetUserId, room.sessionKey || "service_default");
        return {
          ...room,
          unreadCount: unread || 0
        } as IChatRoomItem;
      })
    );

    roomList.value = withUnread;
  } catch {
    showFailToast("加载消息失败");
  } finally {
    loading.value = false;
  }
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
  pollTimer.value = window.setInterval(async () => {
    await loadData();
  }, 4000);
});

onBeforeUnmount(() => {
  if (pollTimer.value) clearInterval(pollTimer.value);
});
</script>

<template>
  <div class="news-page-wrapper relative min-h-screen w-full overflow-hidden">
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
    <div class="bg-shape shape-3"></div>

    <div class="relative z-10 box-border min-h-screen pb-20">
      <div class="top-bar glass-nav">
        <div class="tabs">
          <div class="tab" :class="{ 'active-tab': activeTab === 'chat' }" @click="activeTab = 'chat'">
            消息
            <div class="indicator"></div>
          </div>
          <div class="tab" :class="{ 'active-tab': activeTab === 'system' }" @click="activeTab = 'system'">
            系统
            <div class="indicator"></div>
          </div>
        </div>
        <div class="icons">
          <van-icon name="chat-o" size="22" />
          <van-icon name="delete-o" size="22" />
        </div>
      </div>

      <div class="content-container">
        <div class="notice-card glass-panel flex justify-between items-center mb-4">
          <span class="text-xs text-white/70 flex items-center gap-1">
            <van-icon name="bell" color="#fcd34d" />
            收不到新消息？点击开启通知
          </span>
          <button class="open-notify-btn">立即开启</button>
        </div>

        <div v-if="activeTab === 'chat'" class="list-wrap">
          <div v-for="room in roomList" :key="`${room.targetUserId}-${room.sessionKey || 'service_default'}`" class="chat-card glass-panel" @click="openChat(room)">
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
            <van-icon name="chat" size="48" class="mb-2 opacity-20" />
            <p>暂无会话，去详情页点击“联系Ta”开始聊天</p>
          </div>
        </div>

        <div v-else class="system-wrap">
          <div class="empty-state">
            <van-icon name="bell" size="48" class="mb-2 opacity-20" />
            <p>暂无系统消息</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.news-page-wrapper {
  background-color: #0f0c29;
  background: linear-gradient(to bottom right, #0f0c29, #302b63, #24243e);
  color: #fff;
}

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
}

.top-bar {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;

  .tabs {
    display: flex;
    gap: 20px;
    height: 100%;
  }

  .tab {
    position: relative;
    display: flex;
    align-items: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 18px;
    font-weight: 600;
    transition: all 0.3s;
    cursor: pointer;

    &.active-tab {
      color: #fff;
      font-size: 22px;
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

  .icons {
    display: flex;
    gap: 16px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.content-container {
  padding: 16px;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
  border-radius: 16px;
}

.notice-card {
  padding: 12px 14px;
  margin-bottom: 16px;
}

.open-notify-btn {
  background: linear-gradient(90deg, #fcd34d, #f59e0b);
  border: none;
  color: #451a03;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.list-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-card {
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: background 0.2s;
  cursor: pointer;

  &:active {
    background: rgba(255, 255, 255, 0.08);
  }
}

.avatar-wrap {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  flex-shrink: 0;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #111;
  border: 2px solid #1a1a1a;
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
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 240px;
  }

  .time {
    color: rgba(255, 255, 255, 0.4);
    font-size: 12px;
  }
}

.msg-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .msg {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
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
    background: linear-gradient(135deg, #f43f5e, #e11d48);
    text-align: center;
    color: #fff;
    font-size: 11px;
    font-weight: bold;
    padding: 0 5px;
    box-shadow: 0 2px 8px rgba(225, 29, 72, 0.4);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}
</style>
