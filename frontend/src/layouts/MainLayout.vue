<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-100 to-white">
    <!-- Header -->
    <header class="bg-white shadow sticky top-0 z-50">
      <div
        class="max-w-7xl mx-auto flex justify-between items-center px-4 py-3"
      >
        <h1 class="text-xl font-bold text-blue-600">📁 FileDrive</h1>

        <div v-if="user" class="flex items-center gap-3 text-sm text-gray-700">
          <span>👤 {{ user.username }} ({{ user.role }})</span>
          <button @click="logout" class="text-red-600 hover:underline">
            Logout
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-6">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="text-sm text-slate-500 text-center py-4">
      Verzija: 1.0.0 • © {{ new Date().getFullYear() }} FileDrive
    </footer>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const user = ref(null);

onMounted(() => {
  const u = localStorage.getItem("user");
  if (u) {
    user.value = JSON.parse(u);
  }
});

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  router.push("/login");
}
</script>
