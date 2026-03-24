<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getAttachmentDownloadUrl, getCurrentCUserApi, type ICUserProfile } from "@/api/c-user";

defineOptions({ name: "My" });

const router = useRouter();
const profile = ref<ICUserProfile>({});

const avatarUrl = () => getAttachmentDownloadUrl(profile.value.avatar);

const loadProfile = async () => {
  try {
    profile.value = (await getCurrentCUserApi()) || {};
  } catch {
    profile.value = {};
  }
};

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="my-page">
    <div class="header-card">
      <img v-if="avatarUrl()" :src="avatarUrl()" class="avatar" alt="avatar" />
      <div v-else class="avatar placeholder"></div>
      <div class="info">
        <div class="name-row">
          <span class="name">{{ profile.nickname || "未设置昵称" }}</span>
          <span class="id">ID:{{ profile.id || "-" }}</span>
        </div>
        <div class="meta">{{ profile.age || "-" }}岁 · {{ profile.constellation || "-" }} · {{ profile.occupation || "-" }}</div>
        <div class="intro">{{ profile.introduction || "你还没有签名~" }}</div>
      </div>
      <button class="edit-btn" @click="router.push({ name: 'MyEdit' })">编辑信息</button>
    </div>

    <div class="stats-card">
      <div class="stat-item">
        <div class="num">0</div>
        <div class="label">钱包</div>
      </div>
      <div class="stat-item">
        <div class="num">1</div>
        <div class="label">心动女生</div>
      </div>
    </div>

    <div class="entry-list">
      <div class="entry" @click="router.push({ name: 'MySettings' })">
        <span>设置</span>
        <span>›</span>
      </div>
      <div class="entry" @click="router.push({ name: 'ChangePassword' })">
        <span>修改密码</span>
        <span>›</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.my-page {
  min-height: calc(100vh - 50px);
  background: #070708;
  color: #fff;
  padding: 14px;
}

.header-card {
  background: linear-gradient(180deg, #171929, #0f1018);
  border-radius: 14px;
  padding: 16px 14px;
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  object-fit: cover;
  background: #2a2a2d;
}

.placeholder {
  border: 1px solid #3b3b3d;
}

.info {
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.name {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.id {
  color: #9ea2b8;
  font-size: 12px;
  white-space: nowrap;
}

.meta {
  margin-top: 6px;
  color: #c8cbda;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.intro {
  margin-top: 8px;
  color: #a5a8b8;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edit-btn {
  border: 1px solid #5a4b30;
  color: #dbc08d;
  background: transparent;
  border-radius: 12px;
  padding: 8px 10px;
  font-size: 13px;
  width: 74px;
  line-height: 1.2;
}

.stats-card {
  margin-top: 12px;
  background: #0f1014;
  border-radius: 12px;
  padding: 16px 6px;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.stat-item {
  text-align: center;

  .num {
    font-size: 28px;
    font-weight: 700;
  }

  .label {
    margin-top: 6px;
    color: #b5b7c4;
    font-size: 14px;
  }
}

.entry-list {
  margin-top: 14px;
  background: #101114;
  border-radius: 12px;
  overflow: hidden;
}

.entry {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid #1f2024;
  color: #f1f1f1;
}

.entry:last-child {
  border-bottom: none;
}
</style>
