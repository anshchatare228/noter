import { auth } from "./firebase.js"; //the same thing which we exported in firebase.js
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('errorMsg');

loginBtn.addEventListener("click", async()=>{  //async is usued to enable the use of await key
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    errorMsg.innerText = "";

    try {
        await signInWithEmailAndPassword(auth,email,password); 
        //await is used to pause the program until a conslusion is provided
        window.location.href= "dashboard.html"; //redirection syntax
    }

    catch(error){
        errorMsg.innerHTML = "Invalid Email or password";
        console.log(error.code);
    } //if a error is caught, it'll display a messgae wiht a string

})