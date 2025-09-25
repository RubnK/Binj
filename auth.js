// Gestion de l'authentification et des abonnements
class AuthManager {
    constructor() {
        this.initializeAuth();
    }

    initializeAuth() {
        // Vérifier si on est sur la page de connexion
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            this.setupLoginForm(loginForm);
        }

        // Vérifier si on est sur la page d'abonnement
        const planButtons = document.querySelectorAll('.btn-plan');
        if (planButtons.length > 0) {
            this.setupSubscriptionButtons(planButtons);
        }

        // Vérifier l'authentification au chargement
        this.checkAuthStatus();
    }

    setupLoginForm(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(form);
        });

        // Validation en temps réel
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        emailInput?.addEventListener('blur', () => this.validateEmail(emailInput));
        passwordInput?.addEventListener('blur', () => this.validatePassword(passwordInput));
    }

    validateEmail(input) {
        const email = input.value.trim();
        const errorElement = document.getElementById('email-error');
        
        if (!email) {
            this.showError(errorElement, 'L\'adresse e-mail est requise');
            return false;
        } else if (!this.isValidEmail(email)) {
            this.showError(errorElement, 'Veuillez entrer une adresse e-mail valide');
            return false;
        } else {
            this.clearError(errorElement);
            return true;
        }
    }

    validatePassword(input) {
        const password = input.value;
        const errorElement = document.getElementById('password-error');
        
        if (!password) {
            this.showError(errorElement, 'Le mot de passe est requis');
            return false;
        } else if (password.length < 6) {
            this.showError(errorElement, 'Le mot de passe doit contenir au moins 6 caractères');
            return false;
        } else {
            this.clearError(errorElement);
            return true;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    clearError(element) {
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
        }
    }

    async handleLogin(form) {
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const statusElement = document.getElementById('login-status');

        // Validation
        const isEmailValid = this.validateEmail(email);
        const isPasswordValid = this.validatePassword(password);

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        // Simulation de connexion (remplacer par vraie API)
        statusElement.textContent = 'Connexion en cours...';
        
        try {
            await this.simulateLogin(email.value, password.value);
            
            // Stocker l'état de connexion
            localStorage.setItem('binj_user', JSON.stringify({
                email: email.value,
                loggedIn: true,
                loginTime: Date.now()
            }));

            statusElement.textContent = 'Connexion réussie ! Redirection...';
            
            // Redirection après connexion
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);

        } catch (error) {
            statusElement.textContent = 'Erreur de connexion. Vérifiez vos identifiants.';
            console.error('Erreur de connexion:', error);
        }
    }

    simulateLogin(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulation - accepter toute combinaison avec @
                if (email.includes('@')) {
                    resolve();
                } else {
                    reject(new Error('Identifiants invalides'));
                }
            }, 1500);
        });
    }

    setupSubscriptionButtons(buttons) {
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const plan = e.target.dataset.plan;
                this.handleSubscription(plan);
            });
        });
    }

    handleSubscription(planType) {
        // Simulation de la sélection d'abonnement
        const user = JSON.parse(localStorage.getItem('binj_user') || '{}');
        user.subscription = planType;
        user.subscriptionDate = Date.now();
        
        localStorage.setItem('binj_user', JSON.stringify(user));
        
        // Feedback visuel
        const selectedButton = document.querySelector(`[data-plan="${planType}"]`);
        selectedButton.textContent = 'Sélectionné ✓';
        selectedButton.style.background = '#46d369';
        
        // Redirection après sélection
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1500);
    }

    checkAuthStatus() {
        const currentPage = window.location.pathname.split('/').pop();
        const protectedPages = ['home.html', 'search.html', 'details.html'];
        
        if (protectedPages.includes(currentPage)) {
            const user = JSON.parse(localStorage.getItem('binj_user') || '{}');
            
            if (!user.loggedIn) {
                // Rediriger vers la page de connexion
                window.location.href = 'index.html';
                return;
            }

            // Vérifier si l'utilisateur a un abonnement
            if (!user.subscription && currentPage !== 'subscription.html') {
                window.location.href = 'subscription.html';
                return;
            }
        }
    }

    logout() {
        localStorage.removeItem('binj_user');
        window.location.href = 'index.html';
    }
}

// Initialiser l'authentification au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});

// Fonction globale pour déconnexion (peut être appelée depuis d'autres scripts)
window.logout = () => {
    localStorage.removeItem('binj_user');
    window.location.href = 'index.html';
};