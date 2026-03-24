<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { showImagePreview, showFailToast, showSuccessToast } from "vant";
import { useRouter } from "vue-router";
import {
  getAdminUserApi,
  markReadApi,
  pageMessageApi,
  sendFileApi,
  sendTextApi,
  type IPlayMessageItem
} from "@/api/news";
import { getAttachmentObjectUrl } from "@/api/home";
import { getAttachmentDownloadUrl } from "@/api/c-user";

defineOptions({ name: "NewsChatPage" });

const router = useRouter();
const adminUserId = ref("");
const records = ref<IPlayMessageItem[]>([]);
const messageText = ref("");
const loading = ref(false);
const sendingImage = ref(false);
const socketIns = ref<WebSocket | null>(null);
const pollTimer = ref<number | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
const imagePreviewMap = ref<Record<string, string>>({});

const myUserId = computed(() => {
  try {
    const cUser = JSON.parse(localStorage.getItem("c_user_info") || "{}");
    if (cUser?.id) return cUser.id;
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    return userInfo?.id || "";
  } catch {
    return "";
  }
});

const myAvatarUrl = computed(() => {
  try {
    const cUser = JSON.parse(localStorage.getItem("c_user_info") || "{}");
    if (!cUser?.avatar) return "https://dummyimage.com/80x80/5f6470/ffffff.png&text=ME";
    return getAttachmentDownloadUrl(cUser.avatar);
  } catch {
    return "https://dummyimage.com/80x80/5f6470/ffffff.png&text=ME";
  }
});

const adminAvatarUrl = "https://dummyimage.com/80x80/2f7fff/ffffff.png&text=KF";

const wsUrl = () => {
  const base = (import.meta.env.VITE_BASE_API || "").replace(/^http/, "ws");
  const token = encodeURIComponent(
    localStorage.getItem("c_access_token") || localStorage.getItem("token") || ""
  );
  return `${base}/websocket/register?access-token=${token}`;
};

const connectSocket = () => {
  const token = localStorage.getItem("c_access_token") || localStorage.getItem("token") || "";
  if (!token) return;
  try {
    socketIns.value = new WebSocket(wsUrl());
    socketIns.value.onmessage = async () => {
      await loadMessages();
      if (adminUserId.value) {
        await markReadApi(adminUserId.value);
      }
    };
  } catch {
    // ignore
  }
};

const disconnectSocket = () => {
  if (socketIns.value) {
    socketIns.value.close();
    socketIns.value = null;
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (!listRef.value) return;
  listRef.value.scrollTop = listRef.value.scrollHeight;
};

const buildImagePreviewMap = async () => {
  const nextMap: Record<string, string> = {};
  for (const msg of records.value) {
    if (msg.messageType !== "file" || !msg.content || !msg.id) continue;
    const url = await getAttachmentObjectUrl(msg.content);
    if (url) nextMap[msg.id] = url;
  }
  imagePreviewMap.value = nextMap;
};

const loadMessages = async () => {
  if (!adminUserId.value) return;
  const res = await pageMessageApi({
    pageNum: 1,
    pageSize: 200,
    query: {
      receiverId: adminUserId.value
    }
  });
  records.value = (res?.records || []).slice().reverse();
  await buildImagePreviewMap();
  await scrollToBottom();
};

const initData = async () => {
  loading.value = true;
  try {
    const adminId = await getAdminUserApi();
    adminUserId.value = adminId || "";
    if (!adminUserId.value) {
      showFailToast("未找到管理员");
      return;
    }
    await loadMessages();
    await markReadApi(adminUserId.value);
  } catch {
    showFailToast("加载聊天失败");
  } finally {
    loading.value = false;
  }
};

const sendMessage = async () => {
  const text = messageText.value.trim();
  if (!text) return;
  if (!adminUserId.value) return;

  try {
    await sendTextApi({ receiverId: adminUserId.value, content: text });
    messageText.value = "";
    showSuccessToast("发送成功");
    await loadMessages();
  } catch {
    showFailToast("发送失败");
  }
};

const triggerChooseImage = () => {
  fileInputRef.value?.click();
};

const onChooseImage = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (!adminUserId.value) {
    showFailToast("管理员不可用");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("receiverId", adminUserId.value);

  sendingImage.value = true;
  try {
    await sendFileApi(formData);
    showSuccessToast("图片发送成功");
    await loadMessages();
  } catch {
    showFailToast("图片发送失败");
  } finally {
    sendingImage.value = false;
  }
};

const previewImage = (msgId?: string) => {
  if (!msgId) return;
  const url = imagePreviewMap.value[msgId];
  if (!url) return;
  showImagePreview([url]);
};

onMounted(async () => {
  await initData();
  connectSocket();
  pollTimer.value = window.setInterval(async () => {
    await loadMessages();
  }, 4000);
});

onBeforeUnmount(() => {
  disconnectSocket();
  if (pollTimer.value) clearInterval(pollTimer.value);
});
</script>

<template>
  <div class="chat-page">
    <div class="chat-header">
      <van-icon name="arrow-left" size="20" @click="router.back()" />
      <span class="title">客服聊天</span>
      <div class="right-placeholder"></div>
    </div>

    <div v-if="loading" class="loading-wrap">
      <van-loading size="20" />
    </div>

    <div v-else ref="listRef" class="chat-list">
      <div
        v-for="msg in records"
        :key="msg.id"
        class="chat-row"
        :class="{ mine: msg.senderId === myUserId }"
      >
        <template v-if="msg.messageType === 'file'">
          <img
            v-if="imagePreviewMap[msg.id || '']"
            class="image-bubble"
            :src="imagePreviewMap[msg.id || '']"
            alt="chat-image"
            @click="previewImage(msg.id)"
          />
          <div v-else class="bubble">[图片加载中]</div>
        </template>
        <div v-else class="bubble">{{ msg.content }}</div>
        <div class="meta-row">
          <span v-if="msg.senderId === myUserId" class="read-flag" :class="{ read: msg.readStatus === '1' }">
            {{ msg.readStatus === "1" ? "已读" : "未读" }}
          </span>
          <span class="time">{{ (msg.createTime || "").replace("T", " ") }}</span>
        </div>
      </div>
    </div>

    <div class="chat-input-wrap">
      <input
        v-model="messageText"
        class="chat-input"
        placeholder="请输入消息"
        @keyup.enter="sendMessage"
      />
      <button class="image-btn" :disabled="sendingImage" @click="triggerChooseImage">📷</button>
      <button class="send-btn" @click="sendMessage">发送</button>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden-file"
        @change="onChooseImage"
      />
    </div>
  </div>
</template>

<style scoped lang="less">
.chat-page {
  min-height: 100vh;
  height: 100vh;
  background: #0f0f10;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.chat-header {
  height: 48px;
  border-bottom: 1px solid #1d1d1d;
  display: flex;
  align-items: center;
  padding: 0 12px;

  .title {
    flex: 1;
    text-align: center;
    font-size: 17px;
    font-weight: 700;
  }

  .right-placeholder {
    width: 20px;
  }
}

.loading-wrap {
  height: calc(100vh - 48px - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-list {
  height: calc(100vh - 48px - 60px);
  overflow: auto;
  padding: 12px;
}

.chat-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 10px;

  &.mine {
    align-items: flex-end;

    .bubble {
      background: #2f7fff;
      color: #fff;
    }
  }
}

.bubble {
  max-width: 80%;
  padding: 8px 10px;
  border-radius: 10px;
  background: #1e1e20;
  color: #e9e9e9;
  font-size: 14px;
  line-height: 1.6;
}

.image-bubble {
  width: 140px;
  max-height: 180px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #2a2a2d;
}

.meta-row {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.read-flag {
  font-size: 11px;
  color: #8f8f8f;

  &.read {
    color: #4e89ff;
  }
}

.time {
  font-size: 11px;
  color: #8f8f8f;
}

.chat-input-wrap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border-top: 1px solid #1d1d1d;
  background: #151515;
}

.chat-input {
  flex: 1;
  height: 36px;
  border-radius: 18px;
  border: 1px solid #3b3b3d;
  background: #1f1f20;
  color: #fff;
  padding: 0 12px;
  outline: none;
}

.image-btn {
  width: 40px;
  height: 36px;
  border: none;
  border-radius: 18px;
  background: #2a2a2d;
  color: #fff;
  font-size: 16px;
}

.send-btn {
  width: 64px;
  height: 36px;
  border: none;
  border-radius: 18px;
  background: #2f7fff;
  color: #fff;
  font-size: 14px;
}

.hidden-file {
  display: none;
}
</style>
