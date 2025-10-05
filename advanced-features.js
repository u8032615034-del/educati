// OpenFarm - Fonctionnalités Avancées
// Système de cache, statistiques, notes, export PDF

// ==================== SYSTÈME DE CACHE ====================
const CacheManager = {
    cacheDuration: 3600000, // 1 heure en millisecondes
    
    set(key, value) {
        const cacheData = {
            value: value,
            timestamp: Date.now()
        };
        try {
            localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
        } catch (e) {
            console.error('Erreur cache:', e);
        }
    },
    
    get(key) {
        try {
            const cached = localStorage.getItem(`cache_${key}`);
            if (!cached) return null;
            
            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;
            
            if (age < this.cacheDuration) {
                return cacheData.value;
            } else {
                this.remove(key);
                return null;
            }
        } catch (e) {
            return null;
        }
    },
    
    remove(key) {
        localStorage.removeItem(`cache_${key}`);
    },
    
    clear() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('cache_')) {
                localStorage.removeItem(key);
            }
        });
    },
    
    getSize() {
        let size = 0;
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('cache_')) {
                size += localStorage.getItem(key).length;
            }
        });
        return (size / 1024).toFixed(2); // Retourne la taille en Ko
    }
};

// ==================== SYSTÈME DE STATISTIQUES ====================
const StatsManager = {
    init() {
        if (!localStorage.getItem('userStats')) {
            this.reset();
        }
    },
    
    reset() {
        const stats = {
            totalSearches: 0,
            totalArticlesRead: 0,
            totalTimeSpent: 0,
            searchHistory: [],
            readArticles: [],
            favoriteCategories: {},
            lastVisit: Date.now(),
            firstVisit: Date.now(),
            sessionsCount: 1
        };
        localStorage.setItem('userStats', JSON.stringify(stats));
    },
    
    get() {
        return JSON.parse(localStorage.getItem('userStats') || '{}');
    },
    
    incrementSearches(query) {
        const stats = this.get();
        stats.totalSearches++;
        stats.searchHistory.unshift({
            query: query,
            timestamp: Date.now()
        });
        // Garder seulement les 50 dernières recherches
        if (stats.searchHistory.length > 50) {
            stats.searchHistory = stats.searchHistory.slice(0, 50);
        }
        localStorage.setItem('userStats', JSON.stringify(stats));
    },
    
    addArticleRead(pageId, title) {
        const stats = this.get();
        stats.totalArticlesRead++;
        
        // Éviter les doublons récents
        const existingIndex = stats.readArticles.findIndex(a => a.id === pageId);
        if (existingIndex > -1) {
            stats.readArticles.splice(existingIndex, 1);
        }
        
        stats.readArticles.unshift({
            id: pageId,
            title: title,
            timestamp: Date.now()
        });
        
        // Garder seulement les 50 derniers articles
        if (stats.readArticles.length > 50) {
            stats.readArticles = stats.readArticles.slice(0, 50);
        }
        
        localStorage.setItem('userStats', JSON.stringify(stats));
    },
    
    updateTimeSpent(seconds) {
        const stats = this.get();
        stats.totalTimeSpent += seconds;
        localStorage.setItem('userStats', JSON.stringify(stats));
    },
    
    getTopSearches(limit = 5) {
        const stats = this.get();
        const searches = {};
        
        stats.searchHistory.forEach(item => {
            searches[item.query] = (searches[item.query] || 0) + 1;
        });
        
        return Object.entries(searches)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([query, count]) => ({ query, count }));
    },
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        }
        return `${minutes}min`;
    }
};

// ==================== SYSTÈME DE NOTES ====================
const NotesManager = {
    add(pageId, title, note) {
        const notes = this.getAll();
        notes[pageId] = {
            title: title,
            note: note,
            timestamp: Date.now()
        };
        localStorage.setItem('plantNotes', JSON.stringify(notes));
    },
    
    get(pageId) {
        const notes = this.getAll();
        return notes[pageId] || null;
    },
    
    getAll() {
        return JSON.parse(localStorage.getItem('plantNotes') || '{}');
    },
    
    remove(pageId) {
        const notes = this.getAll();
        delete notes[pageId];
        localStorage.setItem('plantNotes', JSON.stringify(notes));
    },
    
    has(pageId) {
        return !!this.get(pageId);
    }
};

// ==================== EXPORT PDF ====================
const PDFExporter = {
    async exportArticle(title, content) {
        try {
            // Créer un élément temporaire avec le contenu à exporter
            const printContent = document.createElement('div');
            printContent.style.cssText = 'padding: 40px; max-width: 800px; margin: 0 auto;';
            
            printContent.innerHTML = `
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="color: #2ecc71; font-size: 2.5em; margin-bottom: 10px;">${title}</h1>
                    <p style="color: #7f8c8d;">Exporté depuis OpenFarm</p>
                    <p style="color: #7f8c8d; font-size: 0.9em;">${new Date().toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                </div>
                <div style="line-height: 1.8; font-size: 14px;">
                    ${content}
                </div>
                <div style="margin-top: 60px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center; color: #7f8c8d;">
                    <p>Source: Wikipedia • OpenFarm - Encyclopédie des Plantes</p>
                </div>
            `;
            
            // Nettoyer le contenu pour le PDF
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            
            // Supprimer les éléments non désirés
            tempDiv.querySelectorAll('script, style, .mw-editsection').forEach(el => el.remove());
            
            printContent.querySelector('div[style*="line-height"]').innerHTML = tempDiv.innerHTML;
            
            // Créer une fenêtre d'impression
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${title} - OpenFarm</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: 'Arial', sans-serif; color: #2c3e50; }
                        img { max-width: 100%; height: auto; }
                        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        @media print {
                            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                            a { text-decoration: none; color: #2ecc71; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
                </html>
            `);
            
            printWindow.document.close();
            
            // Attendre que les images se chargent
            setTimeout(() => {
                printWindow.print();
            }, 500);
            
            return true;
        } catch (error) {
            console.error('Erreur export PDF:', error);
            return false;
        }
    }
};

// ==================== MODE COMPARAISON ====================
const ComparisonManager = {
    items: [],
    maxItems: 2,
    
    add(pageId, title) {
        if (this.items.length >= this.maxItems) {
            this.items.shift(); // Retirer le premier élément
        }
        
        if (!this.items.find(item => item.id === pageId)) {
            this.items.push({ id: pageId, title: title });
            this.save();
            return true;
        }
        return false;
    },
    
    remove(pageId) {
        this.items = this.items.filter(item => item.id !== pageId);
        this.save();
    },
    
    clear() {
        this.items = [];
        this.save();
    },
    
    get() {
        return this.items;
    },
    
    canCompare() {
        return this.items.length === 2;
    },
    
    save() {
        localStorage.setItem('comparison', JSON.stringify(this.items));
    },
    
    load() {
        this.items = JSON.parse(localStorage.getItem('comparison') || '[]');
    }
};

// ==================== TRACKER DE TEMPS ====================
const TimeTracker = {
    startTime: null,
    intervalId: null,
    
    start() {
        this.startTime = Date.now();
        this.intervalId = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            if (elapsed > 0 && elapsed % 60 === 0) { // Chaque minute
                StatsManager.updateTimeSpent(60);
            }
        }, 60000); // Vérifier chaque minute
    },
    
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            if (this.startTime) {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                StatsManager.updateTimeSpent(elapsed);
            }
        }
    }
};

// ==================== AMÉLIORATIONS ACCESSIBILITÉ ====================
const AccessibilityManager = {
    init() {
        // Ajouter des attributs ARIA aux éléments interactifs
        this.enhanceSearchInput();
        this.enhanceButtons();
        this.announcePageChanges();
    },
    
    enhanceSearchInput() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.setAttribute('role', 'searchbox');
            searchInput.setAttribute('aria-autocomplete', 'list');
            searchInput.setAttribute('aria-expanded', 'false');
        }
    },
    
    enhanceButtons() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            if (!button.getAttribute('aria-label') && button.textContent) {
                button.setAttribute('aria-label', button.textContent.trim());
            }
        });
    },
    
    announcePageChanges() {
        // Créer une zone ARIA live pour les annonces
        if (!document.getElementById('ariaAnnouncer')) {
            const announcer = document.createElement('div');
            announcer.id = 'ariaAnnouncer';
            announcer.setAttribute('role', 'status');
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
            document.body.appendChild(announcer);
        }
    },
    
    announce(message) {
        const announcer = document.getElementById('ariaAnnouncer');
        if (announcer) {
            announcer.textContent = message;
        }
    }
};

// ==================== UI POUR LES STATISTIQUES ====================
function showStatsModal() {
    const stats = StatsManager.get();
    const topSearches = StatsManager.getTopSearches();
    const cacheSize = CacheManager.getSize();
    
    const modal = document.createElement('div');
    modal.className = 'help-modal show';
    modal.innerHTML = `
        <div class="help-content">
            <button class="help-close" onclick="this.closest('.help-modal').remove()">×</button>
            <h2>📊 Vos Statistiques</h2>
            
            <div class="help-section">
                <h3>🔍 Activité</h3>
                <ul>
                    <li>📝 Recherches effectuées: <strong>${stats.totalSearches}</strong></li>
                    <li>📖 Articles lus: <strong>${stats.totalArticlesRead}</strong></li>
                    <li>⏱️ Temps passé: <strong>${StatsManager.formatTime(stats.totalTimeSpent)}</strong></li>
                    <li>❤️ Favoris: <strong>${JSON.parse(localStorage.getItem('plantFavorites') || '[]').length}</strong></li>
                </ul>
            </div>
            
            <div class="help-section">
                <h3>🔥 Top Recherches</h3>
                <ul>
                    ${topSearches.length > 0 ? 
                        topSearches.map(item => `<li>${item.query} <span style="color: var(--primary-color);">(${item.count}x)</span></li>`).join('') :
                        '<li>Aucune recherche encore</li>'
                    }
                </ul>
            </div>
            
            <div class="help-section">
                <h3>📚 Derniers Articles</h3>
                <ul>
                    ${stats.readArticles.slice(0, 5).map(article => 
                        `<li>${article.title} <span style="color: var(--text-light); font-size: 0.85em;">${new Date(article.timestamp).toLocaleDateString('fr-FR')}</span></li>`
                    ).join('') || '<li>Aucun article lu</li>'}
                </ul>
            </div>
            
            <div class="help-section">
                <h3>💾 Cache & Performance</h3>
                <ul>
                    <li>📦 Taille du cache: <strong>${cacheSize} Ko</strong></li>
                    <li>🗓️ Membre depuis: <strong>${new Date(stats.firstVisit).toLocaleDateString('fr-FR')}</strong></li>
                    <li>🔄 Dernière visite: <strong>${new Date(stats.lastVisit).toLocaleDateString('fr-FR')}</strong></li>
                </ul>
                <button onclick="CacheManager.clear(); OpenFarm.showToast('Cache vidé avec succès', 'success'); this.closest('.help-modal').remove();" 
                        style="margin-top: 10px; padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 20px; cursor: pointer;">
                    🗑️ Vider le cache
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ==================== UI POUR LES NOTES ====================
function showNotesModal(pageId, title) {
    const existingNote = NotesManager.get(pageId);
    
    const modal = document.createElement('div');
    modal.className = 'help-modal show';
    modal.innerHTML = `
        <div class="help-content">
            <button class="help-close" onclick="this.closest('.help-modal').remove()">×</button>
            <h2>📝 Note pour "${title}"</h2>
            
            <div class="help-section">
                <textarea id="noteInput" 
                          style="width: 100%; min-height: 150px; padding: 15px; border: 2px solid var(--border-color); border-radius: 10px; font-family: inherit; font-size: 14px; resize: vertical;"
                          placeholder="Écrivez votre note ici...">${existingNote ? existingNote.note : ''}</textarea>
                
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button onclick="saveNote('${pageId}', '${title.replace(/'/g, "\\'")}'); this.closest('.help-modal').remove();" 
                            style="flex: 1; padding: 12px; background: var(--primary-color); color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: 600;">
                        💾 Enregistrer
                    </button>
                    ${existingNote ? `
                        <button onclick="NotesManager.remove('${pageId}'); OpenFarm.showToast('Note supprimée', 'info'); this.closest('.help-modal').remove();" 
                                style="padding: 12px 20px; background: #e74c3c; color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: 600;">
                            🗑️ Supprimer
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('noteInput').focus();
}

function saveNote(pageId, title) {
    const noteInput = document.getElementById('noteInput');
    if (noteInput && noteInput.value.trim()) {
        NotesManager.add(pageId, title, noteInput.value.trim());
        OpenFarm.showToast('Note enregistrée avec succès', 'success');
    }
}

// ==================== UI POUR TOUTES LES NOTES ====================
function showAllNotes() {
    const notes = NotesManager.getAll();
    const notesArray = Object.entries(notes);
    
    const modal = document.createElement('div');
    modal.className = 'help-modal show';
    modal.innerHTML = `
        <div class="help-content">
            <button class="help-close" onclick="this.closest('.help-modal').remove()">×</button>
            <h2>📝 Mes Notes (${notesArray.length})</h2>
            
            ${notesArray.length === 0 ? `
                <div class="help-section">
                    <p style="text-align: center; color: var(--text-light);">Aucune note pour le moment</p>
                </div>
            ` : notesArray.map(([pageId, data]) => `
                <div class="help-section" style="border-bottom: 1px solid var(--border-color); padding-bottom: 15px;">
                    <h3 style="font-size: 1.1em;">${data.title}</h3>
                    <p style="color: var(--text-light); margin: 10px 0; white-space: pre-wrap;">${data.note}</p>
                    <div style="display: flex; gap: 10px; font-size: 0.85em;">
                        <span style="color: var(--text-light);">${new Date(data.timestamp).toLocaleDateString('fr-FR')}</span>
                        <button onclick="showNotesModal('${pageId}', '${data.title.replace(/'/g, "\\'")}'); this.closest('.help-modal').remove();" 
                                style="padding: 4px 12px; background: var(--primary-color); color: white; border: none; border-radius: 10px; cursor: pointer;">
                            ✏️ Modifier
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    document.body.appendChild(modal);
}

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les managers
    StatsManager.init();
    ComparisonManager.load();
    AccessibilityManager.init();
    TimeTracker.start();
    
    // Mettre à jour la dernière visite
    const stats = StatsManager.get();
    stats.lastVisit = Date.now();
    localStorage.setItem('userStats', JSON.stringify(stats));
    
    // Arrêter le tracker avant de quitter
    window.addEventListener('beforeunload', () => {
        TimeTracker.stop();
    });
});

// Exposer les fonctions globalement
window.CacheManager = CacheManager;
window.StatsManager = StatsManager;
window.NotesManager = NotesManager;
window.PDFExporter = PDFExporter;
window.ComparisonManager = ComparisonManager;
window.AccessibilityManager = AccessibilityManager;
window.showStatsModal = showStatsModal;
window.showNotesModal = showNotesModal;
window.saveNote = saveNote;
window.showAllNotes = showAllNotes;
