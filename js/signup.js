import {auth} from "./firebase";
import{signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";;

const signupBtn = document.getElementById('signupBtn');
const errorMsg = document.getElementById('errorMsg');

signupBtn.addEventListener("click",async(e)=>{

    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if(password !== confirmPassword){
        errorMsg.removeAttribute = "hidden";
        errorMsg.innerText = "passwords do not match";
    }

    else{
        try{
            const userCredeential = await createUserWithEmailAnshPassword(auth,email,password);
            console.log("User created");
            window.location.href = "dashboard.html";
        }

        catch(error){
            if(error.code === "auth/email-already-in-use"){
                errorMsg.innerText = "email is already in use";
            }
            
            else if (error.code === "auth/invalid-email") {
                errorMsg.innerText = "Invalid email format";
            } 
            
            else {
                errorMsg.innerText = "Something went wrong";
            }
        }
    }
})