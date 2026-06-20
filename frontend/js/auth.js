document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "/api/auth";
    const authForm = document.getElementById("auth-form");
    const authTitle = document.getElementById("auth-title");
    const authSubtitle = document.getElementById("auth-subtitle");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const authBtn = document.getElementById("auth-btn");
    const toggleAuthBtn = document.getElementById("toggle-auth");
    const toggleHint = document.getElementById("toggle-hint");
    
    const errorBanner = document.getElementById("error-banner");
    const errorMessage = document.getElementById("error-message");
    const successBanner = document.getElementById("success-banner");
    const successMessage = document.getElementById("success-message");

    let isLogin = true;

    // Toggle between Register and Login
    toggleAuthBtn.addEventListener("click", (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        
        // Clear banners
        hideBanners();

        if (isLogin) {
            authTitle.innerText = "Welcome Back";
            authSubtitle.innerText = "Enter your details to sign in to your vault.";
            authBtn.innerHTML = `<span>Sign In</span><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>`;
            toggleHint.innerText = "New to DocChecker?";
            toggleAuthBtn.innerText = "Create an account";
        } else {
            authTitle.innerText = "Create Account";
            authSubtitle.innerText = "Protect yourself from hidden liabilities today.";
            authBtn.innerHTML = `<span>Get Started</span><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>`;
            toggleHint.innerText = "Already have an account?";
            toggleAuthBtn.innerText = "Sign in instead";
        }
    });

    // Handle Form Submission
    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideBanners();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showError("Please enter both email and password.");
            return;
        }

        const endpoint = isLogin ? "/login" : "/register";
        
        // Show loading state
        authBtn.disabled = true;
        const originalBtnContent = authBtn.innerHTML;
        authBtn.innerHTML = `<span>Processing...</span>`;

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Authentication failed. Please try again.");
            }

            // Success
            showSuccess(isLogin ? "Success! Redirecting to vault..." : "Registration successful! Loading vault...");
            
            // Store token and user details
            localStorage.setItem("docchecker_token", data.token);
            localStorage.setItem("docchecker_user", JSON.stringify(data.user));

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1500);

        } catch (error) {
            showError(error.message);
            authBtn.disabled = false;
            authBtn.innerHTML = originalBtnContent;
        }
    });

    function showError(message) {
        errorMessage.innerText = message;
        errorBanner.classList.remove("hidden");
    }

    function showSuccess(message) {
        successMessage.innerText = message;
        successBanner.classList.remove("hidden");
    }

    function hideBanners() {
        errorBanner.classList.add("hidden");
        successBanner.classList.add("hidden");
    }
});
