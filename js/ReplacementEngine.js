const ReplacementEngine = (() => {
    // --- Referências de Módulo e Estado ---
    let appStateRef = null;
    let onStateChangeCallback = null;
    let editorElement = null;
    
    // --- Estado Interno ---
    let currentPage = 1;
    const itemsPerPage = 5;
    let lastReplacement = null; // Para a funcionalidade de "Desfazer"
    let undoToastTimeout = null;

    // --- Elementos do DOM ---
    const modal = document.getElementById('replace-modal');
    const searchInput = document.getElementById('replace-search-input');
    const ruleList = document.getElementById('replace-list');
    const paginationControls = document.getElementById('replace-pagination-controls');
    const addNewRuleBtn = document.getElementById('replace-add-new-rule-btn');
    const closeModalBtn = document.getElementById('replace-modal-close-btn');

    /**
     * Inicializa o módulo, conectando-o ao estado principal da aplicação.
     */
    function init(config) {
        appStateRef = config.appStateRef;
        onStateChangeCallback = config.onStateChangeCallback;
        editorElement = config.editorElement;
        
        _setupEventListeners();
    }

    /**
     * Configura todos os listeners de eventos do módulo.
     */
    function _setupEventListeners() {
        if (!modal) return; // Segurança caso os elementos não existam

        editorElement.addEventListener('input', _handleAutoReplace);
        addNewRuleBtn.addEventListener('click', _addNewRule);
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            _renderRules();
        });
        closeModalBtn.addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

        // Listeners para salvar e deletar regras dinamicamente
        ruleList.addEventListener('input', _handleRuleInputChange);
        ruleList.addEventListener('click', _handleRuleListClick);
    }
    
    /**
     * Lógica principal para a substituição automática no editor.
     */
    function _handleAutoReplace(event) {
        if (event.inputType !== 'insertText' || ![' ', '.'].includes(event.data)) return;
    
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
    
        const range = selection.getRangeAt(0);
        const node = range.startContainer;
    
        if (node.nodeType !== Node.TEXT_NODE) return;
    
        const textBeforeCursor = node.textContent.substring(0, range.startOffset);
        
        for (const rule of appStateRef.replacements) {
            // Verifica se o texto antes do cursor termina com o atalho seguido de um espaço/ponto
            if (rule.find && textBeforeCursor.endsWith(rule.find + event.data)) {
                event.preventDefault();

                // Salva o estado para a função "Desfazer"
                lastReplacement = { find: rule.find, replace: rule.replace, triggerChar: event.data };

                // Seleciona e remove o atalho (ex: "*id " ou "*id.")
                const rangeToDelete = document.createRange();
                rangeToDelete.setStart(node, range.startOffset - (rule.find.length + 1));
                rangeToDelete.setEnd(node, range.startOffset);
                rangeToDelete.deleteContents();

                // Insere a substituição
                document.execCommand('insertHTML', false, rule.replace + '&nbsp;');

                _showUndoToast(rule.find, rule.replace);
                return;
            }
        }
    }

    /**
     * Renderiza a lista de regras no modal, aplicando busca e paginação.
     */
    function _renderRules() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredRules = (appStateRef.replacements || []).filter(rule => 
            rule.find.toLowerCase().includes(searchTerm) ||
            rule.replace.toLowerCase().includes(searchTerm)
        );

        const startIndex = (currentPage - 1) * itemsPerPage;
        const rulesToShow = filteredRules.slice(startIndex, startIndex + itemsPerPage);

        ruleList.innerHTML = '';
        rulesToShow.forEach((rule, localIndex) => {
            const globalIndex = startIndex + localIndex;
            const li = document.createElement('li');
            li.className = 'replace-item';
            li.dataset.index = globalIndex;
            li.innerHTML = `
                <input type="text" class="find-input" value="${rule.find}" placeholder="Atalho (ex: *id)">
                <span class="arrow">→</span>
                <input type="text" class="replace-input" value="${rule.replace}" placeholder="Texto de substituição">
                <button class="delete-btn">&times;</button>
            `;
            ruleList.appendChild(li);
        });

        _renderPagination(filteredRules.length);
    }
    
    /**
     * Adiciona uma nova regra vazia à lista.
     */
    function _addNewRule() {
        appStateRef.replacements.unshift({ find: '', replace: '' });
        currentPage = 1;
        searchInput.value = '';
        onStateChangeCallback();
        _renderRules();
        // Foca no primeiro campo da nova regra
        const firstInput = ruleList.querySelector('.replace-item .find-input');
        if (firstInput) firstInput.focus();
    }

    /**
     * Salva as alterações feitas nos inputs do modal no estado da aplicação.
     */
    function _handleRuleInputChange(event) {
        const target = event.target;
        if (target.tagName !== 'INPUT') return;

        const li = target.closest('.replace-item');
        const index = parseInt(li.dataset.index, 10);
        
        const findValue = li.querySelector('.find-input').value;
        const replaceValue = li.querySelector('.replace-input').value;

        if (appStateRef.replacements[index]) {
            appStateRef.replacements[index] = { find: findValue, replace: replaceValue };
            onStateChangeCallback(); // Salva no LocalStorage
        }
    }

    /**
     * Delega cliques na lista de regras (atualmente, apenas para o botão de deletar).
     */
    function _handleRuleListClick(event) {
        if (event.target.classList.contains('delete-btn')) {
            const li = event.target.closest('.replace-item');
            const index = parseInt(li.dataset.index, 10);
            if (!isNaN(index)) {
                appStateRef.replacements.splice(index, 1);
                onStateChangeCallback();
                _renderRules();
            }
        }
    }

    /**
     * Exibe a notificação "Toast" para a ação de desfazer.
     */
    function _showUndoToast(find, replace) {
        // Remove qualquer toast existente
        const existingToast = document.querySelector('.undo-toast');
        if (existingToast) existingToast.remove();
        clearTimeout(undoToastTimeout);

        const toast = document.createElement('div');
        toast.className = 'undo-toast';
        toast.innerHTML = `
            <span>Substituído "${find}" por "${replace}"</span>
            <button id="undo-replace-btn">Desfazer</button>
        `;
        document.body.appendChild(toast);
        
        document.getElementById('undo-replace-btn').onclick = () => {
            _performUndo();
            toast.remove();
            clearTimeout(undoToastTimeout);
        };

        undoToastTimeout = setTimeout(() => toast.remove(), 5000);
    }

    /**
     * Executa a ação de desfazer a última substituição.
     */
    function _performUndo() {
        if (!lastReplacement) return;
        
        // Remove a substituição e um espaço (&nbsp;)
        document.execCommand('undo', false, null);
        document.execCommand('undo', false, null);
        
        // Reinsere o texto original
        document.execCommand('insertText', false, lastReplacement.find + lastReplacement.triggerChar);
        lastReplacement = null;
    }

    /**
     * Renderiza os controles de paginação.
     */
    function _renderPagination(totalItems) {
        paginationControls.innerHTML = '';
        const pageCount = Math.ceil(totalItems / itemsPerPage);
        if (pageCount <= 1) return;

        for (let i = 1; i <= pageCount; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            if (i === currentPage) btn.classList.add('active');
            btn.onclick = () => {
                currentPage = i;
                _renderRules();
            };
            paginationControls.appendChild(btn);
        }
    }
    
    /**
     * Abre e prepara o modal de gerenciamento.
     */
    function open() {
        currentPage = 1;
        searchInput.value = '';
        _renderRules();
        modal.classList.add('visible');
    }

    /**
     * Fecha o modal.
     */
    function close() {
        modal.classList.remove('visible');
    }

    return {
        init,
        open
    };
})();
