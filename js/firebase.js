import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"; //CDN to call firebase
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

//tells the firebase to connect to THIS application
const firebaseConfig = {
  apiKey: "AIzaSyCt4W3FeO6EqqT7wP88h6Ol6ZQmwRQvljA",
  authDomain: "noter-12b78.firebaseapp.com",
  projectId: "noter-12b78",
  storageBucket: "noter-12b78.firebasestorage.app",
  messagingSenderId: "846737874401",
  appId: "1:846737874401:web:199e83db3ab14765c3c6a0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

//to use auth globally 
export { auth };