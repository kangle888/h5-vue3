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
  <div class="chat-page-wrapper relative min-h-screen w-full overflow-hidden">
    <!-- Animated background elements -->
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
    <div class="bg-shape shape-3"></div>

    <div class="chat-container relative z-10 box-border flex flex-col h-screen">
      <div class="chat-header glass-nav">
        <div class="back-btn" @click="router.back()">
          <van-icon name="arrow-left" size="20" color="#fff" />
        </div>
        <span class="title">客服聊天</span>
        <div class="right-placeholder"></div>
      </div>

      <div v-if="loading" class="loading-wrap flex-1 flex items-center justify-center">
        <van-loading size="24" color="#fbcfe8" />
      </div>

      <div v-else ref="listRef" class="chat-list flex-1 overflow-auto">
        <div
          v-for="msg in records"
          :key="msg.id"
          class="chat-row"
          :class="{ mine: msg.senderId === myUserId }"
        >
          <div class="msg-content">
            <template v-if="msg.messageType === 'file'">
              <img
                v-if="imagePreviewMap[msg.id || '']"
                class="image-bubble"
                :src="imagePreviewMap[msg.id || '']"
                alt="chat-image"
                @click="previewImage(msg.id)"
              />
              <div v-else class="bubble loading-bubble">[图片加载中...]</div>
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
      </div>

      <div class="chat-input-wrap glass-nav-bottom">
        <input
          v-model="messageText"
          class="chat-input"
          placeholder="给Ta发消息..."
          @keyup.enter="sendMessage"
        />
        <button class="icon-btn image-btn" :disabled="sendingImage" @click="triggerChooseImage">
          <van-icon name="photograph" size="20" />
        </button>
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
  </div>
</template>

<style scoped lang="less">
.chat-page-wrapper {
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
.shape-1 { width: 300px; height: 300px; background: rgba(236, 72, 153, 0.25); top: -50px; right: -50px; }
.shape-2 { width: 350px; height: 350px; background: rgba(139, 92, 246, 0.25); top: 30%; left: -100px; animation-delay: -3s; }
.shape-3 { width: 250px; height: 250px; background: rgba(56, 189, 248, 0.15); bottom: 50px; right: 20%; animation-delay: -5s; }

@keyframes float {
  0% { transform: translateY(0) scale(1); }
  100% { transform: translateY(30px) scale(1.05); }
}

.glass-nav {
  background: rgba(15, 12, 41, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.chat-header {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;

  .title {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 1px;
  }
}

.back-btn, .right-placeholder {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
}

.chat-list {
  padding: 16px;
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
}

.chat-row {
  display: flex;
  margin-bottom: 20px;
  width: 100%;

  .msg-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 80%;
  }

  /* Remote User Bubble styling */
  .bubble {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px 20px 20px 4px;
    padding: 10px 14px;
    font-size: 15px;
    line-height: 1.5;
    word-break: break-word;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  &.mine {
    justify-content: flex-end;

    .msg-content {
      align-items: flex-end;
    }

    .bubble {
      background: linear-gradient(135deg, #ec4899, #8b5cf6);
      color: #fff;
      border: 1px solid rgba(236, 72, 153, 0.3);
      border-radius: 20px 20px 4px 20px;
      box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
    }
  }
}

.loading-bubble {
  opacity: 0.6;
  font-style: italic;
  font-size: 13px !important;
}

.image-bubble {
  max-width: 200px;
  max-height: 240px;
  object-fit: cover;
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.meta-row {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
}

.read-flag {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);

  &.read {
    color: #38bdf8; /* Sky blue when read */
  }
}

.time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

.glass-nav-bottom {
  background: rgba(15, 12, 41, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.chat-input-wrap {
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  padding-bottom: max(10px, env(safe-area-inset-bottom));
}

.chat-input {
  flex: 1;
  height: 40px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  padding: 0 16px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
  
  &:focus {
    border-color: rgba(236, 72, 153, 0.5);
    background: rgba(255, 255, 255, 0.05);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  transition: background 0.2s;
  
  &:active {
    background: rgba(255, 255, 255, 0.15);
  }
}

.send-btn {
  height: 40px;
  padding: 0 16px;
  border-radius: 20px;
  border: none;
  background: linear-gradient(90deg, #ec4899, #8b5cf6);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  transition: transform 0.2s;
  
  &:active {
    transform: scale(0.95);
  }
}

.hidden-file {
  display: none;
}
</style>
