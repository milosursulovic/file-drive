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

        <input
          v-if="searchedFiles.length"
          v-model="searchTerm"
          @input="fetchFiles(searchTerm)"
          type="text"
          placeholder="🔍 Pretraži po imenu fajla..."
          class="border border-gray-300 rounded px-4 py-2 w-full sm:w-96 text-sm"
        />
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
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";

const apiUrl = import.meta.env.VITE_API_URL;
const token = localStorage.getItem("token");

const searchIp = ref("");
const searchedFiles = ref([]);
const searchPerformed = ref(false);

const searchTerm = ref("");
const debounceTimer = ref(null);
const route = useRoute();
const router = useRouter();

async function searchByIp(search = "") {
  searchPerformed.value = false;
  searchedFiles.value = [];

  try {
    const res = await fetch(
      `${apiUrl}/api/files/by-ip/${searchIp.value}?search=${encodeURIComponent(
        search,
      )}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

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

watch(searchTerm, (newTerm) => {
  clearTimeout(debounceTimer.value);
  debounceTimer.value = setTimeout(() => {
    router.replace({ query: { ...route.query, search: newTerm || undefined } });
    searchByIp(newTerm);
  }, 300);
});

onMounted(() => {
  document.title = `Pretraga IP - FileDrive`;

  const initialSearch = route.query.search || "";
  searchTerm.value = initialSearch;
  searchByIp(initialSearch);
});
</script>
