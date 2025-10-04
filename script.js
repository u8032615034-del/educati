// Initialisation de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 1.0,
    canvas = document.getElementById('pdfCanvas'),
    ctx = canvas.getContext('2d');

// Éléments d'interface utilisateur
const pageNumElement = document.getElementById('pageNum'),
      pageCountElement = document.getElementById('pageCount'),
      zoomLevelElement = document.getElementById('zoomLevel'),
      fileInput = document.getElementById('fileInput'),
      prevPageBtn = document.getElementById('prevPage'),
      nextPageBtn = document.getElementById('nextPage'),
      pageInput = document.getElementById('pageInput'),
      zoomInBtn = document.getElementById('zoomIn'),
      zoomOutBtn = document.getElementById('zoomOut'),
      uploadBtn = document.getElementById('uploadBtn'),
      changeDocBtn = document.getElementById('changeDocumentBtn');

// Fonction pour rendre une page PDF
function renderPage(num) {
    pageRendering = true;
    
    // Utilise la promesse pour récupérer la page
    pdfDoc.getPage(num).then(function(page) {
        // Définit l'échelle pour s'adapter à la largeur du conteneur
        const viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Rend la page PDF dans le contexte du canvas
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };

        const renderTask = page.render(renderContext);

        // Met à jour le compteur de pages
        renderTask.promise.then(function() {
            pageRendering = false;
            pageNumElement.textContent = num;
            zoomLevelElement.textContent = Math.round(scale * 100) + '%';
            
            // Active/désactive les boutons de navigation selon la page actuelle
            prevPageBtn.disabled = num <= 1;
            nextPageBtn.disabled = num >= pdfDoc.numPages;
            
            // Met à jour la valeur de l'input
            pageInput.value = num;
            
            if (pageNumPending !== null) {
                // Nouveau rendu avec la page en attente
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });
}

// Fonction pour afficher la page précédente
function onPrevPage() {
    if (pageNum <= 1) {
        return;
    }
    pageNum--;
    queueRenderPage(pageNum);
}

// Fonction pour afficher la page suivante
function onNextPage() {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
}

// Fonction pour mettre en file d'attente le rendu d'une page
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// Fonction pour zoomer
function zoom(factor) {
    const oldScale = scale;
    scale = Math.max(0.5, Math.min(scale + factor, 3.0));
    
    // Recalcule le numéro de page pour maintenir la position
    if (scale !== oldScale) {
        const oldPage = pageNum;
        renderPage(oldPage);
    }
}

// Fonction pour charger un fichier PDF
function loadPDF(file) {
    if (file && file.type === 'application/pdf') {
        const fileReader = new FileReader();
        
        fileReader.onload = function() {
            const typedArray = new Uint8Array(this.result);
            
            // Charge le document PDF
            pdfjsLib.getDocument(typedArray).promise.then(function(pdf) {
                pdfDoc = pdf;
                pageCountElement.textContent = pdf.numPages;
                
                // Réinitialise les variables
                pageNum = 1;
                
                // Affiche la première page
                renderPage(pageNum);
                
                // Cache le bouton de téléchargement et affiche le bouton de changement
                uploadBtn.parentNode.style.display = 'none';
                changeDocBtn.style.display = 'inline-block';
                
            }).catch(function(error) {
                console.error('Erreur lors du chargement du PDF:', error);
                alert('Erreur lors du chargement du PDF. Veuillez réessayer avec un fichier valide.');
            });
        };
        
        fileReader.readAsArrayBuffer(file);
    } else {
        alert('Veuillez sélectionner un fichier PDF valide.');
    }
}

// Gestionnaire d'événements pour le changement de fichier
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    loadPDF(file);
});

// Gestionnaire pour le bouton de changement de document
changeDocBtn.addEventListener('click', function() {
    // Réinitialise l'input file pour permettre de sélectionner le même fichier
    fileInput.value = '';
    // Affiche à nouveau le bouton de téléchargement
    uploadBtn.parentNode.style.display = 'block';
    changeDocBtn.style.display = 'none';
    // Efface le PDF actuel
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pageNumElement.textContent = '-';
    pageCountElement.textContent = '-';
    pdfDoc = null;
});

// Gestionnaires d'événements pour les boutons
prevPageBtn.addEventListener('click', onPrevPage);
nextPageBtn.addEventListener('click', onNextPage);

// Navigation au clavier
document.addEventListener('keydown', function(e) {
    if (!pdfDoc) return;
    
    switch(e.key) {
        case 'ArrowLeft':
        case 'PageUp':
            onPrevPage();
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'PageDown':
            onNextPage();
            e.preventDefault();
            break;
    }
});

// Aller à une page spécifique
pageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && pdfDoc) {
        const pageNumber = parseInt(this.value);
        if (pageNumber > 0 && pageNumber <= pdfDoc.numPages) {
            pageNum = pageNumber;
            queueRenderPage(pageNum);
        } else {
            alert(`Veuillez entrer un numéro de page entre 1 et ${pdfDoc.numPages}`);
            this.value = pageNum;
        }
    }
});

// Zoom
zoomInBtn.addEventListener('click', function() {
    zoom(0.2);
});

zoomOutBtn.addEventListener('click', function() {
    zoom(-0.2);
});

// Message d'accueil
console.log('Lecteur PDF prêt ! Chargez un fichier PDF pour commencer.');
