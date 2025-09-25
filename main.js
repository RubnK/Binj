// Script principal pour la page d'accueil
document.addEventListener('DOMContentLoaded', () => {
    const homeManager = new HomeManager();
    document.homeManager = homeManager; // Stocker l'instance globalement
    homeManager.initialize();
});

class HomeManager {
    constructor() {
        this.api = window.tmdbApi;
        this.ui = window.uiManager;
    }

    async initialize() {
        // Vérifier l'authentification
        this.checkAuth();
        
        // Configurer le menu utilisateur
        this.setupUserMenu();
        
        // Charger le contenu
        await this.loadContent();
    }

    checkAuth() {
        const user = JSON.parse(localStorage.getItem('binj_user') || '{}');
        if (!user.loggedIn) {
            window.location.href = 'index.html';
            return;
        }
        
        // Mettre à jour l'avatar avec l'initiale de l'email
        const avatar = document.querySelector('.user-avatar span');
        if (avatar && user.email) {
            avatar.textContent = user.email.charAt(0).toUpperCase();
        }
    }

    setupUserMenu() {
        const userAvatar = document.querySelector('.user-avatar');
        if (userAvatar) {
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserMenu();
            });
            
            // Effet hover pour indiquer l'interactivité
            userAvatar.addEventListener('mouseenter', () => {
                userAvatar.style.transform = 'scale(1.05)';
            });
            
            userAvatar.addEventListener('mouseleave', () => {
                userAvatar.style.transform = 'scale(1)';
            });
        }

        // Fermer le menu si on clique ailleurs
        document.addEventListener('click', () => {
            this.closeUserMenu();
        });
    }

    toggleUserMenu() {
        let menu = document.querySelector('.user-dropdown');
        
        if (!menu) {
            menu = this.createUserMenu();
            document.querySelector('.user-menu').appendChild(menu);
        }

        const isVisible = menu.classList.contains('show');
        if (isVisible) {
            menu.classList.remove('show');
        } else {
            menu.classList.add('show');
        }
    }

    createUserMenu() {
        const menu = document.createElement('div');
        menu.className = 'user-dropdown';

        const user = JSON.parse(localStorage.getItem('binj_user') || '{}');
        
        menu.innerHTML = `
            <div class="user-info">
                ${user.email || 'Utilisateur'}
                <br><small>Plan ${user.subscription || 'Standard'}</small>
            </div>
            <button class="menu-item logout" onclick="window.logout()">
                Se déconnecter
            </button>
        `;

        return menu;
    }

    closeUserMenu() {
        const menu = document.querySelector('.user-dropdown');
        if (menu) {
            menu.classList.remove('show');
        }
    }

    async loadContent() {
        try {
            // Charger les différentes sections en parallèle pour de meilleures performances
            await Promise.all([
                this.ui.fillCarousel('trending-movies', this.api.getTrendingMovies()),
                this.ui.fillCarousel('popular-movies', this.api.getPopularMovies()),
                this.ui.fillCarousel('popular-series', this.api.getPopularTVShows())
            ]);

            // Configurer le hero avec un film aléatoire des tendances
            await this.setupHero();

        } catch (error) {
            console.error('Erreur lors du chargement du contenu:', error);
            this.showErrorMessage();
        }
    }

    async setupHero() {
        try {
            const trendingData = await this.api.getTrendingMovies();
            if (trendingData.results && trendingData.results.length > 0) {
                // Prendre un film aléatoire parmi les 5 premiers
                const randomIndex = Math.floor(Math.random() * Math.min(5, trendingData.results.length));
                const featuredMovie = trendingData.results[randomIndex];
                
                this.updateHeroSection(featuredMovie);
            }
        } catch (error) {
            console.error('Erreur lors de la configuration du hero:', error);
        }
    }

    updateHeroSection(movie) {
        const heroSection = document.querySelector('.hero-section');
        const heroTitle = document.getElementById('hero-title');
        const heroDescription = document.querySelector('.hero-description');
        
        if (movie.backdrop_path) {
            const backdropUrl = this.api.getBackdropUrl(movie.backdrop_path);
            heroSection.style.backgroundImage = `
                linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), 
                url(${backdropUrl})
            `;
        }

        if (heroTitle) {
            heroTitle.textContent = movie.title || movie.name;
        }

        if (heroDescription) {
            // Limiter la description à 150 caractères
            const shortOverview = movie.overview.length > 150 
                ? movie.overview.substring(0, 150) + '...' 
                : movie.overview;
            heroDescription.textContent = shortOverview;
        }

        // Configurer les boutons d'action
        this.setupHeroButtons(movie);
    }

    setupHeroButtons(movie) {
        const trailerBtn = document.querySelector('.hero-actions .btn-primary');
        const listBtn = document.querySelector('.hero-actions .btn-secondary');

        if (trailerBtn) {
            trailerBtn.addEventListener('click', () => {
                // Naviguer vers la page de détails
                const params = new URLSearchParams({
                    id: movie.id,
                    type: movie.media_type || 'movie'
                });
                window.location.href = `details.html?${params}`;
            });
        }

        if (listBtn) {
            listBtn.addEventListener('click', () => {
                // Navigation vers les détails aussi
                const params = new URLSearchParams({
                    id: movie.id,
                    type: movie.media_type || 'movie'
                });
                window.location.href = `details.html?${params}`;
            });
        }
    }





    showErrorMessage() {
        const sections = document.querySelectorAll('.carousel-container');
        sections.forEach(section => {
            section.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <p>Erreur de chargement du contenu</p>
                    <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Réessayer
                    </button>
                </div>
            `;
        });
    }
}

// Fonction de déconnexion globale simple
window.logout = () => {
    localStorage.removeItem('binj_user');
    window.location.href = 'index.html';
};

// Ajouter les animations CSS pour les notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);