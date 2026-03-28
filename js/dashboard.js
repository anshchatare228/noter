// ===== IMPORTS =====
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection,    // points to a "folder" of documents (like /users/uid/notes/)
    addDoc,        // creates a new document with auto-generated ID
    getDocs,       // fetches all documents from a collection
    deleteDoc,     // deletes a document
    doc,           // points to a specific document by ID
    query,         // builds a query (like SQL SELECT)
    orderBy,       // sorts results
    serverTimestamp // uses Firebase server time (not user's clock)
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ===== WAIT FOR AUTH STATE =====
// This is the KEY concept: onAuthStateChanged fires whenever login state changes.
// If user is logged in → we get their data. If not → redirect to login.
onAuthStateChanged(auth, (user) => {
    if (user) {
        // user.uid is the unique ID — THIS is what ties notes to a specific user
        console.log("Logged in as:", user.email, "| UID:", user.uid);
        loadNotes(user.uid);
    } else {
        // Not logged in? Send them back to login page
        window.location.href = "index.html";
    }
});


// ===== REFERENCES =====
// DOM elements we'll interact with
const notesGrid = document.getElementById("notesGrid");
const newNoteBtn = document.getElementById("newNoteBtn");
const noteModal = document.getElementById("noteModal");
const closeModal = document.getElementById("closeModal");
const saveNoteBtn = document.getElementById("saveNoteBtn");
const noteTitleInput = document.getElementById("noteTitleInput");
const noteBodyInput = document.getElementById("noteBodyInput");
const noteTagSelect = document.getElementById("noteTagSelect");
const logoutBtn = document.getElementById("logoutBtn");


// ===== GET THE USER'S NOTES COLLECTION =====
// This function returns a reference to: Firestore → users → {uid} → notes
// Each user has their OWN "notes" sub-collection. User A can never see User B's notes.
function getUserNotesRef(uid) {
    return collection(db, "users", uid, "notes");
    //                      ↑        ↑       ↑
    //                  top-level  user's   their notes
    //                  collection  folder   sub-collection
    // Basically its a path flow which tells firebase WHERE to look and WHAT to return
}


// ===== LOAD NOTES =====
// Fetches all notes for the given uid and renders them on the page
async function loadNotes(uid) {
    const notesRef = getUserNotesRef(uid);

    // query() + orderBy() = "get all notes, sorted by newest first"
    const q = query(notesRef, orderBy("createdAt", "desc"));

    const snapshot = await getDocs(q);
    // snapshot.docs is an array of all the note documents

    notesGrid.innerHTML = ""; // clear existing notes before re-rendering

    if (snapshot.empty) {
        notesGrid.innerHTML = `<p class="text-white/60 col-span-2 text-center py-10">No notes yet. Click "+ New Note" to create one!</p>`;
        return;
    }

    snapshot.docs.forEach((docSnap) => {
        const note = docSnap.data();  // the actual data { title, body, tag, createdAt }
        const noteId = docSnap.id;    // the auto-generated document ID
        renderNote(noteId, note, uid);
    });
}


// ===== RENDER A SINGLE NOTE CARD =====
function renderNote(noteId, note, uid) {
    const tagColors = {
        Personal: { bg: "bg-purple-200", text: "text-purple-700" },
        Important: { bg: "bg-yellow-200", text: "text-yellow-700" },
        Work: { bg: "bg-blue-200", text: "text-blue-700" },
    };

    const tag = tagColors[note.tag] || tagColors["Personal"];

    // Format the timestamp
    let timeText = "";
    if (note.createdAt) {
        const date = note.createdAt.toDate(); // Firestore timestamp → JS Date
        timeText = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    const card = document.createElement("div");
    card.className = "bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition";
    card.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <span class="${tag.bg} ${tag.text} text-xs px-2 py-1 rounded">${note.tag || "Personal"}</span>
            <button class="delete-btn text-gray-400 hover:text-red-500 cursor-pointer text-lg" title="Delete">🗑</button>
        </div>
        <h3 class="font-semibold text-lg">${escapeHtml(note.title)}</h3>
        <p class="text-gray-600 text-sm mt-1">${escapeHtml(note.body).substring(0, 100)}${note.body.length > 100 ? "..." : ""}</p>
        <div class="flex justify-between items-center mt-4 text-sm">
            <span class="text-gray-400">${timeText}</span>
            
        </div>
    `;

    // Delete button handler
    card.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm("Delete this note?")) {
            // doc() points to the exact note: users/{uid}/notes/{noteId}
            await deleteDoc(doc(db, "users", uid, "notes", noteId));
            loadNotes(uid); // refresh the list
        }
    });

    notesGrid.appendChild(card);
}


// ===== ESCAPE HTML (prevents XSS attacks) =====
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}


// ===== NEW NOTE MODAL =====
newNoteBtn.addEventListener("click", () => {
    noteModal.classList.remove("hidden");
    noteTitleInput.value = "";
    noteBodyInput.value = "";
    noteTagSelect.value = "Personal";
});

closeModal.addEventListener("click", () => {
    noteModal.classList.add("hidden");
});


// ===== SAVE NOTE =====
saveNoteBtn.addEventListener("click", async () => {
    const title = noteTitleInput.value.trim();
    const body = noteBodyInput.value.trim();
    const tag = noteTagSelect.value;

    if (!title) {
        alert("Please enter a title");
        return;
    }

    const user = auth.currentUser;  // gets the currently logged-in user
    if (!user) return;

    // addDoc() creates a new document inside users/{uid}/notes/
    // Firestore auto-generates a unique ID for each note
    await addDoc(getUserNotesRef(user.uid), {
        title: title,
        body: body,
        tag: tag,
        createdAt: serverTimestamp() // Firebase sets the time on its server
    });

    noteModal.classList.add("hidden");
    loadNotes(user.uid); // refresh notes list
});


// ===== LOGOUT =====
logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    // onAuthStateChanged will detect this and redirect to index.html
});