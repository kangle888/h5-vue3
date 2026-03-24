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
  <div class="edit-page">
    <div class="top-bar">
      <van-icon name="arrow-left" size="20" @click="router.back()" />
      <span>编辑资料</span>
      <span class="save" @click="onSave">{{ saving ? "保存中" : "保存" }}</span>
    </div>

    <div class="cell">
      <span>头像</span>
      <label class="avatar-uploader">
        <img v-if="avatarUrl()" :src="avatarUrl()" class="avatar" alt="avatar" />
        <span v-else class="avatar-placeholder"></span>
        <input type="file" accept="image/*" class="hidden-file" @change="onChooseAvatar" />
      </label>
    </div>

    <div class="cell"><span>昵称</span><input v-model="form.nickname" /></div>
    <div class="cell"><span>年龄</span><input v-model="form.age" /></div>
    <div class="cell"><span>职业</span><input v-model="form.occupation" /></div>
    <div class="cell"><span>身高</span><input v-model="form.height" /></div>
    <div class="cell"><span>体重</span><input v-model="form.weight" /></div>
    <div class="cell"><span>星座</span><input v-model="form.constellation" /></div>

    <div class="intro-block">
      <div class="label">个人介绍</div>
      <textarea v-model="form.introduction" maxlength="30" placeholder="请输入" />
      <div class="counter">{{ form.introduction.length }}/30</div>
    </div>
  </div>
</template>

<style scoped lang="less">
.edit-page {
  min-height: 100vh;
  background: #090a0d;
  color: #fff;
}
.top-bar {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid #1f2024;
}
.save {
  color: #fff;
}
.cell {
  height: 52px;
  border-bottom: 1px solid #1f2024;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;

  input {
    width: 58%;
    background: transparent;
    border: none;
    color: #bbb;
    text-align: right;
    outline: none;
  }
}
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}
.avatar-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid #3a3c42;
  display: inline-block;
}
.hidden-file {
  display: none;
}
.intro-block {
  padding: 12px 14px;

  textarea {
    margin-top: 8px;
    width: 100%;
    min-height: 90px;
    background: #0f1014;
    border: 1px solid #272a31;
    color: #ddd;
    border-radius: 10px;
    padding: 10px;
    resize: none;
    outline: none;
  }

  .counter {
    margin-top: 6px;
    text-align: right;
    color: #777;
  }
}
</style>
