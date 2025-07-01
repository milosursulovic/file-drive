<template>
  <MainLayout>
    <div class="text-center py-20">
      <h1 class="text-6xl font-extrabold text-red-600 mb-4">404</h1>
      <p class="text-xl text-gray-700 mb-6">Stranica nije pronađena</p>
      <router-link
        to="/"
        class="inline-block bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
      >
        ⬅️ Vrati se na početnu
      </router-link>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from "@/layouts/MainLayout.vue";
</script>
