<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4"
  >
    <!-- Kartica -->
    <div
      class="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-sm"
    >
      <h2
        class="text-2xl font-bold text-center text-gray-800 mb-6 flex flex-col items-center gap-3"
      >
        <img :src="Icon" alt="FileDrive Icon" class="w-10 h-10" />
        Prijavi se na FileDrive
      </h2>

      <input
        v-model="username"
        placeholder="Korisničko ime"
        class="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Lozinka"
        class="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        @click="handleLogin"
        class="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Prijavi se
      </button>

      <p v-if="error" class="text-red-600 mt-4 text-sm text-center">
        {{ error }}
      </p>
    </div>

    <!-- Footer -->
    <footer class="text-center text-sm text-gray-500 mt-10">
      <div>
        &copy; {{ new Date().getFullYear() }} Informacioni sistem Opšte bolnice
        Bor
      </div>
      <div class="mt-1 text-xs text-gray-400">Verzija: {{ appVersion }}</div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import Icon from "@/assets/icons/filedrive.png";

const username = ref("");
const password = ref("");
const error = ref("");
const router = useRouter();

const apiUrl = import.meta.env.VITE_API_URL;
const appVersion = import.meta.env.VITE_APP_VERSION;

const handleLogin = async () => {
  try {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    if (!res.ok) throw new Error("Greška prilikom prijave");

    const data = await res.json();
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    router.push("/dashboard");
  } catch (err) {
    error.value = "Pogrešno korisničko ime ili lozinka";
  }
};

onMounted(() => {
  document.title = `Prijavi se - FileDrive`;
});
</script>
