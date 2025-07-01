<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-100 to-white">
    <!-- Header -->
    <header class="bg-white shadow sticky top-0 z-50">
      <div
        class="max-w-7xl mx-auto flex justify-between items-center px-4 py-3"
      >
        <h1 class="text-xl font-bold text-blue-600 flex items-center gap-2">
          <img
            src="@/assets/icons/filedrive.png"
            alt="FileDrive Logo"
            class="w-6 h-6"
          />
          FileDrive
        </h1>

        <div v-if="user" class="flex items-center gap-3 text-sm text-gray-700">
          <span>👤 {{ user.username }} ({{ user.role }})</span>
          <button @click="logout" class="text-red-600 hover:underline">
            Odjavi se
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-6">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="text-center text-sm text-gray-500 py-4 border-t">
      <div>
        &copy; {{ new Date().getFullYear() }} Informacioni sistem Opšte bolnice
        Bor
      </div>
      <div class="mt-1 text-xs text-gray-400">Verzija: {{ appVersion }}</div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Icon from "@/assets/icons/filedrive.png";

const router = useRouter();
const user = ref(null);

const appVersion = import.meta.env.VITE_APP_VERSION;

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
