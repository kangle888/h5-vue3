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
  <div class="edit-page-wrapper w-full">
    <div class="box-border">

      <div class="form-container">
        <!-- Avatar Section -->
        <div class="avatar-section panel">
          <div class="label">头像</div>
          <label class="avatar-uploader">
            <div class="avatar-wrap">
              <img v-if="avatarUrl()" :src="avatarUrl()" class="avatar" alt="avatar" />
              <div v-else class="avatar placeholder">
                 <van-icon name="photograph" size="24" color="#666" />
              </div>
            </div>
            <input type="file" accept="image/*" class="hidden-file" @change="onChooseAvatar" />
          </label>
        </div>

        <van-cell-group inset class="field-group">
          <van-field v-model="form.nickname" label="昵称" placeholder="未设置" />
          <van-field v-model="form.age" label="年龄" placeholder="未设置" type="digit" />
          <van-field v-model="form.occupation" label="职业" placeholder="未设置" />
          <van-field v-model="form.height" label="身高(cm)" placeholder="未设置" type="digit" />
          <van-field v-model="form.weight" label="体重(kg)" placeholder="未设置" type="digit" />
          <van-field v-model="form.constellation" label="星座" placeholder="未设置" />
        <!-- </van-cell-group> -->

        <!-- <van-cell-group inset class="field-group"> -->
          <van-field
            v-model="form.introduction"
            label="个人介绍"
            rows="2"
            autosize
            maxlength="30"
            show-word-limit
            type="textarea"
            placeholder="简单介绍一下自己吧..."
          />
        </van-cell-group>

        <div class="action-wrap">
          <van-button block round type="primary" :loading="saving" @click="onSave">保存</van-button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped lang="less">
.edit-page-wrapper {
  background-color: #000;
  color: #fff;
  height: 100%;
}

.box-border {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.save-btn {
  background: #dfc293;
  border: none;
  color: #000;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 14px;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.95);
    opacity: 0.8;
  }
}

.form-container {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 16px 72px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-wrap {
  margin-top: 4px;
}

@supports (padding: env(safe-area-inset-bottom)) {
  .form-container {
    padding-bottom: calc(72px + env(safe-area-inset-bottom));
  }
}

/* Panel Base */
.panel {
  background: #111;
  border-radius: 16px;
  overflow: hidden;
}

/* Avatar Section */
.avatar-section {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .label {
    font-size: 15px;
    font-weight: 500;
  }
}

.avatar-uploader {
  cursor: pointer;
}

.avatar-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
}

.avatar, .placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #1a1a1a;
  border: 1px solid #222;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hidden-file {
  display: none;
}

.field-group {
  :deep(.van-cell-group) {
    margin: 0 !important;
    background: #111;
  }
 
  :deep(.van-cell) {
    background: #111;
    color: #fff;
    padding: 12px 16px;
  }

  :deep(.van-cell::after) {
    border-bottom-color: #222;
  }

  :deep(.van-field__label) {
    color: #e5e5e5;
    width: 88px;
  }

  :deep(.van-field__control) {
    color: #fff;
    text-align: right;
  }

  :deep(textarea.van-field__control) {
    text-align: left;
    line-height: 1.6;
    min-height: 120px;
  }

  :deep(.van-field__control::placeholder) {
    color: #666;
  }

  :deep(.van-field__word-limit) {
    color: #777;
  }
}
</style>
