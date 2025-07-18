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
      <form
        @submit.prevent="uploadFile"
        class="bg-white p-4 rounded shadow flex flex-col sm:flex-row sm:items-center gap-4"
      >
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

        <div
          v-if="selectedFile"
          class="text-sm text-gray-700 max-w-sm truncate w-full sm:w-auto"
        >
          {{ selectedFile.name }}
        </div>

        <button
          type="submit"
          class="bg-green-600 text-white text-sm px-5 py-2 rounded hover:bg-green-700 transition w-full sm:w-auto"
        >
          ✅ Pošalji
        </button>

        <p v-if="success" class="text-green-600 text-sm w-full">
          {{ success }}
        </p>
        <p v-if="error" class="text-red-600 text-sm w-full">{{ error }}</p>
        <select
          v-model="selectedCategory"
          class="border border-gray-300 rounded px-4 py-2 text-sm text-gray-700 w-full sm:w-auto"
        >
          <option disabled value="">-- Izaberi kategoriju --</option>
          <option>Dokument</option>
          <option>Slika</option>
          <option>Backup</option>
          <option>Log</option>
          <option>Ostalo</option>
        </select>
      </form>
    </div>

    <div class="mt-10">
      <h3 class="text-lg font-semibold mb-4">📁 Lista fajlova</h3>
      <div class="mb-4 flex flex-col sm:flex-row gap-4 sm:items-center">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="🔍 Pretraži po imenu fajla..."
          class="border border-gray-300 rounded px-4 py-2 w-full sm:w-96 text-sm"
        />

        <select
          v-model="sortOrder"
          class="border border-gray-300 rounded px-4 py-2 text-sm text-gray-700 w-full sm:w-auto"
        >
          <option value="desc">📅 Najnoviji prvo</option>
          <option value="asc">📅 Najstariji prvo</option>
        </select>

        <button
          @click="exportCSV"
          class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
        >
          📤 Izvezi CSV
        </button>

        <button
          @click="exportXLSX"
          class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          📤 Izvezi XLSX
        </button>
      </div>

      <div v-if="files.length">
        <ul class="space-y-2">
          <li
            v-for="file in files"
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

                <button
                  @click="deleteFile(file.name)"
                  class="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  🗑️ <span>Obriši</span>
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
      <p v-else class="text-sm text-gray-500">Nema fajlova za prikaz.</p>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";
import { formatDate } from "@/utils/date.js";
import { formatFileSize } from "@/utils/file.js";

const showUpload = ref(false);
const selectedFile = ref(null);
const error = ref("");
const success = ref("");
const files = ref([]);
const user = ref(null);
const selectedCategory = ref("");
const searchTerm = ref("");
const debounceTimer = ref(null);
const route = useRoute();
const router = useRouter();
const sortOrder = ref("desc");
const apiUrl = import.meta.env.VITE_API_URL;
const token = localStorage.getItem("token");
const currentPage = ref(parseInt(route.query.page) || 1);
const totalPages = ref(1);

function handleFileChange(e) {
  selectedFile.value = e.target.files[0];
}

async function fetchFiles(search = "", sort = "desc", page = 1) {
  const url = `${apiUrl}/api/files?search=${encodeURIComponent(
    search
  )}&sort=${sort}&page=${page}&limit=10`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Neuspešno učitavanje fajlova");

  const data = await res.json();
  files.value = data.files;
  totalPages.value = data.totalPages;
  currentPage.value = data.page;
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
  formData.append("category", selectedCategory.value || "Ostalo");

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

async function deleteFile(filename) {
  const confirmDelete = confirm(
    `Da li si siguran da želiš da obrišeš fajl "${filename}"?`
  );
  if (!confirmDelete) return;

  try {
    const res = await fetch(`${apiUrl}/api/files/${filename}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Brisanje nije uspelo");

    success.value = "Fajl je uspešno obrisan";
    fetchFiles();
  } catch (err) {
    error.value = "Greška pri brisanju fajla";
  }
}

async function exportCSV() {
  try {
    const res = await fetch(
      `${apiUrl}/api/files/export/csv?search=${encodeURIComponent(
        searchTerm.value
      )}&sort=${sortOrder.value}`,
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
    link.download = "fajlovi.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert("Neuspešan izvoz CSV-a");
    console.error(err);
  }
}

async function exportXLSX() {
  const query = new URLSearchParams({
    search: searchTerm.value || "",
    sort: sortOrder.value || "desc",
  });

  const res = await fetch(
    `${apiUrl}/api/files/export/xlsx?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    alert("Greška pri eksportovanju");
    return;
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "fajlovi.xlsx";
  link.click();
  window.URL.revokeObjectURL(url);
}

function changePage(newPage) {
  router.replace({
    query: {
      search: searchTerm.value || undefined,
      sort: sortOrder.value || undefined,
      page: newPage,
    },
  });
  fetchFiles(searchTerm.value, sortOrder.value, newPage);
}

watch([searchTerm, sortOrder], ([newSearch, newSort]) => {
  clearTimeout(debounceTimer.value);
  debounceTimer.value = setTimeout(() => {
    router.replace({
      query: {
        search: newSearch || undefined,
        sort: newSort || undefined,
        page: 1,
      },
    });
    fetchFiles(newSearch, newSort, 1);
  }, 300);
});

onMounted(() => {
  document.title = `Početna - FileDrive`;
  user.value = JSON.parse(localStorage.getItem("user") || "null");

  searchTerm.value = route.query.search || "";
  sortOrder.value = route.query.sort || "desc";
  currentPage.value = parseInt(route.query.page) || 1;

  fetchFiles(searchTerm.value, sortOrder.value, currentPage.value);
});
</script>
