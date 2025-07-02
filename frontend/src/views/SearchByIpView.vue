<template>
  <MainLayout>
    <div class="max-w-4xl mx-auto py-10">
      <h2 class="text-2xl font-semibold mb-4">🔍 Pretraga po IP adresi</h2>

      <div class="flex flex-col sm:flex-row gap-4 mb-6">
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
          <div>
            <p class="text-gray-800 font-medium truncate">
              {{ file.original }}
            </p>
            <p class="text-xs text-gray-500">
              📁 Kategorija: {{ file.category || "Ostalo" }}
            </p>
          </div>
          <div class="flex gap-3">
            <button @click="downloadFile(file.name)" class="text-blue-600">
              Preuzmi ⬇️
            </button>
          </div>
        </li>
      </ul>

      <p v-else-if="searchPerformed" class="text-sm text-gray-500">
        Nema fajlova za ovu IP adresu.
      </p>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref } from "vue";
import MainLayout from "@/layouts/MainLayout.vue";

const apiUrl = import.meta.env.VITE_API_URL;
const token = localStorage.getItem("token");

const searchIp = ref("");
const searchedFiles = ref([]);
const searchPerformed = ref(false);

async function searchByIp() {
  searchPerformed.value = false;
  searchedFiles.value = [];

  try {
    const res = await fetch(`${apiUrl}/api/files/by-ip/${searchIp.value}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Greška pri pretrazi");
    const data = await res.json();
    searchedFiles.value = data;
    searchPerformed.value = true;
  } catch (err) {
    console.error(err);
    searchPerformed.value = true;
  }
}

async function downloadFile(filename) {
  const res = await fetch(`${apiUrl}/api/files/download/${filename}`, {
    headers: { Authorization: `Bearer ${token}` },
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
</script>
