// js/CommandPalette.js

const CommandPalette = (() => {
    // Referências aos elementos do DOM
    let overlayEl, searchInputEl, resultsEl;

    // Constantes e Estado
    const RAPIDOS_TAB_ID = 'rapidos-tab-id';
    let isOpen = false;
    let selectedIndex = -1;
    let currentResults = [];

    /**
     * Inicializa o módulo, captura os elementos do DOM e anexa os listeners principais.
     */
    function init() {
        overlayEl = document.getElementById('command-palette-overlay');
        searchInputEl = document.getElementById('command-palette-search');
        resultsEl = document.getElementById('command-palette-results');

        if (!overlayEl || !searchInputEl || !resultsEl) {
            console.error('Elementos da Paleta de Comandos não encontrados no DOM. A funcionalidade não será ativada.');
            return;
        }

        // Listener global para o atalho de teclado
        document.addEventListener('keydown', handleGlobalKeyDown);

        // Listeners para a própria paleta
        overlayEl.addEventListener('click', (e) => {
            if (e.target === overlayEl) close();
        });
        searchInputEl.addEventListener('input', handleSearchInput);
        searchInputEl.addEventListener('keydown', handleResultNavigation);
    }

    /**
     * Abre a paleta de comandos.
     */
    function open() {
        if (isOpen) return;
        isOpen = true;
        overlayEl.classList.add('visible');
        searchInputEl.focus();
        filterAndRenderResults(''); // Mostra todos os modelos rápidos ao abrir
    }

    /**
     * Fecha a paleta de comandos e limpa seu estado.
     */
    function close() {
        if (!isOpen) return;
        isOpen = false;
        overlayEl.classList.remove('visible');
        searchInputEl.value = '';
        resultsEl.innerHTML = '';
        selectedIndex = -1;
        currentResults = [];
        // Devolve o foco ao editor principal
        if (tinymce.activeEditor) {
            tinymce.activeEditor.focus();
        }
    }

    /**
     * Manipula o atalho global (Shift+P) e o 'Escape' para fechar.
     */
    function handleGlobalKeyDown(event) {
        // Novo atalho: Shift + P
        if (event.shiftKey && (event.key === 'P' || event.key === 'p')) {
            event.preventDefault();
            open();
        }

        // Fechar com a tecla 'Escape'
        if (isOpen && event.key === 'Escape') {
            close();
        }
    }

    /**
     * Chamado sempre que o usuário digita no campo de busca.
     */
    function handleSearchInput() {
        const query = searchInputEl.value;
        filterAndRenderResults(query);
    }

    /**
     * Manipula a navegação com as setas e a seleção com 'Enter'.
     */
    function handleResultNavigation(event) {
        if (currentResults.length === 0) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                selectedIndex = (selectedIndex + 1) % currentResults.length;
                updateSelection();
                break;
            case 'ArrowUp':
                event.preventDefault();
                selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
                updateSelection();
                break;
            case 'Enter':
                event.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
                    selectResult(currentResults[selectedIndex]);
                }
                break;
        }
    }
    
    /**
     * Filtra os modelos da aba "Rápidos" e renderiza a lista de resultados.
     */
    function filterAndRenderResults(query) {
        const lowerCaseQuery = query.toLowerCase();
        
        // Acessa o estado global da aplicação
        currentResults = appState.models.filter(model => {
            return model.tabId === RAPIDOS_TAB_ID && model.name.toLowerCase().includes(lowerCaseQuery);
        });

        resultsEl.innerHTML = ''; // Limpa resultados anteriores
        selectedIndex = currentResults.length > 0 ? 0 : -1;

        if (currentResults.length === 0) {
            const li = document.createElement('li');
            li.className = 'cp-result-item-empty';
            li.textContent = query ? 'Nenhum resultado encontrado.' : 'Nenhum modelo na aba Rápidos ⚡.';
            resultsEl.appendChild(li);
        } else {
            currentResults.forEach((model, index) => {
                const li = document.createElement('li');
                li.className = 'cp-result-item';
                li.textContent = model.name;
                li.dataset.modelId = model.id;
                li.setAttribute('role', 'option');
                if (index === selectedIndex) {
                    li.classList.add('selected');
                    li.setAttribute('aria-selected', 'true');
                }
                
                // Listener para seleção com clique
                li.addEventListener('click', () => selectResult(model));
                
                resultsEl.appendChild(li);
            });
        }
    }

    /**
     * Atualiza a classe 'selected' nos itens da lista para feedback visual.
     */
    function updateSelection() {
        resultsEl.querySelectorAll('.cp-result-item').forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('selected');
                item.setAttribute('aria-selected', 'true');
                // Garante que o item selecionado esteja visível na rolagem
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
                item.setAttribute('aria-selected', 'false');
            }
        });
    }

    /**
     * Ação final: insere o conteúdo do modelo no editor e fecha a paleta.
     */
    function selectResult(model) {
        if (tinymce.activeEditor && model.content) {
            tinymce.activeEditor.execCommand('mceInsertContent', false, model.content);
        }
        close();
    }

    // Expõe as funções públicas do módulo
    return {
        init,
        open,
        close
    };
})();

// Para ser chamado em script.js dentro do DOMContentLoaded
// Ex: window.CommandPalette = CommandPalette;
//     CommandPalette.init();
