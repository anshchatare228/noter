import {auth} from "./firebase.js"; //the same thing which we exported in firebase.js
import {signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('errorMsg');
const bgVid = document.getElementById('bgVid');
bgVid.playbackRate = 0.5;

loginBtn.addEventListener("click", async(e)=>{  //async is usued to enable the use of await key
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    errorMsg.innerText = "";
    errorMsg.classList.add("opacity-0", "translate-y-2");

    try {
        await signInWithEmailAndPassword(auth,email,password); 
        //await is used to pause the program until a conslusion is provided
        window.location.href= "dashboard.html"; //redirection syntax
    }

    catch(error){
        if(error === "auth/network-request-failed"){
            errorMsg.innerHTML = "Something went wrong";
            errorMsg.classList.remove("opacity-0", "translate-y-2");
            console.log(error.code);
        }
        
        else{
            errorMsg.innerHTML = "Invalid Email or password";
            errorMsg.classList.remove("opacity-0", "translate-y-2");
            console.log(error.code);
            setTimeout(() => {
            errorMsg.classList.add("opacity-0", "translate-y-2"); 
            }, 2500);
        }
    } //if a error is caught, it'll display a messgae wiht a string

})