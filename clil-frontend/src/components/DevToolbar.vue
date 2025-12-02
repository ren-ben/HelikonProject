<!-- DevToolbar.vue -->
<template>
  <StagewiseToolbar v-if="isDev" :config="stagewiseConfig" />
</template>

<script setup>
import { StagewiseToolbar } from '@stagewise/toolbar-vue';

const isDev = process.env.NODE_ENV === 'development';

const stagewiseConfig = {
  plugins: []
};
</script> 