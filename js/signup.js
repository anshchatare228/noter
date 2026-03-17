import {auth} from "./firebase.js";
import {createUserWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const signupBtn = document.getElementById('signupBtn');
const errorMsg = document.getElementById('errorMsg');

signupBtn.addEventListener("click",async(e)=>{

    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    errorMsg.innerText = "";
    errorMsg.classList.add("opacity-0", "translate-y-2");

    if(password !== confirmPassword){
        errorMsg.innerText = "passwords do not match";
        errorMsg.classList.remove("opacity-0", "translate-y-2");
        return;
    }

    else{
        try{
            const userCredeential = await createUserWithEmailAndPassword(auth,email,password);
            console.log("User created");
            window.location.href = "dashboard.html";
        }

        catch(error){
            if(error.code === "auth/email-already-in-use"){
                errorMsg.innerText = "email is already in use";
                errorMsg.classList.remove("opacity-0", "translate-y-2");
            }
            
            else if (error.code === "auth/invalid-email") {
                errorMsg.innerText = "Invalid email format";
                errorMsg.classList.remove("opacity-0", "translate-y-2");
            } 
            
            else {
                errorMsg.innerText = "Something went wrong";
                errorMsg.classList.remove("opacity-0", "translate-y-2");
            }
        }
    }
})