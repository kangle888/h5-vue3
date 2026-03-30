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
const cameraInputRef = ref<HTMLInputElement | null>(null);
const albumInputRef = ref<HTMLInputElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
const imagePreviewMap = ref<Record<string, string>>({});

const pickerVisible = ref(false);
const pickerTitle = ref("");
const pickerActions = ref<Array<{ name: string; value: string }>>([]);
let pickerResolver: ((value: string) => void) | null = null;

/**
 * 压缩图片：最大边 1080px，JPEG 质量 0.8，目标大小 1MB 以下
 */
const compressImage = (file: File, maxSize = 1080, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width: originalWidth, height: originalHeight } = img;

      const compress = (currentMaxSize: number, currentQuality: number): Promise<File> => {
        return new Promise((res, rej) => {
          let { width, height } = img;
          if (width > currentMaxSize || height > currentMaxSize) {
            if (width >= height) {
              height = Math.round((height * currentMaxSize) / width);
              width = currentMaxSize;
            } else {
              width = Math.round((width * currentMaxSize) / height);
              height = currentMaxSize;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return rej(new Error("canvas context unavailable"));
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            blob => {
              if (!blob) return rej(new Error("compress failed"));
              if (blob.size <= 1024 * 1024) { // 1MB
                res(new File([blob], file.name, { type: "image/jpeg" }));
              } else {
                // 如果质量 > 0.1，降低质量
                if (currentQuality > 0.1) {
                  compress(currentMaxSize, currentQuality - 0.1).then(res).catch(rej);
                } else {
                  // 如果尺寸 > 300，缩小尺寸
                  if (currentMaxSize > 300) {
                    compress(currentMaxSize - 200, 0.8).then(res).catch(rej);
                  } else {
                    // 最后尝试最低质量
                    canvas.toBlob(
                      finalBlob => {
                        if (!finalBlob) return rej(new Error("final compress failed"));
                        res(new File([finalBlob], file.name, { type: "image/jpeg" }));
                      },
                      "image/jpeg",
                      0.1
                    );
                  }
                }
              }
            },
            "image/jpeg",
            currentQuality
          );
        });
      };

      compress(maxSize, quality).then(resolve).catch(reject);
    };
    img.onerror = reject;
    img.src = url;
  });
};

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
    ? `${playerName.value}`
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
  openImageActions();
};

const onChooseImage = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  await uploadImageFile(file);
};

const previewImage = (msgId?: string) => {
  if (!msgId) return;
  const url = imagePreviewMap.value[msgId];
  if (!url) return;
  showImagePreview([url]);
};

const showPicker = async (
  title: string,
  actions: Array<{ name: string; value: string }>
) => {
  pickerTitle.value = title;
  pickerActions.value = actions;
  pickerVisible.value = true;
  return new Promise<string>(resolve => {
    pickerResolver = resolve;
  });
};

const onPickerSelect = (action: { name?: string; value?: string }) => {
  pickerVisible.value = false;
  const value = action?.value || (action?.name === "拍照" ? "camera" : action?.name === "从相册选择" ? "album" : "");
  if (pickerResolver) {
    pickerResolver(value);
    pickerResolver = null;
  }
};

const onPickerCancel = () => {
  pickerVisible.value = false;
  if (pickerResolver) {
    pickerResolver("");
    pickerResolver = null;
  }
};

const openImageActions = async () => {
  if (sendingImage.value) return;
  const action = await showPicker("选择图片", [
    { name: "拍照", value: "camera" },
    { name: "从相册选择", value: "album" }
  ]);

  if (action === "camera") {
    cameraInputRef.value?.click();
    return;
  }
  if (action === "album") {
    albumInputRef.value?.click();
  }
};

const onChooseCamera = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] || null;
  input.value = "";
  await uploadImageFile(file);
};

const onChooseAlbum = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] || null;
  input.value = "";
  await uploadImageFile(file);
};

const uploadImageFile = async (file?: File | null) => {
  if (!file) return;
  if (!adminUserId.value) {
    showFailToast("管理员不可用");
    return;
  }

  sendingImage.value = true;
  try {
    let fileToUpload = file;
    if (file.type.startsWith("image/")) {
      fileToUpload = await compressImage(file);
    }
    // 如果是视频，直接上传不压缩
    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("receiverId", adminUserId.value);
    formData.append("scene", chatScene.value);
    formData.append("sessionKey", sessionKey.value);
    if (playerId.value) {
      formData.append("playerId", playerId.value);
      formData.append("playerName", playerName.value);
    }

    await sendFileApi(formData);
    showSuccessToast("文件发送成功");
    await loadMessages();
  } catch {
    showFailToast("文件发送失败");
  } finally {
    sendingImage.value = false;
  }
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

      <div v-if="loading" class="loading-wrap flex-1 flex items-center justify-center">
        <van-loading size="24" color="#ccc" />
      </div>

      <div v-else ref="listRef" class="chat-list flex-1 overflow-auto">
        <div v-for="msg in records" :key="msg.id" class="chat-row" :class="{ mine: msg.senderId === myUserId }">
          <div class="msg-content">
            <template v-if="msg.messageType === 'file'">
              <img v-if="imagePreviewMap[msg.id || '']" class="image-bubble" :src="imagePreviewMap[msg.id || '']"
                alt="chat-image" @click="previewImage(msg.id)" />
              <div v-else class="bubble loading-bubble">[图片加载中...]</div>
            </template>
            <div v-else class="bubble">{{ msg.content }}</div>

            <div class="meta-row">
              <span v-if="msg.senderId === myUserId" class="read-flag" :class="{ read: msg.readStatus === '1' }">
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
        <input v-model="messageText" class="chat-input" placeholder="给Ta发消息..." @keyup.enter="sendMessage" />
        <button class="action-btn" :disabled="sendingImage" @click="triggerChooseImage">
          <van-icon name="photograph" size="24" />
        </button>
        <button class="send-btn" @click="sendMessage">发送</button>
        <input ref="cameraInputRef" type="file" accept="image/*" capture class="hidden-file" @change="onChooseCamera" />
        <input ref="albumInputRef" type="file" accept="image/*,video/*" class="hidden-file" @change="onChooseAlbum" />
      </div>
    </div>

    <van-action-sheet v-model:show="pickerVisible" :title="pickerTitle" :actions="pickerActions" cancel-text="取消"
      @select="onPickerSelect" @cancel="onPickerCancel" @close="onPickerCancel" />
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
  height: 32px;
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
