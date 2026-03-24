<script setup lang="ts">
import { reactive, ref } from "vue";
import { showFailToast, showSuccessToast } from "vant";
import { useRouter } from "vue-router";
import {
  getAttachmentDownloadUrl,
  getCurrentCUserApi,
  updateCurrentCUserApi,
  uploadAttachmentApi
} from "@/api/c-user";

defineOptions({ name: "MyEdit" });

const router = useRouter();
const saving = ref(false);
const form = reactive({
  avatar: "",
  nickname: "",
  age: "",
  occupation: "",
  height: "",
  weight: "",
  introduction: "",
  constellation: ""
});

const avatarUrl = () => getAttachmentDownloadUrl(form.avatar);

const loadProfile = async () => {
  const res = await getCurrentCUserApi();
  form.avatar = res?.avatar || "";
  form.nickname = res?.nickname || "";
  form.age = res?.age || "";
  form.occupation = res?.occupation || "";
  form.height = res?.height || "";
  form.weight = res?.weight || "";
  form.introduction = res?.introduction || "";
  form.constellation = res?.constellation || "";
};

loadProfile();

const onChooseAvatar = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  try {
    const fileName = await uploadAttachmentApi(file);
    form.avatar = fileName || "";
    showSuccessToast("头像上传成功");
  } catch {
    showFailToast("头像上传失败");
  }
};

const onSave = async () => {
  saving.value = true;
  try {
    await updateCurrentCUserApi({ ...form });
    showSuccessToast("保存成功");
    router.back();
  } catch {
    showFailToast("保存失败");
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="edit-page-wrapper relative min-h-screen w-full overflow-hidden">
    <!-- Animated background elements -->
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
    <div class="bg-shape shape-3"></div>

    <div class="relative z-10 box-border min-h-screen pb-10">
      <div class="top-bar">
        <div class="back-btn" @click="router.back()">
          <van-icon name="arrow-left" size="20" color="#fff" />
        </div>
        <span class="title">编辑资料</span>
        <button class="save-btn" @click="onSave">
          {{ saving ? "..." : "保存" }}
        </button>
      </div>

      <div class="form-container">
        <!-- Avatar Section -->
        <div class="avatar-section glass-panel">
          <div class="label">头像</div>
          <label class="avatar-uploader">
            <div class="avatar-wrap">
              <img v-if="avatarUrl()" :src="avatarUrl()" class="avatar" alt="avatar" />
              <div v-else class="avatar placeholder">
                 <van-icon name="photograph" size="24" color="#fff" class="opacity-50" />
              </div>
            </div>
            <input type="file" accept="image/*" class="hidden-file" @change="onChooseAvatar" />
          </label>
        </div>

        <!-- Info Section -->
        <div class="info-section glass-panel">
          <div class="cell">
            <span class="label">昵称</span>
            <input v-model="form.nickname" placeholder="未设置" />
          </div>
          <div class="cell">
            <span class="label">年龄</span>
            <input v-model="form.age" placeholder="未设置" />
          </div>
          <div class="cell">
            <span class="label">职业</span>
            <input v-model="form.occupation" placeholder="未设置" />
          </div>
          <div class="cell">
            <span class="label">身高(cm)</span>
            <input v-model="form.height" placeholder="未设置" type="number" />
          </div>
          <div class="cell">
            <span class="label">体重(kg)</span>
            <input v-model="form.weight" placeholder="未设置" type="number" />
          </div>
          <div class="cell no-border">
            <span class="label">星座</span>
            <input v-model="form.constellation" placeholder="未设置" />
          </div>
        </div>

        <!-- Intro Section -->
        <div class="intro-section glass-panel">
          <div class="label mb-2">个人介绍</div>
          <div class="textarea-wrap">
            <textarea v-model="form.introduction" maxlength="30" placeholder="简单介绍一下自己吧..." />
            <div class="counter">{{ form.introduction.length }}/30</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.edit-page-wrapper {
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

.shape-1 {
  width: 300px;
  height: 300px;
  background: rgba(236, 72, 153, 0.35); /* Pink */
  top: -50px;
  right: -50px;
}

.shape-2 {
  width: 350px;
  height: 350px;
  background: rgba(139, 92, 246, 0.35); /* Violet */
  top: 40%;
  left: -100px;
  animation-delay: -3s;
}

.shape-3 {
  width: 250px;
  height: 250px;
  background: rgba(56, 189, 248, 0.25); /* Sky Blue */
  bottom: -50px;
  right: 20%;
  animation-delay: -5s;
}

@keyframes float {
  0% { transform: translateY(0) scale(1); }
  100% { transform: translateY(30px) scale(1.05); }
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: rgba(15, 12, 41, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

  .title {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 1px;
  }
}

.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.save-btn {
  background: linear-gradient(90deg, #ec4899, #8b5cf6);
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(236, 72, 153, 0.4);
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.95);
    background: linear-gradient(90deg, #db2777, #7c3aed);
  }
}

.form-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Glassmorphism Panel Base */
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
  border-radius: 20px;
}

/* Avatar Section */
.avatar-section {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .label {
    font-size: 15px;
    font-weight: 600;
  }
}

.avatar-uploader {
  cursor: pointer;
}

.avatar-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(135deg, #ec4899, #8b5cf6, #38bdf8);
}

.avatar, .placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #111;
  border: 2px solid rgba(255,255,255,0.1);
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hidden-file {
  display: none;
}

/* Info Section */
.info-section {
  padding: 0 20px;
}

.cell {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  &.no-border {
    border-bottom: none;
  }

  .label {
    font-size: 15px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
  }

  input {
    width: 60%;
    background: transparent;
    border: none;
    color: #fff;
    text-align: right;
    outline: none;
    font-size: 15px;

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }
}

/* Intro Section */
.intro-section {
  padding: 16px 20px;

  .label {
    font-size: 15px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
  }
}

.textarea-wrap {
  margin-top: 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
  transition: all 0.3s;

  &:focus-within {
    border: 1px solid rgba(236, 72, 153, 0.4);
    box-shadow: 0 0 10px rgba(236, 72, 153, 0.1);
  }

  textarea {
    width: 100%;
    min-height: 80px;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 14px;
    line-height: 1.5;
    resize: none;
    outline: none;

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }

  .counter {
    text-align: right;
    color: rgba(255, 255, 255, 0.4);
    font-size: 12px;
    margin-top: 4px;
  }
}
</style>
