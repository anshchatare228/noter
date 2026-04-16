import {auth} from "./firebase.js";
import {signInWithEmailAndPassword, sendPasswordResetEmail} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('errorMsg');
const bgVid = document.getElementById('bgVid');
bgVid.playbackRate = 0.5;


// ===== PASSWORD TOGGLE =====
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePassword.textContent = isPassword ? '🙈' : '👁';
});


// ===== FORGOT PASSWORD =====
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const forgotModal = document.getElementById('forgotModal');
const forgotModalBox = document.getElementById('forgotModalBox');
const resetEmail = document.getElementById('resetEmail');
const sendResetBtn = document.getElementById('sendResetBtn');
const cancelResetBtn = document.getElementById('cancelResetBtn');
const resetMsg = document.getElementById('resetMsg');

forgotPasswordBtn.addEventListener('click', () => {
    forgotModal.classList.remove('opacity-0', 'pointer-events-none');
    forgotModalBox.classList.remove('scale-90');
    forgotModalBox.classList.add('scale-100');
    resetEmail.value = document.getElementById('email').value || '';
});

cancelResetBtn.addEventListener('click', () => {
    forgotModal.classList.add('opacity-0', 'pointer-events-none');
    forgotModalBox.classList.remove('scale-100');
    forgotModalBox.classList.add('scale-90');
    resetMsg.classList.add('opacity-0');
});

sendResetBtn.addEventListener('click', async () => {
    const email = resetEmail.value.trim();
    if (!email) return;

    try {
        await sendPasswordResetEmail(auth, email);
        resetMsg.textContent = 'Reset link sent! Check your inbox.';
        resetMsg.className = 'text-sm mt-3 text-green-400 transition-opacity duration-500';
    } catch (error) {
        resetMsg.textContent = 'Could not send reset email. Check the address.';
        resetMsg.className = 'text-sm mt-3 text-red-400 transition-opacity duration-300';
    }

    setTimeout(() => {
        resetMsg.classList.add('opacity-0');
    }, 4000);
});

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