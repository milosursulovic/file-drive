<template>
  <MainLayout>
    <h2 class="text-2xl font-semibold mb-4">📄 Dobrodošao na FileDrive</h2>
    <p class="text-gray-600">Ovde ide sadržaj: fajlovi, upload, info itd.</p>
  </MainLayout>
</template>

<script setup>
import { onMounted } from "vue";
import MainLayout from "@/layouts/MainLayout.vue";

onMounted(() => {
  document.title = `Početna - FileDrive`;
});
</script>
