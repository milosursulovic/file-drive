<template>
  <MainLayout>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-semibold">📄 Dobrodošao na FileDrive</h2>
      <button
        @click="showUpload = !showUpload"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        ⬆️ Upload fajla
      </button>
    </div>

    <div v-if="showUpload" class="mb-6">
      <!-- Upload form -->
      <form
        @submit.prevent="uploadFile"
        class="bg-white p-4 rounded shadow space-y-4"
      >
        <input type="file" @change="handleFileChange" />
        <button
          type="submit"
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Pošalji
        </button>
        <p v-if="success" class="text-green-600">{{ success }}</p>
        <p v-if="error" class="text-red-600">{{ error }}</p>
      </form>
    </div>

    <!-- Fajlovi / sadržaj -->
    <div class="mt-10">
      <h3 class="text-lg font-semibold mb-4">📁 Lista fajlova</h3>
      <ul v-if="files.length" class="space-y-2">
        <li
          v-for="file in files"
          :key="file.name"
          class="flex items-center justify-between bg-white p-3 rounded shadow"
        >
          <span>{{ file.name }}</span>
          <button @click="downloadFile(file.name)">⬇️ Preuzmi</button>
        </li>
      </ul>
      <p v-else class="text-sm text-gray-500">Nema fajlova za prikaz.</p>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import MainLayout from "@/layouts/MainLayout.vue";

const showUpload = ref(false);
const selectedFile = ref(null);
const error = ref("");
const success = ref("");
const files = ref([]);

const apiUrl = import.meta.env.VITE_API_URL;
const token = localStorage.getItem("token");

function handleFileChange(e) {
  selectedFile.value = e.target.files[0];
}

async function fetchFiles() {
  try {
    const res = await fetch(`${apiUrl}/api/files`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Neuspešno učitavanje fajlova");
    files.value = await res.json();
  } catch (err) {
    console.error(err);
  }
}

async function uploadFile() {
  error.value = "";
  success.value = "";

  if (!selectedFile.value) {
    error.value = "Izaberite fajl";
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedFile.value);

  try {
    const res = await fetch(`${apiUrl}/api/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) throw new Error("Upload nije uspeo");

    const data = await res.json();
    success.value = `Uspešno: ${data.originalname}`;
    selectedFile.value = null;
    fetchFiles();
  } catch (err) {
    error.value = "Greška pri uploadu";
  }
}

async function downloadFile(filename) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${apiUrl}/api/files/download/${filename}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return alert("Greška pri preuzimanju");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

onMounted(() => {
  document.title = `Početna - FileDrive`;
  fetchFiles();
});
</script>
