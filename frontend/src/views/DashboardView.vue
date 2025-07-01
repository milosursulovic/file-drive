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
        class="bg-white p-4 rounded shadow flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <!-- Custom File Input -->
        <label
          class="relative cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded border border-gray-300 w-full sm:w-auto text-center"
        >
          📁 Izaberi fajl
          <input
            type="file"
            @change="handleFileChange"
            class="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>

        <!-- Prikaz imena fajla -->
        <div
          v-if="selectedFile"
          class="text-sm text-gray-700 max-w-sm truncate w-full sm:w-auto"
        >
          {{ selectedFile.name }}
        </div>

        <!-- Submit dugme -->
        <button
          type="submit"
          class="bg-green-600 text-white text-sm px-5 py-2 rounded hover:bg-green-700 transition w-full sm:w-auto"
        >
          ✅ Pošalji
        </button>

        <!-- Poruke -->
        <p v-if="success" class="text-green-600 text-sm w-full">
          {{ success }}
        </p>
        <p v-if="error" class="text-red-600 text-sm w-full">{{ error }}</p>
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

    <div v-if="user?.role === 'admin'" class="mt-12">
      <h3 class="text-lg font-semibold mb-2">🔍 Pretraga po IP adresi</h3>
      <div class="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          v-model="searchIp"
          placeholder="Unesi IP adresu"
          class="border border-gray-300 rounded px-4 py-2 w-full sm:w-64"
        />
        <button
          @click="searchByIp"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Pretraži
        </button>
      </div>

      <ul v-if="searchedFiles.length" class="space-y-2">
        <li
          v-for="file in searchedFiles"
          :key="file.name"
          class="bg-white p-3 rounded shadow flex justify-between items-center"
        >
          <span>{{ file.original }}</span>
          <a
            :href="`${apiUrl}/api/files/download/${file.name}`"
            class="text-blue-600 text-sm hover:underline"
            target="_blank"
          >
            ⬇️ Preuzmi
          </a>
        </li>
      </ul>

      <p v-else-if="searchPerformed" class="text-sm text-gray-500">
        Nema fajlova za ovu IP adresu.
      </p>
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
const searchIp = ref("");
const searchedFiles = ref([]);
const searchPerformed = ref(false);
const user = ref(null);

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

async function searchByIp() {
  searchPerformed.value = false;
  searchedFiles.value = [];
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${apiUrl}/api/files/by-ip/${searchIp.value}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Greška prilikom pretrage");
    const data = await res.json();
    searchedFiles.value = data;
    searchPerformed.value = true;
  } catch (err) {
    console.error(err);
    searchPerformed.value = true;
  }
}

onMounted(() => {
  document.title = `Početna - FileDrive`;
  user.value = JSON.parse(localStorage.getItem("user") || "null");
  fetchFiles();
});
</script>
