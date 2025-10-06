// js/CommandPalette.js

const CommandPalette = (() => {
    // Referências aos elementos do DOM
    let overlayEl, searchInputEl, resultsEl, fabEl;

    // Constantes e Estado
    const POWER_TAB_ID = 'rapidos-tab-id'; // MODIFICADO: Nome da constante para clareza
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
        fabEl = document.getElementById('open-palette-fab');

        if (!overlayEl || !searchInputEl || !resultsEl || !fabEl) {
            console.error('Elementos da Paleta de Comandos não encontrados no DOM. A funcionalidade não será ativada.');
            return;
        }

        // Insere o ícone de raio no botão flutuante (FAB)
        fabEl.innerHTML = ICON_LIGHTNING;

        // Listener global para o atalho de teclado
        document.addEventListener('keydown', handleGlobalKeyDown);

        // Listeners para a própria paleta e o FAB
        fabEl.addEventListener('click', open);
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
     * Manipula o atalho global (Ctrl+Alt+P) e o 'Escape' para fechar.
     */
    function handleGlobalKeyDown(event) {
        if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'p') {
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
     * Filtra os modelos da aba "Power" e renderiza a lista de resultados.
     */
    function filterAndRenderResults(query) {
        const lowerCaseQuery = query.toLowerCase();
        
        // Acessa o estado global da aplicação para buscar os modelos corretos
        currentResults = appState.models.filter(model => {
            return model.tabId === POWER_TAB_ID && model.name.toLowerCase().includes(lowerCaseQuery);
        });

        resultsEl.innerHTML = ''; // Limpa resultados anteriores
        selectedIndex = currentResults.length > 0 ? 0 : -1;

        if (currentResults.length === 0) {
            const li = document.createElement('li');
            li.className = 'cp-result-item-empty';
            // MODIFICADO: Mensagem atualizada para "Power"
            li.textContent = query ? 'Nenhum resultado encontrado.' : 'Nenhum modelo na aba Power ⚡.';
            resultsEl.appendChild(li);
        } else {
            currentResults.forEach((model, index) => {
                const li = document.createElement('li');
                li.className = 'cp-result-item';
                li.textContent = model.name;
                li.dataset.modelId = model.id;
                li.setAttribute('role', 'option');

                // Lógica de classes modificada para diferenciar variáveis de sistema
                if (model.isSystemVariable) {
                    li.classList.add('cp-result-item--system-variable');
                    li.title = 'Variável de Sistema: ' + model.name;
                } else if (isPowerVariable(model)) {
                    li.classList.add('cp-result-item--power-variable');
                    li.title = 'Inserir variável: ' + model.name;
                }

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
     * Ação final: chama a função global para inserir o conteúdo e fecha a paleta.
     */
    function selectResult(model) {
        if (model) {
            // A função insertModelContent já sabe como processar variáveis,
            // então não precisamos de uma nova função. Ela vai lidar
            // perfeitamente com um modelo que só tem uma variável.
            insertModelContent(model);
        }
        close();
    }

    // Expõe as funções publicamente
    return {
        init,
        open
    };
})();
