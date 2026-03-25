<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { showImagePreview, showFailToast, showSuccessToast } from "vant";
import { useRoute, useRouter } from "vue-router";
import {
  getAdminUserApi,
  markReadApi,
  pageMessageApi,
  sendFileApi,
  sendTextApi,
  type IPlayMessageItem
} from "@/api/news";
import { getAttachmentObjectUrl } from "@/api/home";

defineOptions({ name: "NewsChatPage" });

const router = useRouter();
const route = useRoute();
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

const playerId = computed(() => {
  const raw = route.query.playerId;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" ? value : "";
});

const playerName = computed(() => {
  const raw = route.query.playerName;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" && value.trim() ? value : "TA";
});

const chatScene = computed(() => {
  const raw = route.query.scene;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "player" ? "player" : "service";
});

const sessionKey = computed(() => {
  const raw = route.query.sessionKey;
  const fromQuery = Array.isArray(raw) ? raw[0] : raw;
  if (typeof fromQuery === "string" && fromQuery.trim()) {
    return fromQuery;
  }
  return chatScene.value === "player" && playerId.value
    ? `player_${playerId.value}`
    : "service_default";
});

const chatTitle = computed(() => {
  return chatScene.value === "player"
    ? `联系客服（${playerName.value}）`
    : "客服聊天";
});

const wsUrl = () => {
  console.log("VITE_BASE_API:----", import.meta.env.VITE_BASE_API);
  const base = (import.meta.env.VITE_BASE_API || "").replace(/^http/, "ws");
  const token = encodeURIComponent(
    localStorage.getItem("c_access_token") ||
      localStorage.getItem("token") ||
      ""
  );
  return `${base}/websocket/register?access-token=${token}`;
};

const connectSocket = () => {
  const token =
    localStorage.getItem("c_access_token") ||
    localStorage.getItem("token") ||
    "";
  if (!token) return;
  try {
    socketIns.value = new WebSocket(wsUrl());
    socketIns.value.onmessage = async () => {
      await loadMessages();
      if (adminUserId.value) {
        await markReadApi(adminUserId.value, sessionKey.value);
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
      receiverId: adminUserId.value,
      sessionKey: sessionKey.value
    }
  });
  const all = (res?.records || []).slice();
  records.value = all
    .filter(item => {
      if (item.sessionKey) return item.sessionKey === sessionKey.value;
      // 兼容后端未返回 sessionKey 的老数据：默认归到客服总会话
      return sessionKey.value === "service_default";
    })
    .reverse();
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
    await markReadApi(adminUserId.value, sessionKey.value);
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
    await sendTextApi({
      receiverId: adminUserId.value,
      content: text,
      scene: chatScene.value,
      playerId: playerId.value || undefined,
      playerName: playerName.value,
      sessionKey: sessionKey.value
    });
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
  formData.append("scene", chatScene.value);
  formData.append("sessionKey", sessionKey.value);
  if (playerId.value) {
    formData.append("playerId", playerId.value);
    formData.append("playerName", playerName.value);
  }

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
  <div class="chat-page-wrapper min-h-screen w-full">
    <div class="chat-container box-border flex flex-col h-screen">
      <div class="chat-header">
        <div class="icon-btn-header" @click="router.back()">
          <van-icon name="arrow-left" size="20" color="#fff" />
        </div>
        <span class="title">{{ chatTitle }}</span>
        <div class="right-placeholder"></div>
      </div>

      <div
        v-if="loading"
        class="loading-wrap flex-1 flex items-center justify-center"
      >
        <van-loading size="24" color="#ccc" />
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
              <span
                v-if="msg.senderId === myUserId"
                class="read-flag"
                :class="{ read: msg.readStatus === '1' }"
              >
                {{ msg.readStatus === "1" ? "已读" : "未读" }}
              </span>
              <span class="time">{{
                (msg.createTime || "").replace("T", " ")
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-wrap">
        <input
          v-model="messageText"
          class="chat-input"
          placeholder="给Ta发消息..."
          @keyup.enter="sendMessage"
        />
        <button
          class="action-btn"
          :disabled="sendingImage"
          @click="triggerChooseImage"
        >
          <van-icon name="photograph" size="24" />
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
  background-color: #000000;
  color: #fff;
}

.chat-header {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #000000;
  border-bottom: 1px solid #111;

  .title {
    font-size: 16px;
    font-weight: 500;
    color: #fff;
  }
}

.icon-btn-header {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.right-placeholder {
  width: 36px;
  height: 36px;
}

.chat-list {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
}

.chat-row {
  display: flex;
  margin-bottom: 24px;
  width: 100%;

  .msg-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 75%;
  }

  /* Remote User Bubble styling */
  .bubble {
    background: #1a1a1a;
    color: #e5e5e5;
    border-radius: 16px 16px 16px 4px;
    padding: 12px 16px;
    font-size: 15px;
    line-height: 1.5;
    word-break: break-word;
  }

  &.mine {
    justify-content: flex-end;

    .msg-content {
      align-items: flex-end;
    }

    .bubble {
      background: #dfc293;
      color: #000000;
      border-radius: 16px 16px 4px 16px;
      font-weight: 500;
    }
  }
}

.loading-bubble {
  opacity: 0.6;
  font-size: 13px !important;
}

.image-bubble {
  max-width: 200px;
  max-height: 240px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #111;
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
  color: #666;

  &.read {
    color: #dfc293;
  }
}

.time {
  font-size: 11px;
  color: #666;
}

.chat-input-wrap {
  min-height: 56px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  background: #000000;
  border-top: 1px solid #111;
}

.chat-input {
  flex: 1;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: #1a1a1a;
  color: #fff;
  padding: 0 16px;
  font-size: 14px;
  outline: none;

  &:focus {
    background: #222;
  }

  &::placeholder {
    color: #666;
  }
}

.action-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: transparent;
  border: none;
  color: #999;

  &:active {
    color: #fff;
  }
}

.send-btn {
  height: 40px;
  padding: 0 16px;
  border-radius: 20px;
  border: none;
  background: #dfc293;
  color: #000;
  font-size: 14px;
  font-weight: 600;

  &:active {
    opacity: 0.8;
  }
}

.hidden-file {
  display: none;
}
</style>
