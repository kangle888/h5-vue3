<script setup lang="ts">
import { computed, reactive, ref } from "vue";
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

const ageOptions = Array.from({ length: 83 }, (_, i) => ({
  name: `${18 + i}岁`,
  value: String(18 + i)
}));

const heightOptions = Array.from({ length: 81 }, (_, i) => ({
  name: `${140 + i}cm`,
  value: String(140 + i)
}));

const weightOptions = Array.from({ length: 91 }, (_, i) => ({
  name: `${40 + i}kg`,
  value: String(40 + i)
}));

const constellationOptions = [
  "白羊座",
  "金牛座",
  "双子座",
  "巨蟹座",
  "狮子座",
  "处女座",
  "天秤座",
  "天蝎座",
  "射手座",
  "摩羯座",
  "水瓶座",
  "双鱼座"
].map(item => ({ name: item, value: item }));

const ageText = computed(() => (form.age ? `${form.age}岁` : "未设置"));
const heightText = computed(() => (form.height ? `${form.height}cm` : "未设置"));
const weightText = computed(() => (form.weight ? `${form.weight}kg` : "未设置"));
const constellationText = computed(() => form.constellation || "未设置");

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

const avatarUploading = ref(false);
const cameraInputRef = ref<HTMLInputElement | null>(null);
const albumInputRef = ref<HTMLInputElement | null>(null);

const getExtByMime = (mime?: string) => {
  if (!mime) return "jpg";
  const lower = mime.toLowerCase();
  if (lower.includes("png")) return "png";
  if (lower.includes("webp")) return "webp";
  if (lower.includes("gif")) return "gif";
  if (lower.includes("heic")) return "heic";
  if (lower.includes("heif")) return "heif";
  if (lower.includes("jpeg") || lower.includes("jpg")) return "jpg";
  return "jpg";
};

const toUniqueImageName = (mime?: string) => {
  const ext = getExtByMime(mime);
  return `${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
};

const uploadAvatarFile = async (file?: File | null) => {
  if (!file) return;
  avatarUploading.value = true;
  try {
    const mime = file.type || "image/jpeg";
    const fileName = await uploadAttachmentApi(file, toUniqueImageName(mime));
    form.avatar = fileName || "";
    showSuccessToast("头像上传成功");
  } catch {
    showFailToast("头像上传失败");
  } finally {
    avatarUploading.value = false;
  }
};

const onChooseCamera = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] || null;
  input.value = "";
  await uploadAvatarFile(file);
};

const onChooseAlbum = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] || null;
  input.value = "";
  await uploadAvatarFile(file);
};

const pickerVisible = ref(false);
const pickerTitle = ref("");
const pickerActions = ref<Array<{ name: string; value: string }>>([]);
let pickerResolver: ((value: string) => void) | null = null;

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

const openAvatarActions = async () => {
  if (avatarUploading.value) return;
  const action = await showPicker("选择头像", [
    // { name: "拍照", value: "camera" },
    { name: "从相册选择", value: "album" }
  ]);

  // if (action === "camera") {
  //   cameraInputRef.value?.click();
  //   return;
  // }
  if (action === "album") {
    albumInputRef.value?.click();
  }
};

const chooseByActionSheet = async (options: {
  title: string;
  actions: Array<{ name: string; value: string }>;
}) => {
  const action = await showPicker(options.title, options.actions);
  return action || "";
};

const onPickAge = async () => {
  const selected = await chooseByActionSheet({ title: "年龄", actions: ageOptions });
  if (selected) form.age = selected;
};

const onPickHeight = async () => {
  const selected = await chooseByActionSheet({ title: "身高", actions: heightOptions });
  if (selected) form.height = selected;
};

const onPickWeight = async () => {
  const selected = await chooseByActionSheet({ title: "体重", actions: weightOptions });
  if (selected) form.weight = selected;
};

const onPickConstellation = async () => {
  const selected = await chooseByActionSheet({ title: "星座", actions: constellationOptions });
  if (selected) form.constellation = selected;
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
          <div class="avatar-uploader" @click="openAvatarActions">
            <div class="avatar-wrap">
              <img v-if="avatarUrl()" :src="avatarUrl()" class="avatar" alt="avatar" />
              <div v-else class="avatar placeholder">
                <van-icon name="photograph" size="24" color="#666" />
              </div>
            </div>
          </div>
          <input ref="cameraInputRef" type="file" accept="image/*" capture="environment" class="hidden-file"
            @change="onChooseCamera" />
          <input ref="albumInputRef" type="file" accept="image/*" class="hidden-file" @change="onChooseAlbum" />
        </div>

        <van-cell-group inset class="field-group">
          <van-field v-model="form.nickname" label="昵称" placeholder="未设置" />
          <van-field :model-value="ageText" label="年龄" placeholder="未设置" is-link readonly @click="onPickAge" />
          <van-field v-model="form.occupation" label="职业" placeholder="未设置" />
          <van-field :model-value="heightText" label="身高" placeholder="未设置" is-link readonly @click="onPickHeight" />
          <van-field :model-value="weightText" label="体重" placeholder="未设置" is-link readonly @click="onPickWeight" />
          <van-field :model-value="constellationText" label="星座" placeholder="未设置" is-link readonly
            @click="onPickConstellation" />
          <!-- </van-cell-group> -->

          <!-- <van-cell-group inset class="field-group"> -->
          <van-field v-model="form.introduction" label="个人介绍" rows="2" autosize maxlength="30" show-word-limit
            type="textarea" placeholder="简单介绍一下自己吧..." />
        </van-cell-group>

        <div class="action-wrap">
          <van-button block round type="primary" :loading="saving" @click="onSave">保存</van-button>
        </div>
      </div>

    </div>

    <van-action-sheet v-model:show="pickerVisible" :title="pickerTitle" :actions="pickerActions" cancel-text="取消"
      @select="onPickerSelect" @cancel="onPickerCancel" @close="onPickerCancel" />
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

.avatar,
.placeholder {
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
