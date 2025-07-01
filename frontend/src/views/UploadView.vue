<template>
  <div class="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
    <h2 class="text-xl font-bold mb-4">⬆️ Upload fajla</h2>
    <form @submit.prevent="uploadFile" class="space-y-4">
      <input type="file" @change="handleFileChange" class="block" />
      <button
        type="submit"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Pošalji
      </button>
      <p v-if="success" class="text-green-600 text-sm">{{ success }}</p>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";

const selectedFile = ref(null);
const error = ref("");
const success = ref("");

const handleFileChange = (e) => {
  selectedFile.value = e.target.files[0];
};

const uploadFile = async () => {
  error.value = "";
  success.value = "";

  if (!selectedFile.value) {
    error.value = "Niste izabrali fajl.";
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedFile.value);

  try {
    const res = await fetch(
      `${import.meta.url.VITE_API_URL}/api/files/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!res.ok) throw new Error("Greška prilikom slanja fajla");
    const data = await res.json();
    success.value = `Fajl uspešno poslat: ${data.originalname}`;
  } catch (err) {
    error.value = "Greška prilikom slanja fajla";
  }
};
</script>
