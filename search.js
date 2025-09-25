// Script pour la page de recherche
document.addEventListener('DOMContentLoaded', () => {
    const searchManager = new SearchManager();
    searchManager.initialize();
});

class SearchManager {
    constructor() {
        this.api = window.tmdbApi;
        this.ui = window.uiManager;
        this.searchTimeout = null;
        this.currentQuery = '';
    }

    initialize() {
        this.setupSearchForm();
        this.setupKeyboardShortcuts();
        this.setupUserMenu();
        this.checkAuth();
    }

    checkAuth() {
        const user = JSON.parse(localStorage.getItem('binj_user') || '{}');
        if (!user.loggedIn) {
            window.location.href = 'index.html';
            return;
        }
        
        // Mettre à jour l'avatar
        const avatar = document.querySelector('.user-avatar span');
        if (avatar && user.email) {
            avatar.textContent = user.email.charAt(0).toUpperCase();
        }
    }

    setupSearchForm() {
        const searchForm = document.querySelector('.search-form');
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.querySelector('.search-btn');

        if (searchForm && searchInput) {
            // Recherche lors de la soumission du formulaire
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.performSearch(searchInput.value.trim());
            });

            // Recherche en temps réel avec debounce
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                this.debounceSearch(query);
            });

            // Focus automatique sur le champ de recherche
            searchInput.focus();

            // Accessibilité - recherche au clic sur le bouton
            if (searchBtn) {
                searchBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.performSearch(searchInput.value.trim());
                });
            }
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Raccourci Ctrl+K ou Cmd+K pour focus sur la recherche
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }

            // Escape pour vider la recherche
            if (e.key === 'Escape') {
                const searchInput = document.getElementById('search-input');
                if (searchInput && document.activeElement === searchInput) {
                    searchInput.value = '';
                    this.clearResults();
                }
            }
        });
    }

    debounceSearch(query) {
        // Annuler la recherche précédente
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Programmer une nouvelle recherche après 300ms
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    async performSearch(query) {
        const resultsContainer = document.getElementById('search-results');
        const resultsTitle = document.getElementById('results-title');
        const resultsInfo = document.getElementById('search-results-info');

        // Nettoyer la requête
        query = query.trim();
        this.currentQuery = query;

        if (!query) {
            this.clearResults();
            return;
        }

        // Afficher l'état de recherche
        this.showSearching(resultsTitle, resultsContainer);
        
        // Annoncer la recherche pour les lecteurs d'écran
        if (resultsInfo) {
            resultsInfo.textContent = `Recherche en cours pour "${query}"`;
        }

        try {
            const data = await this.api.searchMulti(query);
            
            // Vérifier si c'est toujours la requête actuelle
            if (query !== this.currentQuery) {
                return; // Ignorer les résultats obsolètes
            }

            this.displayResults(data, resultsTitle, resultsContainer, resultsInfo);

        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            this.showSearchError(resultsTitle, resultsContainer, resultsInfo);
        }
    }

    showSearching(titleElement, containerElement) {
        if (titleElement) {
            titleElement.textContent = 'Recherche en cours...';
        }
        
        if (containerElement) {
            containerElement.innerHTML = `
                <div class="search-loading" style="text-align: center; padding: 40px;">
                    <div class="loading-spinner" style="
                        width: 40px; 
                        height: 40px; 
                        border: 3px solid var(--accent-gray); 
                        border-top-color: var(--primary-color); 
                        border-radius: 50%; 
                        animation: spin 1s linear infinite;
                        margin: 0 auto 16px;
                    "></div>
                    <p>Recherche en cours...</p>
                </div>
            `;
        }
    }

    displayResults(data, titleElement, containerElement, infoElement) {
        const results = data.results || [];
        const filteredResults = results.filter(item => 
            (item.media_type === 'movie' || item.media_type === 'tv') && 
            item.poster_path
        );

        // Mettre à jour le titre
        if (titleElement) {
            const count = filteredResults.length;
            titleElement.textContent = count > 0 
                ? `${count} résultat${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`
                : 'Aucun résultat trouvé';
        }

        // Annoncer les résultats pour l'accessibilité
        if (infoElement) {
            const count = filteredResults.length;
            infoElement.textContent = count > 0 
                ? `${count} résultats trouvés pour "${this.currentQuery}"`
                : `Aucun résultat trouvé pour "${this.currentQuery}"`;
        }

        // Afficher les résultats
        if (containerElement) {
            if (filteredResults.length > 0) {
                this.ui.displaySearchResults(filteredResults, containerElement);
                document.getElementById('no-results')?.style.setProperty('display', 'none');
            } else {
                containerElement.innerHTML = '';
                this.showNoResults();
            }
        }
    }

    showNoResults() {
        const noResults = document.getElementById('no-results');
        if (noResults) {
            noResults.style.display = 'block';
            noResults.innerHTML = `
                <h4>Aucun résultat trouvé</h4>
                <p>Essayez avec d'autres mots-clés ou vérifiez l'orthographe</p>
                <div style="margin-top: 20px;">
                    <p style="color: var(--text-secondary); font-size: 14px;">
                        Suggestions:
                    </p>
                    <ul style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">
                        <li>Utilisez des mots-clés plus généraux</li>
                        <li>Vérifiez l'orthographe</li>
                        <li>Essayez le titre original en anglais</li>
                    </ul>
                </div>
            `;
        }
    }

    showSearchError(titleElement, containerElement, infoElement) {
        if (titleElement) {
            titleElement.textContent = 'Erreur de recherche';
        }

        if (infoElement) {
            infoElement.textContent = 'Une erreur est survenue lors de la recherche';
        }

        if (containerElement) {
            containerElement.innerHTML = `
                <div class="search-error" style="text-align: center; padding: 40px;">
                    <h4 style="color: var(--error-color); margin-bottom: 16px;">
                        Erreur de recherche
                    </h4>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">
                        Une erreur est survenue lors de la recherche.
                    </p>
                    <button onclick="location.reload()" 
                            style="padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Réessayer
                    </button>
                </div>
            `;
        }
    }

    clearResults() {
        const resultsTitle = document.getElementById('results-title');
        const resultsContainer = document.getElementById('search-results');
        const resultsInfo = document.getElementById('search-results-info');
        const noResults = document.getElementById('no-results');

        if (resultsTitle) {
            resultsTitle.textContent = 'Tapez quelque chose pour commencer votre recherche';
        }

        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }

        if (resultsInfo) {
            resultsInfo.textContent = '';
        }

        if (noResults) {
            noResults.style.display = 'none';
        }

        this.currentQuery = '';
    }

    setupUserMenu() {
        const userAvatar = document.querySelector('.user-avatar');
        if (userAvatar) {
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserMenu();
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
}

// Fonction de déconnexion pour cette page
if (!window.logout) {
    window.logout = () => {
        localStorage.removeItem('binj_user');
        window.location.href = 'index.html';
    };
}

// Ajouter l'animation de rotation pour le spinner
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);