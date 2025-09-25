// Configuration API TMDB
const API_CONFIG = {
    API_KEY: 'e4b90327227c88daac14c0bd0c1f93cd',
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
    BEARER_TOKEN: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNGI5MDMyNzIyN2M4OGRhYWMxNGMwYmQwYzFmOTNjZCIsIm5iZiI6MTc1ODY0ODMyMS43NDg5OTk4LCJzdWIiOiI2OGQyZDgwMTJhNWU3YzBhNDVjZWNmZWUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.aylEitwtAH0w4XRk8izJNNkF_bet8sxiC9iI-zSdHbU'
};

class TMDBApi {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 10 * 60 * 1000; // 10 minutes
    }

    // Méthode principale pour les requêtes API
    async makeRequest(endpoint, params = {}) {
        const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
        
        // Vérifier le cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        try {
            const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);
            
            // Ajouter la clé API
            url.searchParams.append('api_key', API_CONFIG.API_KEY);
            url.searchParams.append('language', 'fr-FR');
            
            // Ajouter les autres paramètres
            Object.entries(params).forEach(([key, value]) => {
                if (value) url.searchParams.append(key, value);
            });

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.BEARER_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status}`);
            }

            const data = await response.json();
            
            // Mettre en cache
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;

        } catch (error) {
            console.error('Erreur API TMDB:', error);
            throw error;
        }
    }

    // Films populaires
    async getPopularMovies(page = 1) {
        return this.makeRequest('/movie/popular', { page });
    }

    // Films tendances
    async getTrendingMovies(timeWindow = 'day') {
        return this.makeRequest(`/trending/movie/${timeWindow}`);
    }

    // Séries populaires
    async getPopularTVShows(page = 1) {
        return this.makeRequest('/tv/popular', { page });
    }

    // Recherche multi (films + séries)
    async searchMulti(query, page = 1) {
        if (!query.trim()) return { results: [] };
        return this.makeRequest('/search/multi', { query: query.trim(), page });
    }

    // Détails d'un film
    async getMovieDetails(movieId) {
        return this.makeRequest(`/movie/${movieId}`, { 
            append_to_response: 'videos,credits,similar' 
        });
    }

    // Détails d'une série
    async getTVDetails(tvId) {
        return this.makeRequest(`/tv/${tvId}`, { 
            append_to_response: 'videos,credits,similar' 
        });
    }

    // Films similaires
    async getSimilarMovies(movieId) {
        return this.makeRequest(`/movie/${movieId}/similar`);
    }

    // Utilitaires pour les images
    getImageUrl(path, size = 'w500') {
        if (!path) return '/placeholder-image.jpg';
        return `${API_CONFIG.IMAGE_BASE_URL}/${size}${path}`;
    }

    getBackdropUrl(path, size = 'w1280') {
        if (!path) return '/placeholder-backdrop.jpg';
        return `${API_CONFIG.IMAGE_BASE_URL}/${size}${path}`;
    }

    // Formatage des données
    formatMovieCard(item) {
        return {
            id: item.id,
            title: item.title || item.name,
            poster: this.getImageUrl(item.poster_path),
            releaseDate: item.release_date || item.first_air_date,
            rating: item.vote_average,
            overview: item.overview,
            mediaType: item.media_type || (item.title ? 'movie' : 'tv')
        };
    }

    formatCurrency(amount) {
        if (!amount) return 'Non disponible';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatRuntime(minutes) {
        if (!minutes) return 'Non disponible';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}min`;
    }

    formatDate(dateString) {
        if (!dateString) return 'Non disponible';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

class UIManager {
    constructor(api) {
        this.api = api;
    }

    // Créer une carte de film/série
    createMovieCard(item) {
        const formatted = this.api.formatMovieCard(item);
        
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `${formatted.title} - Note: ${formatted.rating}/10`);
        
        card.innerHTML = `
            <img src="${formatted.poster}" 
                 alt="${formatted.title}" 
                 loading="lazy"
                 onerror="this.src='/placeholder-image.jpg'">
        `;

        // Navigation vers la page de détails
        const handleClick = () => {
            const params = new URLSearchParams({
                id: formatted.id,
                type: formatted.mediaType
            });
            window.location.href = `details.html?${params}`;
        };

        card.addEventListener('click', handleClick);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
            }
        });

        return card;
    }

    // Remplir un carrousel
    async fillCarousel(containerId, dataPromise) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const data = await dataPromise;
            container.innerHTML = '';

            if (data.results && data.results.length > 0) {
                data.results.slice(0, 20).forEach(item => {
                    const card = this.createMovieCard(item);
                    container.appendChild(card);
                });
            } else {
                container.innerHTML = '<p class="no-content">Aucun contenu disponible</p>';
            }
        } catch (error) {
            console.error(`Erreur lors du chargement de ${containerId}:`, error);
            container.innerHTML = '<p class="error-message">Erreur de chargement</p>';
        }
    }

    // Afficher les résultats de recherche
    displaySearchResults(results, container) {
        if (!container) return;

        container.innerHTML = '';

        if (results.length === 0) {
            document.getElementById('no-results')?.style.setProperty('display', 'block');
            return;
        }

        document.getElementById('no-results')?.style.setProperty('display', 'none');

        results.forEach(item => {
            const card = this.createMovieCard(item);
            container.appendChild(card);
        });
    }

    // Animation de chargement
    showLoading(element) {
        if (element) {
            element.innerHTML = '<div class="loading">Chargement...</div>';
        }
    }
}

// Initialisation globale
window.tmdbApi = new TMDBApi();
window.uiManager = new UIManager(window.tmdbApi);