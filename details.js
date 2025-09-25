// Script pour la page de détails
document.addEventListener('DOMContentLoaded', () => {
    const detailsManager = new DetailsManager();
    detailsManager.initialize();
});

class DetailsManager {
    constructor() {
        this.api = window.tmdbApi;
        this.ui = window.uiManager;
        this.currentItem = null;
    }

    initialize() {
        this.checkAuth();
        this.setupUserMenu();
        this.getItemFromURL();
        this.loadItemDetails();
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

    getItemFromURL() {
        const params = new URLSearchParams(window.location.search);
        this.itemId = params.get('id');
        this.itemType = params.get('type') || 'movie';

        if (!this.itemId) {
            this.showError('Élément non trouvé');
            return;
        }
    }

    async loadItemDetails() {
        if (!this.itemId) return;

        try {
            // Afficher le loading
            this.showLoading();

            // Charger les détails selon le type
            if (this.itemType === 'tv') {
                this.currentItem = await this.api.getTVDetails(this.itemId);
            } else {
                this.currentItem = await this.api.getMovieDetails(this.itemId);
            }

            // Afficher les détails
            this.displayDetails();
            
            // Charger les contenus similaires
            await this.loadSimilarContent();

        } catch (error) {
            console.error('Erreur lors du chargement des détails:', error);
            this.showError('Erreur lors du chargement des détails');
        }
    }

    showLoading() {
        document.getElementById('movie-title').textContent = 'Chargement...';
        document.getElementById('movie-overview').textContent = 'Chargement des informations...';
    }

    displayDetails() {
        const item = this.currentItem;
        if (!item) return;

        // Titre
        const title = item.title || item.name;
        document.getElementById('movie-title').textContent = title;
        document.title = `Binj - ${title}`;

        // Images
        const backdropImg = document.getElementById('backdrop-img');
        const posterImg = document.getElementById('poster-img');
        
        if (backdropImg && item.backdrop_path) {
            backdropImg.src = this.api.getBackdropUrl(item.backdrop_path);
            backdropImg.alt = `Image de fond de ${title}`;
        }
        
        if (posterImg && item.poster_path) {
            posterImg.src = this.api.getImageUrl(item.poster_path, 'w500');
            posterImg.alt = `Affiche de ${title}`;
        }

        // Métadonnées
        this.updateMetadata(item);

        // Description
        const overviewElement = document.getElementById('movie-overview');
        if (overviewElement) {
            overviewElement.textContent = item.overview || 'Aucune description disponible.';
        }

        // Informations supplémentaires
        this.updateAdditionalInfo(item);

        // Configurer les boutons d'action
        this.setupActionButtons(item);
    }

    updateMetadata(item) {
        // Date de sortie
        const releaseDateElement = document.getElementById('release-date');
        if (releaseDateElement) {
            const releaseDate = item.release_date || item.first_air_date;
            releaseDateElement.textContent = this.api.formatDate(releaseDate);
        }

        // Note
        const ratingElement = document.getElementById('rating');
        if (ratingElement) {
            const rating = item.vote_average;
            ratingElement.textContent = `⭐ ${rating ? rating.toFixed(1) : 'N/A'}/10`;
            ratingElement.setAttribute('aria-label', `Note: ${rating ? rating.toFixed(1) : 'Non disponible'} sur 10`);
        }

        // Durée (pour les films)
        const runtimeElement = document.getElementById('runtime');
        if (runtimeElement) {
            if (this.itemType === 'movie' && item.runtime) {
                runtimeElement.textContent = this.api.formatRuntime(item.runtime);
            } else if (this.itemType === 'tv' && item.episode_run_time && item.episode_run_time.length > 0) {
                runtimeElement.textContent = `~${item.episode_run_time[0]}min/épisode`;
            } else {
                runtimeElement.textContent = 'Durée non disponible';
            }
        }
    }

    updateAdditionalInfo(item) {
        // Genres
        const genresElement = document.getElementById('genres');
        if (genresElement) {
            const genres = item.genres ? item.genres.map(g => g.name).join(', ') : 'Non spécifié';
            genresElement.textContent = genres;
        }

        // Langue originale
        const languageElement = document.getElementById('original-language');
        if (languageElement) {
            const languageNames = {
                'en': 'Anglais',
                'fr': 'Français',
                'es': 'Espagnol',
                'de': 'Allemand',
                'it': 'Italien',
                'ja': 'Japonais',
                'ko': 'Coréen',
                'zh': 'Chinois'
            };
            const langCode = item.original_language;
            languageElement.textContent = languageNames[langCode] || langCode?.toUpperCase() || 'Non spécifié';
        }

        // Budget et recettes (pour les films)
        if (this.itemType === 'movie') {
            const budgetElement = document.getElementById('budget');
            const revenueElement = document.getElementById('revenue');
            
            if (budgetElement) {
                budgetElement.textContent = this.api.formatCurrency(item.budget);
            }
            
            if (revenueElement) {
                revenueElement.textContent = this.api.formatCurrency(item.revenue);
            }
        } else {
            // Pour les séries, afficher d'autres infos
            const budgetElement = document.getElementById('budget');
            const revenueElement = document.getElementById('revenue');
            
            if (budgetElement) {
                budgetElement.parentElement.querySelector('h4').textContent = 'Saisons';
                budgetElement.textContent = item.number_of_seasons ? `${item.number_of_seasons} saison${item.number_of_seasons > 1 ? 's' : ''}` : 'Non spécifié';
            }
            
            if (revenueElement) {
                revenueElement.parentElement.querySelector('h4').textContent = 'Épisodes';
                revenueElement.textContent = item.number_of_episodes ? `${item.number_of_episodes} épisodes` : 'Non spécifié';
            }
        }
    }

    setupActionButtons(item) {
        const playBtn = document.querySelector('.btn-primary');
        const listBtn = document.querySelector('.btn-secondary');

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.showPlayModal(item);
            });
        }

        if (listBtn) {
            listBtn.addEventListener('click', () => {
                // Simple message au lieu du système de liste
                alert('Fonctionnalité "Ma liste" non implémentée');
            });
        }
    }

    async showPlayModal(item) {
        // Récupérer les vidéos (bandes-annonces)
        const trailer = await this.getTrailer(item.id);
        
        // Créer une modale pour la lecture
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            padding: 20px;
        `;

        if (trailer) {
            // Afficher la bande-annonce YouTube
            modal.innerHTML = `
                <div style="position: relative; max-width: 900px; width: 100%; background: black; border-radius: 8px; overflow: hidden;">
                    <button id="closeModal" style="position: absolute; top: 10px; right: 10px; z-index: 2001; width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.7); color: white; border: none; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center;">
                        ✕
                    </button>
                    <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
                        <iframe 
                            src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1" 
                            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen
                            title="Bande-annonce de ${item.title || item.name}">
                        </iframe>
                    </div>
                    <div style="padding: 15px; background: var(--dark-bg);">
                        <h4 style="margin: 0 0 5px 0; color: white;">${trailer.name}</h4>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                            ${trailer.type} • ${trailer.site}
                        </p>
                    </div>
                </div>
            `;
        } else {
            // Pas de bande-annonce disponible
            modal.innerHTML = `
                <div style="background: var(--accent-gray); padding: 40px; border-radius: 8px; text-align: center; max-width: 400px;">
                    <h3 style="margin-bottom: 20px;">${item.title || item.name}</h3>
                    <p style="margin-bottom: 30px; color: var(--text-secondary);">
                        Aucune bande-annonce disponible pour ce contenu.
                    </p>
                    <button id="closeModal" style="padding: 12px 24px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Fermer
                    </button>
                </div>
            `;
        }

        document.body.appendChild(modal);

        // Fermer la modale
        const closeModal = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        };

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        const closeBtn = document.getElementById('closeModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        // Fermer avec Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }



    async loadSimilarContent() {
        try {
            let similarData;
            if (this.itemType === 'tv') {
                // Pour les séries, utiliser l'endpoint similaire
                similarData = await this.api.makeRequest(`/tv/${this.itemId}/similar`);
            } else {
                similarData = await this.api.getSimilarMovies(this.itemId);
            }

            const container = document.getElementById('similar-movies');
            if (container && similarData.results) {
                container.innerHTML = '';
                
                if (similarData.results.length > 0) {
                    similarData.results.slice(0, 10).forEach(item => {
                        const card = this.ui.createMovieCard(item);
                        container.appendChild(card);
                    });
                } else {
                    container.innerHTML = '<p class="no-content">Aucun contenu similaire trouvé</p>';
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement du contenu similaire:', error);
            const container = document.getElementById('similar-movies');
            if (container) {
                container.innerHTML = '<p class="error-message">Erreur de chargement</p>';
            }
        }
    }

    async getTrailer(itemId) {
        try {
            const endpoint = this.itemType === 'tv' ? `/tv/${itemId}/videos` : `/movie/${itemId}/videos`;
            const videosData = await this.api.makeRequest(endpoint);
            
            if (videosData.results && videosData.results.length > 0) {
                // Chercher une bande-annonce YouTube en priorité
                const trailer = videosData.results.find(video => 
                    video.site === 'YouTube' && 
                    (video.type === 'Trailer' || video.type === 'Teaser')
                );
                
                // Si pas de bande-annonce, prendre la première vidéo YouTube
                return trailer || videosData.results.find(video => video.site === 'YouTube');
            }
            
            return null;
        } catch (error) {
            console.error('Erreur lors de la récupération des vidéos:', error);
            return null;
        }
    }



    showError(message) {
        const main = document.querySelector('.details-main');
        if (main) {
            main.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <h2 style="color: var(--error-color); margin-bottom: 20px;">Erreur</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 30px;">${message}</p>
                    <button onclick="history.back()" style="padding: 12px 24px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                        Retour
                    </button>
                    <button onclick="location.href='home.html'" style="padding: 12px 24px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Accueil
                    </button>
                </div>
            `;
        }
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