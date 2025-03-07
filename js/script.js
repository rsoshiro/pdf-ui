// Referências ao DOM
const menuToggle = document.getElementById('menu-toggle');
const navigation = document.getElementById('navigation');
const pdfContainer = document.getElementById('pdf-container');
const canvas = document.getElementById('pdf-render');
const prevButton = document.getElementById('prev-page');
const nextButton = document.getElementById('next-page');
const currentPageText = document.getElementById('current-page');
const totalPagesText = document.getElementById('total-pages');
const loading = document.getElementById('loading');
const navLinks = document.querySelectorAll('nav a');
const currentSectionBtn = document.getElementById('current-section-btn');
const currentSectionText = document.getElementById('current-section-text');
const sectionDropdown = document.getElementById('section-dropdown');
const closeNavButton = document.getElementById('close-nav');
const quickNavToggle = document.getElementById('quick-nav-toggle');
const dropdownLinks = document.querySelectorAll('.dropdown a');
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');
const zoomLevelText = document.getElementById('zoom-level');
const progressBar = document.getElementById('progress-bar');
const miniSectionIndicator = document.getElementById('mini-section-indicator');
const navSectionsList = document.getElementById('nav-sections-list');
const mainHeader = document.getElementById('main-header');
const mainContent = document.getElementById('main-content');

// URL do PDF
const pdfUrl = 'https://rsoshiro.github.io/church-source/Ebook_Via_Sacra_PMDP.pdf';

// Variáveis de estado
let pdfDoc = null;
let pageNum = 1;
let pagesRendering = false;
let pageNumPending = null;
let scale = 1;
let zoomLevel = 100; // em porcentagem
let viewport = null;
let context = null;
let lastScrollTop = 0;
let headerVisible = true;
let lastScrollTime = Date.now();
let scrollTimeout = null;

// Mapeamento das seções por intervalos de páginas
const sections = [
    { title: 'ORAÇÃO INICIAL', startPage: 5, endPage: 5 },
    { title: 'PRIMEIRA ESTAÇÃO', startPage: 6, endPage: 9 },
    { title: 'SEGUNDA ESTAÇÃO', startPage: 10, endPage: 13 },
    { title: 'TERCEIRA ESTAÇÃO', startPage: 14, endPage: 17 },
    { title: 'QUARTA ESTAÇÃO', startPage: 18, endPage: 21 },
    { title: 'QUINTA ESTAÇÃO', startPage: 22, endPage: 25 },
    { title: 'SEXTA ESTAÇÃO', startPage: 26, endPage: 29 },
    { title: 'SÉTIMA ESTAÇÃO', startPage: 30, endPage: 33 },
    { title: 'OITAVA ESTAÇÃO', startPage: 34, endPage: 37 },
    { title: 'NONA ESTAÇÃO', startPage: 38, endPage: 41 },
    { title: 'DÉCIMA ESTAÇÃO', startPage: 42, endPage: 45 },
    { title: 'DÉCIMA PRIMEIRA ESTAÇÃO', startPage: 46, endPage: 49 },
    { title: 'DÉCIMA SEGUNDA ESTAÇÃO', startPage: 50, endPage: 53 },
    { title: 'DÉCIMA TERCEIRA ESTAÇÃO', startPage: 54, endPage: 57 },
    { title: 'DÉCIMA QUARTA ESTAÇÃO', startPage: 58, endPage: 61 },
    { title: 'ORAÇÃO FINAL', startPage: 62, endPage: 68 },
];

// Adiciona overlay para quando o menu está aberto
const overlay = document.createElement('div');
overlay.classList.add('overlay');
document.body.appendChild(overlay);

// Inicializa o PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.7.107/pdf.worker.min.js';

// Configuração inicial
function init() {
    // Inicializa o PDF
    loadPDF();

    // Adiciona os event listeners
    setupEventListeners();

    // Ajusta a escala com base na largura do dispositivo
    updateScale();

    // Adiciona evento de resize para ajustar a escala quando a janela for redimensionada
    window.addEventListener('resize', () => {
        updateScale();
        queueRenderPage(pageNum);
    });

    // Inicializa o controle de scroll para o cabeçalho
    setupScrollHandler();
    
    // Verifica se o logo está carregado
    checkLogoLoaded();
}

// Verifica se o logo está carregado e tenta carregá-lo novamente se necessário
function checkLogoLoaded() {
    const logoImages = document.querySelectorAll('.logo img, footer img');
    
    logoImages.forEach(img => {
        if (!img.complete || img.naturalHeight === 0) {
            console.log('Logo não carregado, tentando novamente...');
            img.src = 'img/logo.png?' + new Date().getTime(); // Adiciona timestamp para evitar cache
            
            // Adiciona um placeholder temporário
            img.style.backgroundColor = '#008080';
            img.style.border = '2px solid white';
        }
    });
}

// Configura o handler de scroll para esconder/mostrar o cabeçalho
function setupScrollHandler() {
    // Detecta a direção do scroll para mostrar/esconder o cabeçalho
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    pdfContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    // Também esconde o cabeçalho quando o usuário toca no PDF (para maximizar espaço em dispositivos móveis)
    pdfContainer.addEventListener('touchstart', function() {
        if (headerVisible && pdfContainer.scrollTop > 50) {
            hideHeader();
        }
    }, { passive: true });
}

// Função para lidar com o evento de scroll
function handleScroll(e) {
    const now = Date.now();
    const scrollTop = window.scrollY || document.documentElement.scrollTop || pdfContainer.scrollTop;
    
    // Limita a frequência de verificação do scroll
    if (now - lastScrollTime > 50) {
        lastScrollTime = now;
        
        // Se estiver rolando para baixo e o cabeçalho estiver visível, esconde-o
        if (scrollTop > lastScrollTop && headerVisible && scrollTop > 50) {
            hideHeader();
        } 
        // Se estiver rolando para cima e o cabeçalho estiver escondido, mostra-o
        else if (scrollTop < lastScrollTop && !headerVisible) {
            showHeader();
        }
        
        lastScrollTop = scrollTop;
    }
    
    // Limpa o timeout anterior e define um novo
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        // Se parou de rolar por um tempo, mostra o cabeçalho
        if (!headerVisible && scrollTop < 100) {
            showHeader();
        }
    }, 1000);
}

// Esconde o cabeçalho
function hideHeader() {
    mainHeader.classList.add('header-hidden');
    mainContent.classList.add('header-hidden');
    headerVisible = false;
}

// Mostra o cabeçalho
function showHeader() {
    mainHeader.classList.remove('header-hidden');
    mainContent.classList.remove('header-hidden');
    headerVisible = true;
}

// Função para ajustar a escala baseada no tamanho da tela e no nível de zoom
function updateScale() {
    const containerWidth = pdfContainer.clientWidth;
    // Base scale é a escala que se ajusta ao tamanho do container
    const baseScale = (containerWidth - 20) / 600; // 600 é uma largura de referência para o PDF
    
    // Aplica o zoom definido pelo usuário
    scale = baseScale * (zoomLevel / 100);
    
    // Limita a escala para não ficar muito pequena em telas muito estreitas
    if (scale < 0.3) scale = 0.3;
}

// Carrega o PDF
function loadPDF() {
    loading.style.display = 'block';
    
    pdfjsLib.getDocument(pdfUrl)
        .promise
        .then(pdf => {
            pdfDoc = pdf;
            totalPagesText.textContent = pdfDoc.numPages;
            
            // Renderiza a primeira página
            renderPage(pageNum);
            
            // Ativa os botões de navegação
            prevButton.disabled = false;
            nextButton.disabled = false;
            zoomInButton.disabled = false;
            zoomOutButton.disabled = false;
        })
        .catch(error => {
            console.error('Erro ao carregar o PDF:', error);
            loading.textContent = 'Erro ao carregar o PDF. Por favor, tente novamente.';
        });
}

// Renderiza uma página específica
function renderPage(num) {
    pagesRendering = true;
    loading.style.display = 'block';
    
    // Obtém a página
    pdfDoc.getPage(num)
        .then(page => {
            // Ajusta a viewport baseada na escala
            viewport = page.getViewport({ scale });
            
            // Prepara o canvas
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            context = canvas.getContext('2d');
            
            // Renderiza o PDF no canvas
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            const renderTask = page.render(renderContext);
            
            // Espera a renderização terminar
            renderTask.promise
                .then(() => {
                    pagesRendering = false;
                    loading.style.display = 'none';
                    
                    if (pageNumPending !== null) {
                        renderPage(pageNumPending);
                        pageNumPending = null;
                    }
                    
                    // Atualiza o número da página atual
                    currentPageText.textContent = num;
                    
                    // Atualiza a seção atual
                    updateCurrentSection(num);
                    
                    // Atualiza a classe ativa nos links de navegação
                    updateActiveNavLinks();
                    
                    // Atualiza o indicador de progresso
                    updateProgressIndicator(num);
                    
                    // Scroll to top após mudança de página
                    pdfContainer.scrollTo(0, 0);
                    
                    // Mostra o cabeçalho quando muda de página
                    showHeader();
                })
                .catch(error => {
                    console.error('Erro ao renderizar a página:', error);
                    loading.textContent = 'Erro ao renderizar a página. Por favor, tente novamente.';
                });
        });
}

// Coloca a renderização da página na fila
function queueRenderPage(num) {
    if (pagesRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// Vai para a página anterior
function goPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
}

// Vai para a próxima página
function goNextPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
}

// Vai para uma página específica
function goToPage(num) {
    if (num < 1 || num > pdfDoc.numPages) return;
    pageNum = num;
    queueRenderPage(pageNum);
}

// Encontra a seção atual com base na página
function getCurrentSection(pageNumber) {
    for (const section of sections) {
        if (pageNumber >= section.startPage && pageNumber <= section.endPage) {
            return section;
        }
    }
    return { title: 'Desconhecido', startPage: 1, endPage: pdfDoc.numPages };
}

// Atualiza o texto da seção atual
function updateCurrentSection(pageNumber) {
    const section = getCurrentSection(pageNumber);
    
    // Encontra o link correspondente à seção atual
    const sectionLink = document.querySelector(`a[data-page="${section.startPage}"]`);
    
    if (sectionLink) {
        // Usa o conteúdo HTML do link para o texto da seção atual
        currentSectionText.innerHTML = sectionLink.innerHTML;
        
        // Usa o atributo data-title para o mini-indicador (mantém o formato original para acessibilidade)
        const fullTitle = sectionLink.getAttribute('data-title');
        miniSectionIndicator.textContent = fullTitle;
        
        // Atualiza aria-label para acessibilidade
        currentSectionBtn.setAttribute('aria-label', `Seção atual: ${fullTitle}`);
        quickNavToggle.setAttribute('aria-label', `Navegação rápida: ${fullTitle}`);
    } else {
        currentSectionText.textContent = section.title;
        miniSectionIndicator.textContent = section.title;
    }
}

// Atualiza o indicador de progresso no botão flutuante
function updateProgressIndicator(pageNumber) {
    const section = getCurrentSection(pageNumber);
    const totalSectionPages = section.endPage - section.startPage + 1;
    const currentPositionInSection = pageNumber - section.startPage;
    const progressPercentage = (currentPositionInSection / totalSectionPages) * 100;

    // Anima a transição da barra de progresso
    progressBar.style.width = '0%';
    
    // Usa setTimeout para criar um efeito de animação
    setTimeout(() => {
        // Atualiza a largura da barra de progresso
        progressBar.style.width = `${progressPercentage}%`;
        
        // Se estiver na primeira página da seção, mostrar 10% pelo menos para feedback visual
        if (progressPercentage === 0) {
            progressBar.style.width = '10%';
        }
    }, 50);
}

// Aumenta o nível de zoom
function zoomIn() {
    if (zoomLevel >= 200) return; // Limita o zoom máximo
    zoomLevel += 10;
    updateZoomLevel();
}

// Diminui o nível de zoom
function zoomOut() {
    if (zoomLevel <= 50) return; // Limita o zoom mínimo
    zoomLevel -= 10;
    updateZoomLevel();
}

// Atualiza o nível de zoom e re-renderiza a página
function updateZoomLevel() {
    zoomLevelText.textContent = `${zoomLevel}%`;
    updateScale();
    queueRenderPage(pageNum);
}

// Atualiza a classe ativa nos links de navegação e adiciona destaque visual
function updateActiveNavLinks() {
    const currentSection = getCurrentSection(pageNum);
    
    // Remove todos os destaques anteriores
    document.querySelectorAll('.section-highlight').forEach(el => {
        el.classList.remove('section-highlight');
    });
    
    // Atualiza links no menu lateral e destaca a seção atual
    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkPage = parseInt(link.getAttribute('data-page'));
        const linkSection = sections.find(s => s.startPage === linkPage);
        
        if (linkSection && 
            linkSection.startPage === currentSection.startPage) {
            link.classList.add('active');
            link.closest('li').classList.add('section-highlight');
        }
    });
    
    // Atualiza links no dropdown
    dropdownLinks.forEach(link => {
        link.classList.remove('active');
        const linkPage = parseInt(link.getAttribute('data-page'));
        const linkSection = sections.find(s => s.startPage === linkPage);
        
        if (linkSection && 
            linkSection.startPage === currentSection.startPage) {
            link.classList.add('active');
            link.closest('li').classList.add('section-highlight');
        }
    });
}

// Alterna a visibilidade do dropdown de seções
function toggleSectionDropdown() {
    sectionDropdown.classList.toggle('hidden');
    
    // Se estiver abrindo o dropdown, fecha a navegação lateral
    if (!sectionDropdown.classList.contains('hidden')) {
        closeMenu();
    }
}

// Configura os event listeners
function setupEventListeners() {
    // Botões de navegação principal
    menuToggle.addEventListener('click', toggleMenu);
    closeNavButton.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeAll);
    currentSectionBtn.addEventListener('click', toggleSectionDropdown);
    quickNavToggle.addEventListener('click', toggleMenu);
    
    // Botões de navegação de páginas
    prevButton.addEventListener('click', goPrevPage);
    nextButton.addEventListener('click', goNextPage);
    
    // Botões de zoom
    zoomInButton.addEventListener('click', zoomIn);
    zoomOutButton.addEventListener('click', zoomOut);
    
    // Links de navegação do índice lateral
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageTarget = parseInt(link.getAttribute('data-page'));
            goToPage(pageTarget);
            closeMenu();
        });
    });
    
    // Links do dropdown de seções
    dropdownLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageTarget = parseInt(link.getAttribute('data-page'));
            goToPage(pageTarget);
            sectionDropdown.classList.add('hidden');
        });
    });
    
    // Fecha dropdown quando clica fora dele
    document.addEventListener('click', (e) => {
        if (!sectionDropdown.classList.contains('hidden') && 
            !sectionDropdown.contains(e.target) && 
            e.target !== currentSectionBtn && 
            !currentSectionBtn.contains(e.target)) {
            sectionDropdown.classList.add('hidden');
        }
    });
    
    // Navegação por teclado
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            goPrevPage();
        } else if (e.key === 'ArrowRight') {
            goNextPage();
        } else if (e.key === 'Escape') {
            closeAll();
        }
    });
    
    // Navegação por swipe (para dispositivos touch)
    let touchStartX = 0;
    let touchEndX = 0;
    
    pdfContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    pdfContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50; // mínimo de pixels para considerar um swipe
        
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe para a esquerda (próxima página)
            goNextPage();
        }
        
        if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe para a direita (página anterior)
            goPrevPage();
        }
    }
    
    // Duplo toque para mostrar/esconder o cabeçalho
    let lastTap = 0;
    pdfContainer.addEventListener('touchend', function(e) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 300 && tapLength > 0) {
            // Duplo toque detectado
            if (headerVisible) {
                hideHeader();
            } else {
                showHeader();
            }
            e.preventDefault();
        }
        
        lastTap = currentTime;
    });
}

// Alterna a visibilidade do menu
function toggleMenu() {
    navigation.classList.toggle('hidden');
    overlay.classList.toggle('active');
    
    // Fecha o dropdown se estiver aberto
    if (!navigation.classList.contains('hidden')) {
        sectionDropdown.classList.add('hidden');
    }
}

// Fecha o menu
function closeMenu() {
    navigation.classList.add('hidden');
    overlay.classList.remove('active');
}

// Fecha todos os menus
function closeAll() {
    closeMenu();
    sectionDropdown.classList.add('hidden');
}

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    init();
    
    // Força um evento de scroll inicial para garantir que o cabeçalho seja mostrado
    setTimeout(() => {
        window.dispatchEvent(new Event('scroll'));
    }, 100);
}); 