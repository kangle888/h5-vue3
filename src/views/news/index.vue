<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { showFailToast } from "vant";
import { useRouter } from "vue-router";
import {
  countUnreadApi,
  getAdminUserApi,
  pageMessageApi,
  type IPlayMessageItem
} from "@/api/news";

defineOptions({ name: "News" });

const router = useRouter();
const activeTab = ref<"chat" | "system">("chat");
const loading = ref(false);
const unreadCount = ref(0);
const adminUserId = ref("");
const records = ref<IPlayMessageItem[]>([]);
const pollTimer = ref<number | null>(null);

const latestMessage = computed(() => {
  if (!records.value.length) return null;
  return records.value[records.value.length - 1];
});

const latestTime = computed(() => {
  const value = latestMessage.value?.createTime;
  if (!value) return "";
  return value.replace("T", " ").slice(11, 16);
});

const latestText = computed(() => {
  const txt = latestMessage.value?.content;
  if (!txt) return "点击进入聊天";
  return txt;
});

const avatarUrl = computed(() => {
  return "https://picsum.photos/seed/admin-chat/120/120";
});

const loadData = async () => {
  loading.value = true;
  try {
    const adminId = await getAdminUserApi();
    adminUserId.value = adminId || "";
    if (!adminUserId.value) return;

    const res = await pageMessageApi({
      pageNum: 1,
      pageSize: 50,
      query: {
        receiverId: adminUserId.value
      }
    });
    records.value = res?.records || [];
    unreadCount.value = await countUnreadApi(adminUserId.value);
  } catch {
    showFailToast("加载消息失败");
  } finally {
    loading.value = false;
  }
};

const openChat = () => {
  router.push({ name: "NewsChatPage" });
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
  <div class="news-index-page">
    <div class="top-tabs">
      <div class="tab" :class="{ active: activeTab === 'chat' }" @click="activeTab = 'chat'">聊天</div>
      <div class="tab" :class="{ active: activeTab === 'system' }" @click="activeTab = 'system'">系统消息</div>
      <div class="icons">
        <van-icon name="chat-o" size="20" />
        <van-icon name="delete-o" size="20" />
      </div>
    </div>

    <div class="notice-bar">
      <span class="notice-left">× 收不到新消息？点击开启通知</span>
      <span class="notice-btn">开启通知</span>
    </div>

    <div v-if="activeTab === 'chat'" class="list-wrap">
      <div class="chat-item" @click="openChat">
        <img class="avatar" :src="avatarUrl" alt="avatar" />
        <div class="main">
          <div class="name">客服消息</div>
          <div class="msg">{{ latestText }}</div>
        </div>
        <div class="right">
          <div class="time">{{ latestTime || "--:--" }}</div>
          <div v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? "99+" : unreadCount }}</div>
        </div>
      </div>

      <div v-if="!loading && !records.length" class="empty">暂无会话，去详情页点击“联系管理员”开始聊天</div>
    </div>

    <div v-else class="system-wrap">
      <div class="empty">暂无系统消息</div>
    </div>
  </div>
</template>

<style scoped lang="less">
.news-index-page {
  min-height: calc(100vh - 50px);
  background: #000;
  color: #fff;
}

.top-tabs {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid #151515;

  .tab {
    margin-right: 16px;
    color: #8f8f8f;
    font-size: 24px;
    font-weight: 700;

    &.active {
      color: #fff;
    }
  }

  .icons {
    margin-left: auto;
    display: flex;
    gap: 12px;
    color: #d0d0d0;
  }
}

.notice-bar {
  height: 36px;
  background: #2b2b2b;
  color: #bdbdbd;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  font-size: 12px;

  .notice-btn {
    background: #857040;
    color: #fff;
    border-radius: 12px;
    padding: 2px 8px;
  }
}

.list-wrap {
  padding: 0 10px;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #121212;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.main {
  flex: 1;
  min-width: 0;

  .name {
    font-size: 17px;
    font-weight: 600;
    color: #f2f2f2;
  }

  .msg {
    margin-top: 4px;
    font-size: 14px;
    color: #979797;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;

  .time {
    color: #8a8a8a;
    font-size: 12px;
  }

  .badge {
    min-width: 18px;
    height: 18px;
    line-height: 18px;
    border-radius: 9px;
    background: #ff4d5d;
    text-align: center;
    color: #fff;
    font-size: 12px;
    padding: 0 5px;
  }
}

.system-wrap,
.empty {
  color: #8f8f8f;
  text-align: center;
  padding: 34px 12px;
  font-size: 14px;
}
</style>
