// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getDatabase, ref, get, set, push, query, limitToLast } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Export Firebase utilities
export { database, ref, get, set, push, query, limitToLast };
