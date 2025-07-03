<template>
  <MainLayout>
    <div class="max-w-4xl mx-auto py-10">
      <h2 class="text-2xl font-semibold mb-4">🔍 Pretraga po IP adresi</h2>

      <div
        class="flex flex-col sm:flex-row flex-wrap gap-4 mb-6 sm:items-center"
      >
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
          type="text"
          placeholder="🔍 Pretraži po imenu fajla..."
          class="border border-gray-300 rounded px-4 py-2 w-full sm:w-96 text-sm"
        />

        <select
          v-if="searchedFiles.length"
          v-model="sortOrder"
          class="border border-gray-300 rounded px-4 py-2 text-sm text-gray-700 w-full sm:w-auto"
        >
          <option value="desc">📅 Najnoviji prvo</option>
          <option value="asc">📅 Najstariji prvo</option>
        </select>

        <button
          v-if="searchedFiles.length"
          @click="exportCSV"
          class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
        >
          📤 Izvezi CSV
        </button>

        <button
          v-if="searchedFiles.length"
          @click="exportXLSXByIp"
          class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          📤 Izvezi XLSX
        </button>
      </div>

      <div v-if="searchedFiles.length">
        <ul class="space-y-2">
          <li
            v-for="file in searchedFiles"
            :key="file.name"
            class="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition"
          >
            <div>
              <p class="text-gray-900 font-semibold text-base truncate">
                📄 {{ file.original }}
              </p>
              <p class="text-sm text-gray-500 mt-1">
                📂 Kategorija:
                <span class="font-medium text-gray-700">{{
                  file.category || "Ostalo"
                }}</span>
              </p>
            </div>

            <div class="flex flex-col sm:items-end gap-2 mt-4 sm:mt-0">
              <div class="flex gap-4 justify-end">
                <button
                  @click="downloadFile(file.name)"
                  class="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ⬇️ <span>Preuzmi</span>
                </button>
              </div>
              <div class="text-xs text-gray-500 flex items-center gap-1">
                ⏱️ Dodato: {{ formatDate(file.timestamp) }}
              </div>
              <div class="text-xs text-gray-500 flex items-center gap-1">
                📦 Veličina: {{ formatFileSize(file.size) }}
              </div>
            </div>
          </li>
        </ul>
        <div class="mt-6 flex justify-center gap-2">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="px-3 py-1 border rounded disabled:opacity-50"
          >
            ◀️
          </button>
          <span class="px-3 py-1 text-sm">
            Strana {{ currentPage }} od {{ totalPages }}
          </span>
          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 border rounded disabled:opacity-50"
          >
            ▶️
          </button>
        </div>
      </div>
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
import { formatDate } from "@/utils/date.js";
import { formatFileSize } from "@/utils/file.js";

const apiUrl = import.meta.env.VITE_API_URL;
const token = localStorage.getItem("token");
const searchIp = ref("");
const searchedFiles = ref([]);
const searchPerformed = ref(false);
const searchTerm = ref("");
const debounceTimer = ref(null);
const route = useRoute();
const router = useRouter();
const sortOrder = ref("desc");
const currentPage = ref(parseInt(route.query.page) || 1);
const totalPages = ref(1);

async function searchByIp() {
  searchPerformed.value = false;
  searchedFiles.value = [];

  const query = new URLSearchParams({
    ip: searchIp.value,
    search: searchTerm.value || "",
    sort: sortOrder.value,
    page: currentPage.value,
    limit: 10,
  });

  router.replace({ query: Object.fromEntries(query.entries()) });

  try {
    const res = await fetch(`${apiUrl}/api/files/by-ip?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Greška pri pretrazi");

    const data = await res.json();
    searchedFiles.value = data.files;
    totalPages.value = data.totalPages;
    currentPage.value = data.page;
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

async function exportCSV() {
  const query = new URLSearchParams({
    ip: searchIp.value,
    search: searchTerm.value || "",
    sort: sortOrder.value,
  });

  try {
    const res = await fetch(
      `${apiUrl}/api/files/by-ip/export/csv?${query.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) throw new Error("Greška pri izvozu CSV-a");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fajlovi-${searchIp.value || "ip"}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert("Neuspešan izvoz CSV-a");
    console.error(err);
  }
}

async function exportXLSXByIp() {
  const query = new URLSearchParams({
    ip: searchIp.value,
    search: searchTerm.value || "",
    sort: sortOrder.value,
  });

  const res = await fetch(
    `${apiUrl}/api/files/by-ip/export/xlsx?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    alert("Greška pri eksportovanju XLSX fajla");
    return;
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `fajlovi-${searchIp.value}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

function changePage(newPage) {
  currentPage.value = newPage;
  searchByIp();
}

watch([searchTerm, sortOrder], () => {
  clearTimeout(debounceTimer.value);
  debounceTimer.value = setTimeout(() => {
    if (searchIp.value.length > 0) {
      currentPage.value = 1;
      searchByIp();
    }
  }, 300);
});

onMounted(() => {
  document.title = `Pretraga IP - FileDrive`;

  searchIp.value = route.query.ip || "";
  searchTerm.value = route.query.search || "";
  sortOrder.value = route.query.sort || "desc";
  currentPage.value = parseInt(route.query.page) || 1;

  if (searchIp.value) {
    searchByIp();
  }

  if (searchIp.value) {
    searchByIp();
  }
});
</script>
