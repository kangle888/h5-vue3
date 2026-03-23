<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { showFailToast } from "vant";
import { codeToText } from "element-china-area-data";
import { queryById, type IPlayerItem } from "@/api/home";
import { useRoute, useRouter } from "vue-router";

defineOptions({
  name: "Detail"
});

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const player = ref<IPlayerItem | null>(null);

const playerId = computed(() => {
  const raw = route.query.playerId ?? route.query.id;
  const v = Array.isArray(raw) ? raw[0] : raw;
  return typeof v === "string" ? v : "";
});

const attachmentUrl = (fileName?: string) => {
  if (!fileName) return "";
  // 后端附件下载接口（与首页保持一致）
  return `http://localhost:8080/play/attachment/download?fileName=${encodeURIComponent(fileName)}`;
};

const albumFiles = computed(() => {
  return (player.value?.album || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
});

const coverFileName = computed(() => {
  return player.value?.avatar || albumFiles.value[0] || "";
});

const coverUrl = computed(() => {
  return coverFileName.value ? attachmentUrl(coverFileName.value) : "";
});

const firstAlbumThree = computed(() => albumFiles.value.slice(0, 3));
const albumMoreCount = computed(() => Math.max(0, albumFiles.value.length - 3));

const formatCityText = (city?: string) => {
  const fallback = "武汉市";
  if (!city) return fallback;
  const parts = city.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const lastCode = parts[parts.length - 1];
  return (codeToText as Record<string, string>)[lastCode] || lastCode;
};

const playerTag = (item: IPlayerItem | null) => {
  return item?.occupation || "优质陪玩";
};

const loadDetail = async () => {
  const id = playerId.value;
  if (!id) {
    showFailToast("缺少详情参数");
    return;
  }

  loading.value = true;
  try {
    const res = await queryById(id);
    player.value = res ?? null;
  } catch (e) {
    showFailToast("加载详情失败");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDetail();
});
</script>

<template>
  <div class="detail-page">
    <div v-if="loading" class="loading-wrap">
      <van-loading color="#d4b076" />
    </div>

    <div v-else class="content-wrap">
      <div v-if="player" class="hero">
        <div class="avatar-wrap">
          <img v-if="coverUrl" class="avatar" :src="coverUrl" alt="avatar" />
          <div v-else class="avatar-empty">暂无图片</div>
          <div class="badge">真人认证</div>
        </div>

        <div class="hero-info">
          <div class="name-row">
            <div class="name">{{ player.name || "匿名" }}</div>
            <van-icon name="like-o" size="18" color="#8a8a8a" />
          </div>

          <div class="meta-row">
            <span class="pill">{{ player.age || "20" }}岁</span>
            <span class="pill">{{ player.height || "165" }}CM</span>
            <span class="pill tag">{{ playerTag(player) }}</span>
          </div>

          <div class="city-row">📍 {{ formatCityText(player.city) }}</div>
        </div>
      </div>

      <div v-else class="empty-wrap">
        <div class="empty">暂无数据</div>
        <van-button type="default" @click="router.replace({ name: 'Home' })">返回首页</van-button>
      </div>

      <template v-if="player">
        <div class="section">
          <div class="section-title">简介</div>
          <div class="section-body">{{ player.introduction || "-" }}</div>
        </div>

        <div class="section">
          <div class="section-title">才艺</div>
          <div class="section-body">{{ player.skill || "-" }}</div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="label">星座</div>
            <div class="value">{{ player.constellation || "-" }}</div>
          </div>
          <div class="info-item">
            <div class="label">生日</div>
            <div class="value">{{ player.birthday || "-" }}</div>
          </div>
          <div class="info-item">
            <div class="label">签名</div>
            <div class="value value-text">{{ player.signature || "-" }}</div>
          </div>
          <div class="info-item">
            <div class="label">体重</div>
            <div class="value">{{ player.weight || "-" }}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">相册</div>
          <div class="album-row">
            <img
              v-for="(img, idx) in firstAlbumThree"
              :key="img + idx"
              class="mini"
              :src="attachmentUrl(img)"
              alt="album"
            />
            <div v-if="albumMoreCount > 0" class="more">+{{ albumMoreCount }}</div>
            <van-icon name="arrow" size="14" color="#9a9a9a" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="less">
.detail-page {
  min-height: calc(100vh - 50px);
  background: #000;
  color: #fff;
  padding: 0 12px 18px;
}

.loading-wrap {
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-wrap {
  padding-bottom: 80px; // 给底部 tabbar 留空间
}

.hero {
  padding: 14px 0;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid #1b1b1b;
}

.avatar-wrap {
  width: 98px;
  position: relative;

  .avatar,
  .avatar-empty {
    width: 98px;
    height: 118px;
    border-radius: 10px;
    object-fit: cover;
    background: #202020;
  }

  .avatar-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9f9f9f;
    font-size: 12px;
  }

  .badge {
    position: absolute;
    left: 0;
    bottom: 0;
    font-size: 10px;
    color: #3f2f14;
    background: #e2c58d;
    padding: 2px 6px;
    border-radius: 0 6px 0 10px;
  }
}

.hero-info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;

  .name {
    font-size: 26px;
    font-weight: 800;
    line-height: 1.1;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.meta-row {
  margin-top: 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;

  .pill {
    font-size: 12px;
    color: #dbdbdb;
    background: #2a2a2a;
    border-radius: 6px;
    line-height: 20px;
    height: 20px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
  }

  .tag {
    color: #d7bc8d;
  }
}

.city-row {
  margin-top: 10px;
  color: #b3b3b3;
  font-size: 13px;
}

.section {
  margin-top: 16px;

  .section-title {
    color: #d4b076;
    font-weight: 800;
    font-size: 16px;
    margin-bottom: 8px;
  }

  .section-body {
    color: #cfcfcf;
    font-size: 13px;
    line-height: 1.7;
    white-space: pre-wrap;
  }
}

.info-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.info-item {
  background: #0f0f10;
  border: 1px solid #1b1b1b;
  border-radius: 12px;
  padding: 12px;

  .label {
    color: #8f8f8f;
    font-size: 12px;
    margin-bottom: 6px;
  }

  .value {
    color: #fff;
    font-size: 13px;
    line-height: 1.5;
    word-break: break-word;
  }

  .value-text {
    display: -webkit-box;
    // 标准写法（用于兼容性校验）
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.album-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mini {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  object-fit: cover;
  background: #1f1f1f;
}

.more {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  font-size: 12px;
  color: #fff;
  background: #2f2f2f;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-wrap {
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.empty {
  color: #b3b3b3;
}
</style>

