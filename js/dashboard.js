// ===== IMPORTS =====
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection, addDoc, getDocs, deleteDoc, doc, updateDoc,
    query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ===== STATE =====
let allNotes = [];
let currentView = "all";
let currentSort = "newest";
let searchQuery = "";
let editingNoteId = null;
let currentUid = null;
let pendingDeleteNoteId = null;
let pendingDeletePermanent = false;


// ===== DOM REFERENCES =====
const notesGrid = document.getElementById("notesGrid");
const newNoteBtn = document.getElementById("newNoteBtn");
const noteModal = document.getElementById("noteModal");
const noteModalBox = document.getElementById("noteModalBox");
const noteModalTitle = document.getElementById("noteModalTitle");
const closeModal = document.getElementById("closeModal");
const saveNoteBtn = document.getElementById("saveNoteBtn");
const noteTitleInput = document.getElementById("noteTitleInput");
const noteBodyInput = document.getElementById("noteBodyInput");
const noteTagSelect = document.getElementById("noteTagSelect");
const logoutBtn = document.getElementById("logoutBtn");
const searchInput = document.getElementById("searchInput");
const searchInputMobile = document.getElementById("searchInputMobile");
const notesHeading = document.getElementById("notesHeading");

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const deleteModal = document.getElementById("deleteModal");
const deleteModalBox = document.getElementById("deleteModalBox");
const deleteModalText = document.getElementById("deleteModalText");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

const sidebarAll = document.getElementById("sidebarAll");
const sidebarImportant = document.getElementById("sidebarImportant");
const sidebarTrash = document.getElementById("sidebarTrash");
const tagPersonal = document.getElementById("tagPersonal");
const tagImportant = document.getElementById("tagImportant");
const tagWork = document.getElementById("tagWork");

const filterAll = document.getElementById("filterAll");
const filterImportant = document.getElementById("filterImportant");
const filterNewest = document.getElementById("filterNewest");
const filterOldest = document.getElementById("filterOldest");

const statImportant = document.getElementById("statImportant");
const statTrash = document.getElementById("statTrash");
const statTotal = document.getElementById("statTotal");


// ===== SIDEBAR TOGGLE (MOBILE) =====
function openSidebar() {
    sidebar.classList.remove("-translate-x-full");
    sidebar.classList.add("translate-x-0");
    sidebarOverlay.classList.remove("hidden");
}

function closeSidebar() {
    sidebar.classList.remove("translate-x-0");
    sidebar.classList.add("-translate-x-full");
    sidebarOverlay.classList.add("hidden");
}

sidebarToggle.addEventListener("click", () => {
    if (sidebar.classList.contains("-translate-x-full")) {
        openSidebar();
    } else {
        closeSidebar();
    }
});

sidebarOverlay.addEventListener("click", closeSidebar);


// ===== MODAL HELPERS =====
function openModal(overlay, box) {
    overlay.classList.remove("opacity-0", "pointer-events-none");
    box.classList.remove("scale-90");
    box.classList.add("scale-100");
}

function closeModalEl(overlay, box) {
    overlay.classList.add("opacity-0", "pointer-events-none");
    box.classList.remove("scale-100");
    box.classList.add("scale-90");
}

function openNoteModal() { openModal(noteModal, noteModalBox); }
function closeNoteModal() { closeModalEl(noteModal, noteModalBox); editingNoteId = null; }
function openDeleteModal() { openModal(deleteModal, deleteModalBox); }
function closeDeleteModal() { closeModalEl(deleteModal, deleteModalBox); pendingDeleteNoteId = null; pendingDeletePermanent = false; }


// ===== ESCAPE HTML =====
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}


// ===== AUTH =====
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUid = user.uid;
        loadNotes();
    } else {
        window.location.href = "index.html";
    }
});


// ===== FIRESTORE =====
function getUserNotesRef() {
    return collection(db, "users", currentUid, "notes");
}

async function loadNotes() {
    const q = query(getUserNotesRef(), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    allNotes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderNotes();
    updateStats();
}


// ===== FILTERING & SORTING =====
function getFilteredNotes() {
    let notes = allNotes;

    if (currentView === "trash") {
        notes = notes.filter(n => n.trashed === true);
    } else if (currentView === "important") {
        notes = notes.filter(n => !n.trashed && n.tag === "Important");
    } else if (currentView.startsWith("tag:")) {
        const tag = currentView.split(":")[1];
        notes = notes.filter(n => !n.trashed && n.tag === tag);
    } else {
        notes = notes.filter(n => !n.trashed);
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        notes = notes.filter(n =>
            n.title.toLowerCase().includes(q) ||
            n.body.toLowerCase().includes(q)
        );
    }

    return notes;
}

function sortNotes(notes) {
    return [...notes].sort((a, b) => {
        const tA = a.createdAt?.toDate?.() || new Date(0);
        const tB = b.createdAt?.toDate?.() || new Date(0);
        return currentSort === "newest" ? tB - tA : tA - tB;
    });
}


// ===== RENDERING =====
function renderNotes() {
    const sorted = sortNotes(getFilteredNotes());
    notesGrid.innerHTML = "";

    if (sorted.length === 0) {
        const msg = currentView === "trash"
            ? "Trash is empty."
            : searchQuery
                ? "No notes match your search."
                : "No notes yet. Click \u201C+ New Note\u201D to create one!";
        notesGrid.innerHTML = '<p class="text-white/60 col-span-2 text-center py-10">' + msg + '</p>';
        return;
    }

    sorted.forEach(note => renderNote(note));
}

function renderNote(note) {
    const tagColors = {
        Personal: { bg: "bg-purple-200", text: "text-purple-700" },
        Important: { bg: "bg-yellow-200", text: "text-yellow-700" },
        Work: { bg: "bg-blue-200", text: "text-blue-700" },
    };

    const tag = tagColors[note.tag] || tagColors["Personal"];
    const isTrashed = note.trashed === true;

    let timeText = "";
    if (note.createdAt?.toDate) {
        timeText = note.createdAt.toDate().toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        });
    }

    const card = document.createElement("div");
    const cardColors = {
        Personal: "bg-gradient-to-br from-purple-400 to-purple-700",
        Important: "bg-gradient-to-br from-yellow-300 to-yellow-600",
        Work: "bg-gradient-to-br from-blue-400 to-blue-700",
    };

    const bgColor = cardColors[note.tag] || cardColors["Personal"];
    card.className = `${bgColor} rounded-xl shadow-md p-5 hover:shadow-lg transition cursor-pointer`;

    let actionButtons;
    if (isTrashed) {
        actionButtons = '<div class="flex gap-2">'
            + '<button class="restore-btn text-gray-400 hover:text-green-600 cursor-pointer text-sm font-medium px-2 py-1 rounded hover:bg-green-50 transition" title="Restore">\u21A9 Restore</button>'
            + '<button class="permadelete-btn text-gray-400 hover:text-red-500 cursor-pointer text-lg" title="Delete Forever">\uD83D\uDDD1</button>'
            + '</div>';
    } else {
        actionButtons = '<button class="delete-btn text-gray-400 hover:text-red-500 cursor-pointer text-lg" title="Move to Trash">\uD83D\uDDD1</button>';
    }

    card.innerHTML = '<div class="flex justify-between items-center mb-2">'
        + '<span class="' + tag.bg + ' ' + tag.text + ' text-xs px-2 py-1 rounded">' + escapeHtml(note.tag || "Personal") + '</span>'
        + actionButtons
        + '</div>'
        + '<h3 class="font-semibold text-lg">' + escapeHtml(note.title) + '</h3>'
        + '<p class="text-black text-[0.85rem] mt-1">' + escapeHtml(note.body).substring(0, 100) + (note.body.length > 100 ? "..." : "") + '</p>'
        + '<div class="flex justify-between items-center mt-4 text-sm">'
        + '<span class="text-black/90 px-1 border border-black *:">' + timeText + '</span>'
        + '</div>';

    if (isTrashed) {
        card.querySelector(".restore-btn").addEventListener("click", async (e) => {
            e.stopPropagation();
            await updateDoc(doc(db, "users", currentUid, "notes", note.id), { trashed: false });
            await loadNotes();
        });
        card.querySelector(".permadelete-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            pendingDeleteNoteId = note.id;
            pendingDeletePermanent = true;
            deleteModalText.textContent = "This will permanently delete this note. This cannot be undone.";
            openDeleteModal();
        });
    } else {
        card.querySelector(".delete-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            pendingDeleteNoteId = note.id;
            pendingDeletePermanent = false;
            deleteModalText.textContent = "Move this note to trash?";
            openDeleteModal();
        });
        card.addEventListener("click", () => {
            editingNoteId = note.id;
            noteModalTitle.textContent = "Edit Note";
            saveNoteBtn.textContent = "Update Note";
            noteTitleInput.value = note.title;
            noteBodyInput.value = note.body;
            noteTagSelect.value = note.tag || "Personal";
            openNoteModal();
        });
    }

    notesGrid.appendChild(card);
}


// ===== STATS =====
function updateStats() {
    const active = allNotes.filter(n => !n.trashed);
    statImportant.textContent = active.filter(n => n.tag === "Important").length;
    statTrash.textContent = allNotes.filter(n => n.trashed === true).length;
    statTotal.textContent = active.length;
}


// ===== ACTIVE STATE UI =====
function updateActiveStates() {
    const sidebarItems = [sidebarAll, sidebarImportant, sidebarTrash];
    sidebarItems.forEach(el => {
        el.classList.remove("bg-white", "text-black");
        el.classList.add("bg-white/25");
    });

    const tagItems = [tagPersonal, tagImportant, tagWork];
    tagItems.forEach(el => {
        if (!el) return;
        el.classList.remove("text-black", "bg-violet-300", "bg-yellow-200", "bg-blue-200");
        el.classList.add("bg-white/25");
    });

    if (currentView === "all") {
        sidebarAll.classList.remove("bg-white/25");
        sidebarAll.classList.add("bg-white", "text-black");
    } else if (currentView === "important") {
        sidebarImportant.classList.remove("bg-white/25");
        sidebarImportant.classList.add("bg-white", "text-black");
    } else if (currentView === "trash") {
        sidebarTrash.classList.remove("bg-white/25");
        sidebarTrash.classList.add("bg-white", "text-black");
    } else if (currentView === "tag:Personal") {
        tagPersonal.classList.remove("bg-white/25");
        tagPersonal.classList.add("bg-violet-300", "text-black");
    } else if (currentView === "tag:Important") {
        tagImportant.classList.remove("bg-white/25");
        tagImportant.classList.add("bg-yellow-200", "text-black");
    } else if (currentView === "tag:Work" && tagWork) {
        tagWork.classList.remove("bg-white/25");
        tagWork.classList.add("bg-blue-200", "text-black");
    }

    // Filter bar
    const activeBtn = "bg-blue-600 duration-300 text-white px-4 py-1 rounded-lg cursor-pointer";
    const inactiveBtn = "bg-white/20 duration-300 text-white px-4 py-1 rounded-lg hover:bg-white/90 hover:text-black cursor-pointer";

    filterAll.className = (currentView === "all" || currentView.startsWith("tag:") || currentView === "trash") ? activeBtn : inactiveBtn;
    filterImportant.className = (currentView === "important") ? activeBtn : inactiveBtn;
    filterNewest.className = (currentSort === "newest") ? activeBtn : inactiveBtn;
    filterOldest.className = (currentSort === "oldest") ? activeBtn : inactiveBtn;

    // Heading
    const headings = {
        "all": "Your Notes", "important": "Important Notes", "trash": "Trash",
        "tag:Personal": "Personal Notes", "tag:Important": "Important Notes", "tag:Work": "Work Notes"
    };
    notesHeading.textContent = headings[currentView] || "Your Notes";
}

function setView(view) {
    currentView = view;
    updateActiveStates();
    renderNotes();
}

function setSort(sort) {
    currentSort = sort;
    updateActiveStates();
    renderNotes();
}


// ===== EVENT LISTENERS =====

// Sidebar
sidebarAll.addEventListener("click", () => { setView("all"); closeSidebar(); });
sidebarImportant.addEventListener("click", () => { setView("important"); closeSidebar(); });
sidebarTrash.addEventListener("click", () => { setView("trash"); closeSidebar(); });
tagPersonal.addEventListener("click", () => { setView("tag:Personal"); closeSidebar(); });
tagImportant.addEventListener("click", () => { setView("tag:Important"); closeSidebar(); });
if (tagWork) tagWork.addEventListener("click", () => { setView("tag:Work"); closeSidebar(); });

// Filter bar
filterAll.addEventListener("click", () => setView("all"));
filterImportant.addEventListener("click", () => setView("important"));
filterNewest.addEventListener("click", () => setSort("newest"));
filterOldest.addEventListener("click", () => setSort("oldest"));

// Search (desktop + mobile)
function handleSearch(e) {
    searchQuery = e.target.value.trim();
    // Sync both inputs
    if (searchInput && e.target !== searchInput) searchInput.value = e.target.value;
    if (searchInputMobile && e.target !== searchInputMobile) searchInputMobile.value = e.target.value;
    renderNotes();
}

if (searchInput) searchInput.addEventListener("input", handleSearch);
if (searchInputMobile) searchInputMobile.addEventListener("input", handleSearch);

// New note
newNoteBtn.addEventListener("click", () => {
    editingNoteId = null;
    noteModalTitle.textContent = "New Note";
    saveNoteBtn.textContent = "Save Note";
    noteTitleInput.value = "";
    noteBodyInput.value = "";
    noteTagSelect.value = "Personal";
    openNoteModal();
});

closeModal.addEventListener("click", closeNoteModal);

// Save note (create or update)
saveNoteBtn.addEventListener("click", async () => {
    const title = noteTitleInput.value.trim();
    const body = noteBodyInput.value.trim();
    const tag = noteTagSelect.value;

    if (!title) {
        alert("Please enter a title");
        return;
    }
    if (!currentUid) return;

    if (editingNoteId) {
        await updateDoc(doc(db, "users", currentUid, "notes", editingNoteId), {
            title, body, tag
        });
    } else {
        await addDoc(getUserNotesRef(), {
            title, body, tag,
            createdAt: serverTimestamp()
        });
    }

    closeNoteModal();
    await loadNotes();
});

// Delete confirmation
confirmDeleteBtn.addEventListener("click", async () => {
    if (!pendingDeleteNoteId || !currentUid) return;

    if (pendingDeletePermanent) {
        await deleteDoc(doc(db, "users", currentUid, "notes", pendingDeleteNoteId));
    } else {
        await updateDoc(doc(db, "users", currentUid, "notes", pendingDeleteNoteId), { trashed: true });
    }

    closeDeleteModal();
    await loadNotes();
});

cancelDeleteBtn.addEventListener("click", closeDeleteModal);

// Logout
logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
});
