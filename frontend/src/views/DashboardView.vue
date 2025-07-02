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
          class="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition"
        >
          <!-- Ime fajla -->
          <span class="text-gray-800 font-medium truncate max-w-[40%]">
            📄 {{ file.original }}
          </span>

          <!-- Akcije -->
          <div class="flex items-center gap-4">
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

async function deleteFile(filename) {
  const confirmDelete = confirm(
    `Da li si siguran da želiš da obrišeš fajl "${filename}"?`,
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

onMounted(() => {
  document.title = `Početna - FileDrive`;
  user.value = JSON.parse(localStorage.getItem("user") || "null");
  fetchFiles();
});
</script>
