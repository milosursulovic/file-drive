<template>
  <div class="max-w-sm mx-auto mt-20">
    <h2 class="text-2xl font-bold mb-4">Prijavi se</h2>
    <input v-model="username" placeholder="Korisničko ime" class="input mb-3" />
    <input
      v-model="password"
      type="password"
      placeholder="Lozinka"
      class="input mb-3"
    />
    <button
      @click="handleLogin"
      class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      🔐 Prijavi se
    </button>
    <p v-if="error" class="text-red-600 mt-2 text-sm">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const username = ref("");
const password = ref("");
const error = ref("");
const router = useRouter();

const apiUrl = import.meta.env.VITE_API_URL;

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
