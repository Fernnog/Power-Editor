// js/CommandPalette.js

const CommandPalette = (() => {
    // --- Referências aos Elementos do DOM ---
    let overlay;
    let searchInput;
    let resultsList;
    let paletteContainer;

    // --- Estado Interno do Módulo ---
    let isOpen = false;
    let currentResults = [];
    let selectedIndex = -1;
    let rapidosTabId = null; // Será configurado no init

    /**
     * Inicializa o módulo, busca os elementos do DOM e anexa o listener global.
     * @param {object} config - Objeto de configuração.
     * @param {string} config.rapidosTabId - O ID da aba especial de modelos rápidos.
     */
    function init(config) {
        rapidosTabId = config.rapidosTabId;

        // Busca os elementos do DOM
        overlay = document.getElementById('command-palette-overlay');
        searchInput = document.getElementById('command-palette-search');
        resultsList = document.getElementById('command-palette-results');
        paletteContainer = document.getElementById('command-palette');

        if (!overlay || !searchInput || !resultsList || !paletteContainer) {
            console.error("Elementos da Paleta de Comandos não encontrados no DOM. A funcionalidade não será iniciada.");
            return;
        }

        // Anexa o listener para o atalho global
        _attachGlobalListeners();
    }

    /** Anexa listeners globais, como o atalho de teclado. */
    function _attachGlobalListeners() {
        document.addEventListener('keydown', (e) => {
            // Atalho: Ctrl+K (Windows/Linux) ou Cmd+K (Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                isOpen ? close() : open();
            }
        });
    }

    /** Anexa listeners específicos que só devem funcionar quando a paleta está aberta. */
    function _attachPaletteListeners() {
        overlay.addEventListener('click', _handleOverlayClick);
        searchInput.addEventListener('input', _filterAndRender);
        searchInput.addEventListener('keydown', _handleKeyDown);
        resultsList.addEventListener('click', _handleResultClick);
    }

    /** Remove os listeners para evitar execuções desnecessárias quando a paleta está fechada. */
    function _removePaletteListeners() {
        overlay.removeEventListener('click', _handleOverlayClick);
        searchInput.removeEventListener('input', _filterAndRender);
        searchInput.removeEventListener('keydown', _handleKeyDown);
        resultsList.removeEventListener('click', _handleResultClick);
    }

    /** Abre a paleta de comandos. */
    function open() {
        if (isOpen) return;
        isOpen = true;

        overlay.classList.add('visible');
        _attachPaletteListeners();
        _filterAndRender(); // Renderiza a lista inicial (todos os modelos rápidos)
        searchInput.focus();
    }

    /** Fecha a paleta de comandos e limpa seu estado. */
    function close() {
        if (!isOpen) return;
        isOpen = false;

        overlay.classList.remove('visible');
        _removePaletteListeners();

        // Limpa o estado para a próxima abertura
        searchInput.value = '';
        resultsList.innerHTML = '';
        currentResults = [];
        selectedIndex = -1;
    }

    /** Filtra os modelos da aba "Rápidos" e renderiza os resultados. */
    function _filterAndRender() {
        const query = searchInput.value.toLowerCase().trim();
        
        // Filtra os modelos que pertencem à aba "Rápidos"
        const rapidosModels = appState.models.filter(model => model.tabId === rapidosTabId);

        // Filtra por nome se houver uma query
        currentResults = query
            ? rapidosModels.filter(model => model.name.toLowerCase().includes(query))
            : rapidosModels;

        _renderResults();
    }

    /** Renderiza a lista de resultados no HTML. */
    function _renderResults() {
        resultsList.innerHTML = ''; // Limpa a lista anterior
        selectedIndex = currentResults.length > 0 ? 0 : -1; // Reseta a seleção

        currentResults.forEach((model, index) => {
            const li = document.createElement('li');
            li.className = 'cp-result-item';
            li.textContent = model.name;
            li.dataset.index = index; // Armazena o índice para o evento de clique
            resultsList.appendChild(li);
        });

        _updateSelection();
    }

    /** Atualiza a classe 'selected' no item da lista para feedback visual. */
    function _updateSelection() {
        // Remove a seleção de todos os itens
        resultsList.querySelectorAll('.cp-result-item').forEach(item => {
            item.classList.remove('selected');
        });

        if (selectedIndex > -1) {
            const selectedItem = resultsList.querySelector(`[data-index="${selectedIndex}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected');
                // Garante que o item selecionado esteja sempre visível na rolagem
                selectedItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }

    /** Seleciona e insere o modelo no editor. */
    function _confirmSelection() {
        if (selectedIndex > -1 && currentResults[selectedIndex]) {
            const selectedModel = currentResults[selectedIndex];
            
            // Reutiliza a função global de inserção que já lida com variáveis dinâmicas
            if (typeof insertModelContent === 'function') {
                insertModelContent(selectedModel.content);
            } else {
                console.error("A função 'insertModelContent' não foi encontrada.");
            }
            
            close();
        }
    }

    // --- HANDLERS DE EVENTOS ---

    /** Gerencia a navegação por teclado dentro da paleta. */
    function _handleKeyDown(e) {
        if (currentResults.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % currentResults.length;
                _updateSelection();
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
                _updateSelection();
                break;
            case 'Enter':
                e.preventDefault();
                _confirmSelection();
                break;
            case 'Escape':
                close();
                break;
        }
    }
    
    /** Fecha a paleta se o clique for no overlay (fora da caixa de diálogo). */
    function _handleOverlayClick(e) {
        if (e.target === overlay) {
            close();
        }
    }
    
    /** Gerencia o clique direto em um item da lista. */
    function _handleResultClick(e) {
        const targetItem = e.target.closest('.cp-result-item');
        if (targetItem) {
            selectedIndex = parseInt(targetItem.dataset.index, 10);
            _confirmSelection();
        }
    }

    // Expõe apenas a função de inicialização pública
    return {
        init
    };
})();