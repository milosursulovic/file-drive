<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-100 to-white">
    <header class="bg-white shadow sticky top-0 z-50">
      <div
        class="max-w-7xl mx-auto flex justify-between items-center px-4 py-3"
      >
        <router-link
          to="/"
          class="flex items-center gap-2 text-xl font-bold text-blue-600"
        >
          <img :src="Icon" alt="FileDrive Logo" class="w-6 h-6" />
          FileDrive
        </router-link>

        <div class="flex items-center gap-4 text-sm text-gray-700">
          <router-link
            v-if="user?.role === 'admin'"
            to="/search-by-ip"
            class="text-blue-600 hover:underline"
          >
            🔍 Pretraga IP
          </router-link>

          <span v-if="user">👤 {{ user.username }} ({{ user.role }})</span>

          <button
            v-if="user"
            @click="logout"
            class="text-red-600 hover:underline"
          >
            Odjavi se
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <slot />
    </main>

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
