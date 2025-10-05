// OpenFarm - Application de recherche de plantes
// Système de gestion d'état global
const OpenFarm = {
    state: {
        favorites: JSON.parse(localStorage.getItem('plantFavorites') || '[]'),
        navigationHistory: JSON.parse(localStorage.getItem('plantHistory') || '[]'),
        currentSearchResults: null,
        currentSpeech: null
    },
    
    elements: {},
    
    init() {
        this.cacheElements();
        this.initTheme();
        this.attachEventListeners();
        this.updateFavoritesCount();
        this.initKeyboardShortcuts();
    },
    
    cacheElements() {
        this.elements = {
            searchInput: document.querySelector('.search-input'),
            searchButton: document.querySelector('.search-button'),
            searchResults: document.getElementById('searchResults'),
            searchSuggestions: document.getElementById('searchSuggestions'),
            themeToggle: document.getElementById('themeToggle'),
            favoritesToggle: document.getElementById('favoritesToggle'),
            helpToggle: document.getElementById('helpToggle'),
            helpModal: document.getElementById('helpModal'),
            helpClose: document.getElementById('helpClose'),
            toastContainer: document.getElementById('toastContainer'),
            progressBar: document.getElementById('readingProgress'),
            popularTags: document.querySelectorAll('.popular-tag')
        };
    },
    
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon();
    },
    
    attachEventListeners() {
        // Recherche
        if (this.elements.searchButton) {
            this.elements.searchButton.addEventListener('click', () => this.searchPlant());
        }
        
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchPlant();
            });
            
            // Suggestions automatiques
            let searchTimeout;
            this.elements.searchInput.addEventListener('input', function(e) {
                clearTimeout(searchTimeout);
                const value = e.target.value.trim();
                if (value.length > 1) {
                    searchTimeout = setTimeout(() => {
                        OpenFarm.showSearchSuggestions(value);
                    }, 300);
                } else {
                    OpenFarm.elements.searchSuggestions?.classList.remove('show');
                }
            });
        }
        
        // Thème
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Favoris
        if (this.elements.favoritesToggle) {
            this.elements.favoritesToggle.addEventListener('click', () => this.showFavorites());
        }
        
        // Aide
        if (this.elements.helpToggle) {
            this.elements.helpToggle.addEventListener('click', () => this.showHelp());
        }
        
        if (this.elements.helpClose) {
            this.elements.helpClose.addEventListener('click', () => this.hideHelp());
        }
        
        if (this.elements.helpModal) {
            this.elements.helpModal.addEventListener('click', (e) => {
                if (e.target === this.elements.helpModal) this.hideHelp();
            });
        }
        
        // Tags populaires
        this.elements.popularTags.forEach(tag => {
            tag.addEventListener('click', function() {
                const searchTerm = this.getAttribute('data-search');
                OpenFarm.elements.searchInput.value = searchTerm;
                OpenFarm.searchPlant();
                setTimeout(() => {
                    OpenFarm.elements.searchResults.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }, 100);
            });
        });
        
        // Barre de progression
        window.addEventListener('scroll', () => this.updateProgressBar());
        
        // Fermer les suggestions
        document.addEventListener('click', (e) => {
            if (this.elements.searchSuggestions && 
                !this.elements.searchInput.contains(e.target) && 
                !this.elements.searchSuggestions.contains(e.target)) {
                this.elements.searchSuggestions.classList.remove('show');
            }
        });
    },
    
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K pour focus sur recherche
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.elements.searchInput.focus();
            }
            
            // Escape pour fermer les suggestions ou revenir
            if (e.key === 'Escape') {
                if (this.elements.searchSuggestions?.classList.contains('show')) {
                    this.elements.searchSuggestions.classList.remove('show');
                } else if (document.querySelector('.article-container')) {
                    this.goBackToResults();
                } else if (this.elements.helpModal?.classList.contains('show')) {
                    this.hideHelp();
                }
            }
            
            // Ctrl/Cmd + D pour basculer le thème
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.toggleTheme();
            }
            
            // Ctrl/Cmd + H pour l'aide
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                this.showHelp();
            }
            
            // Navigation dans les suggestions
            this.handleSuggestionNavigation(e);
        });
    },
    
    handleSuggestionNavigation(e) {
        if (this.elements.searchSuggestions?.classList.contains('show')) {
            const suggestions = this.elements.searchSuggestions.querySelectorAll('.suggestion-item');
            const activeIndex = Array.from(suggestions).findIndex(item => item.classList.contains('active'));
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = activeIndex < suggestions.length - 1 ? activeIndex + 1 : 0;
                suggestions.forEach((item, index) => {
                    item.classList.toggle('active', index === nextIndex);
                });
            }
            
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = activeIndex > 0 ? activeIndex - 1 : suggestions.length - 1;
                suggestions.forEach((item, index) => {
                    item.classList.toggle('active', index === prevIndex);
                });
            }
            
            if (e.key === 'Enter' && activeIndex >= 0) {
                e.preventDefault();
                suggestions[activeIndex].click();
            }
        }
    },
    
    updateThemeIcon() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (this.elements.themeToggle) {
            this.elements.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    },
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon();
        this.showToast(`Thème ${newTheme === 'dark' ? 'sombre' : 'clair'} activé`, 'success');
    },
    
    updateFavoritesCount() {
        const count = this.state.favorites.length;
        const favoritesCountEl = document.querySelector('.favorites-count');
        if (favoritesCountEl) {
            favoritesCountEl.textContent = count;
        }
    },
    
    toggleFavorite(pageId, title) {
        const index = this.state.favorites.findIndex(fav => fav.id === pageId);
        if (index > -1) {
            this.state.favorites.splice(index, 1);
        } else {
            this.state.favorites.push({ 
                id: pageId, 
                title: title, 
                date: new Date().toISOString() 
            });
        }
        localStorage.setItem('plantFavorites', JSON.stringify(this.state.favorites));
        this.updateFavoritesCount();
        return index === -1;
    },
    
    updateProgressBar() {
        const article = document.querySelector('.article-content');
        if (article && this.elements.progressBar) {
            const scrollTop = window.pageYOffset;
            const docHeight = article.offsetHeight;
            const winHeight = window.innerHeight;
            const scrollPercent = scrollTop / (docHeight - winHeight);
            const scrollPercentRounded = Math.round(scrollPercent * 100);
            this.elements.progressBar.style.width = Math.min(scrollPercentRounded, 100) + '%';
        }
    },
    
    startSpeech(text) {
        if (this.state.currentSpeech) {
            window.speechSynthesis.cancel();
        }
        
        this.state.currentSpeech = new SpeechSynthesisUtterance(text);
        this.state.currentSpeech.lang = 'fr-FR';
        this.state.currentSpeech.rate = 0.8;
        this.state.currentSpeech.pitch = 1;
        
        this.state.currentSpeech.onend = () => {
            const speechBtn = document.getElementById('speechBtn');
            if (speechBtn) {
                speechBtn.textContent = '🔊 Écouter';
                speechBtn.classList.remove('active');
            }
        };
        
        window.speechSynthesis.speak(this.state.currentSpeech);
    },
    
    stopSpeech() {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    },
    
    async showSearchSuggestions(query) {
        if (!this.elements.searchSuggestions || query.length < 2) {
            if (this.elements.searchSuggestions) {
                this.elements.searchSuggestions.classList.remove('show');
            }
            return;
        }
        
        try {
            const suggestionsUrl = `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' plante')}&format=json&origin=*&srlimit=5`;
            const response = await fetch(suggestionsUrl);
            const data = await response.json();
            
            if (data.query.search.length > 0) {
                this.elements.searchSuggestions.innerHTML = data.query.search.map(item => `
                    <div class="suggestion-item" data-title="${item.title}">
                        <span class="suggestion-icon">🌿</span>
                        <div class="suggestion-text">
                            <div>${item.title}</div>
                            <div class="suggestion-meta">${item.snippet.replace(/<[^>]*>/g, '').substring(0, 60)}...</div>
                        </div>
                    </div>
                `).join('');
                
                this.elements.searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const title = item.getAttribute('data-title');
                        this.elements.searchInput.value = title;
                        this.elements.searchSuggestions.classList.remove('show');
                        this.searchPlant();
                    });
                });
                
                this.elements.searchSuggestions.classList.add('show');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des suggestions:', error);
        }
    },
    
    showToast(message, type = 'info', duration = 3000) {
        if (!this.elements.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">${message}</div>
            <button class="toast-close">×</button>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) this.elements.toastContainer.removeChild(toast);
            }, 300);
        });
        
        if (duration > 0) {
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.classList.remove('show');
                    setTimeout(() => {
                        if (toast.parentNode) {
                            this.elements.toastContainer.removeChild(toast);
                        }
                    }, 300);
                }
            }, duration);
        }
    },
    
    showFavorites() {
        if (this.state.favorites.length === 0) {
            this.elements.searchResults.innerHTML = `
                <div class="no-results-container">
                    <div class="no-results-icon">❤️</div>
                    <p class="no-results">Aucun favori pour le moment</p>
                    <p class="no-results-sub">Ajoutez des articles à vos favoris en cliquant sur le bouton cœur lors de la lecture.</p>
                </div>
            `;
            return;
        }
        
        this.elements.searchResults.innerHTML = `
            <div class="results-header">
                <h2>❤️ Mes favoris (${this.state.favorites.length})</h2>
            </div>
            <div class="results-container">
                ${this.state.favorites.map(fav => `
                    <div class="result-item favorite-item" data-page-id="${fav.id}" data-title="${fav.title}">
                        <div class="image-container">
                            <div class="favorite-icon">🌿</div>
                        </div>
                        <div class="result-content">
                            <h3><a href="#" class="article-link" data-page-id="${fav.id}" data-title="${fav.title}">${fav.title}</a></h3>
                            <p class="snippet">Ajouté à vos favoris le ${new Date(fav.date).toLocaleDateString('fr-FR')}</p>
                            <div class="result-actions">
                                <a href="#" class="read-more article-link" data-page-id="${fav.id}" data-title="${fav.title}">📖 Lire l'article</a>
                                <button class="remove-favorite" data-page-id="${fav.id}">🗑️ Supprimer</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        const articleLinks = this.elements.searchResults.querySelectorAll('.article-link');
        articleLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.state.currentSearchResults = this.elements.searchResults.innerHTML;
                const pageId = link.getAttribute('data-page-id');
                const title = link.getAttribute('data-title');
                this.showWikipediaArticle(pageId, title);
            });
        });
        
        const removeButtons = this.elements.searchResults.querySelectorAll('.remove-favorite');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const pageId = btn.getAttribute('data-page-id');
                this.toggleFavorite(pageId, '');
                this.showFavorites();
            });
        });
    },
    
    showHelp() {
        if (this.elements.helpModal) {
            this.elements.helpModal.classList.add('show');
        }
    },
    
    hideHelp() {
        if (this.elements.helpModal) {
            this.elements.helpModal.classList.remove('show');
        }
    },
    
    async searchPlant() {
        const query = this.elements.searchInput.value.trim();
        if (query === '') {
            this.elements.searchResults.innerHTML = '<p class="error">⚠️ Veuillez entrer un terme de recherche.</p>';
            return;
        }
        
        this.elements.searchResults.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p class="loading">Recherche en cours...</p>
            </div>
        `;
        
        try {
            const searchUrl = `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' plante')}&format=json&origin=*&srlimit=10`;
            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();
            
            if (searchData.query.search.length === 0) {
                this.elements.searchResults.innerHTML = `
                    <div class="no-results-container">
                        <div class="no-results-icon">🔍</div>
                        <p class="no-results">Aucun résultat trouvé pour "${query}"</p>
                        <p class="no-results-sub">Essayez avec un autre terme de recherche ou consultez nos suggestions populaires.</p>
                    </div>
                `;
                return;
            }
            
            this.elements.searchResults.innerHTML = `
                <div class="results-header">
                    <h2>📚 Résultats pour "${query}" (${searchData.query.search.length})</h2>
                </div>
                <div class="results-container"></div>
            `;
            const resultsContainer = this.elements.searchResults.querySelector('.results-container');
            
            searchData.query.search.forEach((result, index) => {
                const pageUrl = `https://fr.wikipedia.org/?curid=${result.pageid}`;
                const snippet = result.snippet.replace(/<span class="searchmatch">/g, '<strong>').replace(/<\/span>/g, '</strong>');
                
                const resultElement = document.createElement('div');
                resultElement.className = 'result-item';
                resultElement.style.animationDelay = `${index * 0.1}s`;
                
                resultElement.innerHTML = `
                    <div class="image-container">
                        <div class="image-placeholder">
                            <div class="skeleton"></div>
                        </div>
                    </div>
                    <div class="result-content">
                        <h3><a href="#" class="article-link" data-page-id="${result.pageid}" data-title="${result.title}">${result.title}</a></h3>
                        <p class="snippet">${snippet}...</p>
                        <div class="result-actions">
                            <a href="#" class="read-more article-link" data-page-id="${result.pageid}" data-title="${result.title}">📖 Lire l'article</a>
                            <a href="${pageUrl}" class="external-link" target="_blank" rel="noopener noreferrer">🔗 Voir sur Wikipédia</a>
                        </div>
                    </div>
                `;
                
                resultsContainer.appendChild(resultElement);
                
                this.fetchPlantImage(result.pageid, resultElement, result.title);
                
                const articleLinks = resultElement.querySelectorAll('.article-link');
                articleLinks.forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const pageId = link.getAttribute('data-page-id');
                        const title = link.getAttribute('data-title');
                        this.showWikipediaArticle(pageId, title);
                    });
                });
            });
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            this.elements.searchResults.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <p class="error">Une erreur est survenue lors de la recherche</p>
                    <p class="error-sub">Veuillez vérifier votre connexion et réessayer.</p>
                    <button class="retry-button" onclick="location.reload()">🔄 Réessayer</button>
                </div>
            `;
        }
    },
    
    async fetchPlantImage(pageId, resultElement, title) {
        try {
            const imageUrl = `https://fr.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&pithumbsize=400&pageids=${pageId}&origin=*`;
            const imageResponse = await fetch(imageUrl);
            const imageData = await imageResponse.json();
            
            const page = imageData.query.pages[pageId];
            const imageSrc = page.thumbnail ? page.thumbnail.source : 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/400px-No-Image-Placeholder.svg.png';
            
            const imageContainer = resultElement.querySelector('.image-container');
            if (imageContainer) {
                imageContainer.innerHTML = `<img src="${imageSrc}" alt="${title}" class="plant-image" loading="lazy">`;
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'image:', error);
            const imageContainer = resultElement.querySelector('.image-container');
            if (imageContainer) {
                imageContainer.innerHTML = '<div class="no-image">🌿</div>';
            }
        }
    },
    
    goBackToResults() {
        if (this.state.currentSearchResults) {
            this.elements.searchResults.innerHTML = this.state.currentSearchResults;
            
            const articleLinks = this.elements.searchResults.querySelectorAll('.article-link');
            articleLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const pageId = link.getAttribute('data-page-id');
                    const title = link.getAttribute('data-title');
                    this.showWikipediaArticle(pageId, title);
                });
            });
        } else {
            location.reload();
        }
    },
    
    async showWikipediaArticle(pageId, title) {
        if (!this.state.currentSearchResults && this.elements.searchResults.querySelector('.results-container')) {
            this.state.currentSearchResults = this.elements.searchResults.innerHTML;
        }
        
        this.elements.searchResults.innerHTML = `
            <div class="article-loading">
                <div class="spinner"></div>
                <p>Chargement de l'article "${title}"...</p>
            </div>
        `;
        
        try {
            const contentUrl = `https://fr.wikipedia.org/w/api.php?action=parse&format=json&pageid=${pageId}&prop=text&origin=*&disabletoc=true`;
            const contentResponse = await fetch(contentUrl);
            const contentData = await contentResponse.json();
            
            if (contentData.parse && contentData.parse.text) {
                let articleContent = contentData.parse.text['*'];
                
                articleContent = articleContent.replace(/<span class="mw-editsection">.*?<\/span>/g, '');
                articleContent = articleContent.replace(/href="\/wiki\//g, 'href="https://fr.wikipedia.org/wiki/');
                articleContent = articleContent.replace(/src="\/\//g, 'src="https://');
                
                this.elements.searchResults.innerHTML = `
                    <div class="article-container">
                        <div class="article-header">
                            <button class="back-button" id="backToResults">
                                <span>← Retour aux résultats</span>
                            </button>
                            <h1 class="article-title">${title}</h1>
                            <div class="article-meta">
                                <span class="source-info">📚 Source: Wikipédia</span>
                                <div class="article-controls">
                                    <button class="article-control-btn" id="favoriteBtn" data-page-id="${pageId}" data-title="${title}">
                                        ❤️ Favoris
                                    </button>
                                    <button class="article-control-btn" id="speechBtn">
                                        🔊 Écouter
                                    </button>
                                    <button class="article-control-btn" id="printBtn">
                                        🖨️ Imprimer
                                    </button>
                                    <a href="https://fr.wikipedia.org/?curid=${pageId}" target="_blank" class="external-link">🔗 Version complète</a>
                                </div>
                            </div>
                        </div>
                        <div class="article-content">${articleContent}</div>
                    </div>
                `;
                
                // Gérer les liens internes
                const articleLinks = this.elements.searchResults.querySelectorAll('.article-content a[href*="wikipedia.org/wiki/"]');
                articleLinks.forEach(link => {
                    link.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const wikiUrl = link.href;
                        const pageName = wikiUrl.split('/wiki/')[1];
                        
                        try {
                            const pageInfoUrl = `https://fr.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageName)}&format=json&origin=*`;
                            const pageInfoResponse = await fetch(pageInfoUrl);
                            const pageInfoData = await pageInfoResponse.json();
                            const pages = pageInfoData.query.pages;
                            const linkedPageId = Object.keys(pages)[0];
                            const linkedPageTitle = pages[linkedPageId].title;
                            
                            if (linkedPageId !== '-1') {
                                this.showWikipediaArticle(linkedPageId, linkedPageTitle);
                            }
                        } catch (error) {
                            console.error('Erreur lors de la navigation:', error);
                            window.open(wikiUrl, '_blank');
                        }
                    });
                });
                
                // Bouton retour
                const backButton = document.getElementById('backToResults');
                if (backButton) {
                    backButton.addEventListener('click', () => this.goBackToResults());
                }
                
                // Bouton favoris
                const favoriteBtn = document.getElementById('favoriteBtn');
                if (favoriteBtn) {
                    const isFavorited = this.state.favorites.some(fav => fav.id === pageId);
                    if (isFavorited) {
                        favoriteBtn.classList.add('favorited');
                        favoriteBtn.innerHTML = '♥️ Favori ajouté';
                    }
                    
                    favoriteBtn.addEventListener('click', () => {
                        const added = this.toggleFavorite(pageId, title);
                        if (added) {
                            favoriteBtn.classList.add('favorited');
                            favoriteBtn.innerHTML = '♥️ Favori ajouté';
                            this.showToast(`"${title}" ajouté aux favoris`, 'success');
                        } else {
                            favoriteBtn.classList.remove('favorited');
                            favoriteBtn.innerHTML = '❤️ Favoris';
                            this.showToast(`"${title}" supprimé des favoris`, 'info');
                        }
                    });
                }
                
                // Bouton lecture audio
                const speechBtn = document.getElementById('speechBtn');
                if (speechBtn) {
                    speechBtn.addEventListener('click', () => {
                        if (window.speechSynthesis.speaking) {
                            this.stopSpeech();
                            speechBtn.textContent = '🔊 Écouter';
                            speechBtn.classList.remove('active');
                            this.showToast('Lecture audio arrêtée', 'info');
                        } else {
                            const articleText = document.querySelector('.article-content');
                            if (articleText) {
                                const textToRead = title + '. ' + articleText.textContent;
                                this.startSpeech(textToRead);
                                speechBtn.textContent = '🔊 Arrêter';
                                speechBtn.classList.add('active');
                                this.showToast('Début de la lecture audio', 'success');
                            } else {
                                this.showToast('Impossible de lire cet article', 'error');
                            }
                        }
                    });
                }
                
                // Bouton imprimer
                const printBtn = document.getElementById('printBtn');
                if (printBtn) {
                    printBtn.addEventListener('click', () => {
                        window.print();
                    });
                }
                
                // Ajouter à l'historique
                this.addToHistory(pageId, title);
                
                // Scroll vers le haut
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
            } else {
                throw new Error('Contenu de l\'article non disponible');
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'article:', error);
            this.elements.searchResults.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <p class="error">Erreur lors du chargement de l'article</p>
                    <p class="error-sub">L'article "${title}" n'a pas pu être chargé.</p>
                    <div class="error-actions">
                        <button class="retry-button" id="backToResultsError">← Retour aux résultats</button>
                        <a href="https://fr.wikipedia.org/?curid=${pageId}" target="_blank" class="external-link">🔗 Voir sur Wikipédia</a>
                    </div>
                </div>
            `;
            
            const backButtonError = document.getElementById('backToResultsError');
            if (backButtonError) {
                backButtonError.addEventListener('click', () => this.goBackToResults());
            }
        }
    },
    
    addToHistory(pageId, title) {
        const historyItem = { id: pageId, title: title, timestamp: Date.now() };
        this.state.navigationHistory = this.state.navigationHistory.filter(item => item.id !== pageId);
        this.state.navigationHistory.unshift(historyItem);
        
        if (this.state.navigationHistory.length > 20) {
            this.state.navigationHistory = this.state.navigationHistory.slice(0, 20);
        }
        
        localStorage.setItem('plantHistory', JSON.stringify(this.state.navigationHistory));
    }
};

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    OpenFarm.init();
});
