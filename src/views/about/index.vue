<script setup lang="ts">
import { useRouter } from "vue-router";

defineOptions({ name: "About" });

const router = useRouter();
</script>

<template>
  <div class="about-page">
    <p class="title">关于页面</p>
    <van-button
      type="primary"
      block
      round
      @click="router.push({ name: 'DemoIndex' })"
    >
      🧭 查看导航示例
    </van-button>
  </div>
</template>

<style scoped lang="less">
.about-page {
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.title {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  color: #333;
}
</style>
