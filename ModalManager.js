const ModalManager = (() => {
    // Referências aos elementos do DOM do modal principal
    const modalContainer = document.getElementById('modal-container');
    const modalContentContainer = document.querySelector('.modal-content');
    const modalTitleEl = document.getElementById('modal-title');
    const modalBtnSave = document.getElementById('modal-btn-save');
    const modalBtnCancel = document.getElementById('modal-btn-cancel');

    // Corpo dinâmico que será substituído
    const dynamicContentArea = document.createElement('div');
    dynamicContentArea.className = 'modal-dynamic-content';
    modalContentContainer.insertBefore(dynamicContentArea, modalBtnSave.parentElement);

    // Armazena a configuração atual, incluindo o callback onSave
    let currentConfig = null;

    /**
     * Constrói o HTML para o editor de modelos (Criar/Editar).
     * @param {object} data - Dados iniciais { name, content }.
     */
    function _buildModelEditorContent(data = {}) {
        dynamicContentArea.innerHTML = `
            <label for="modal-input-name">Nome do Modelo:</label>
            <input type="text" id="modal-input-name" placeholder="Digite o nome aqui..." value="${data.name || ''}">
            
            <label for="modal-input-content">Conteúdo do Modelo:</label>
            <div class="modal-toolbar">
                <button onclick="document.execCommand('bold')"><b>B</b></button>
                <button onclick="document.execCommand('italic')"><i>I</i></button>
                <button onclick="document.execCommand('underline')"><u>U</u></button>
            </div>
            <div id="modal-input-content" class="text-editor-modal" contenteditable="true">${data.content || ''}</div>
        `;
    }

    /**
     * Constrói o HTML para o gerenciador de substituições.
     * @param {object} data - Dados iniciais { replacements }.
     */
    function _buildReplacementManagerContent(data = {}) {
        let replacementRowsHtml = (data.replacements || []).map((item, index) => `
            <div class="replacement-row" data-index="${index}">
                <input type="text" class="find-input" placeholder="Localizar..." value="${item.find || ''}">
                <span class="arrow">→</span>
                <input type="text" class="replace-input" placeholder="Substituir por..." value="${item.replace || ''}">
                <button class="delete-rule-btn">&times;</button>
            </div>
        `).join('');

        dynamicContentArea.innerHTML = `
            <p class="modal-description">Crie regras para localizar e substituir textos no editor. As regras são salvas automaticamente.</p>
            <div id="replacement-list-container">${replacementRowsHtml}</div>
            <button id="add-new-rule-btn" class="control-btn btn-secondary" style="width: 100%; margin-top: 10px;">Adicionar Nova Regra</button>
            <hr style="margin: 20px 0;">
            <button id="apply-all-btn" class="control-btn btn-primary" style="width: 100%;">Aplicar Todas as Substituições no Editor</button>
        `;

        // Adicionar listeners de eventos para os botões dinâmicos
        dynamicContentArea.addEventListener('click', (e) => {
            if (e.target.id === 'add-new-rule-btn') {
                const listContainer = document.getElementById('replacement-list-container');
                const newRow = document.createElement('div');
                newRow.className = 'replacement-row';
                newRow.innerHTML = `
                    <input type="text" class="find-input" placeholder="Localizar...">
                    <span class="arrow">→</span>
                    <input type="text" class="replace-input" placeholder="Substituir por...">
                    <button class="delete-rule-btn">&times;</button>
                `;
                listContainer.appendChild(newRow);
            }
            if (e.target.classList.contains('delete-rule-btn')) {
                e.target.parentElement.remove();
            }
            if (e.target.id === 'apply-all-btn') {
                if (currentConfig && typeof currentConfig.onApply === 'function') {
                    currentConfig.onApply();
                }
            }
        });
    }
    
    /**
     * Coleta os dados do formulário de substituição.
     * @returns {Array} Lista de objetos { find, replace }.
     */
    function _getReplacementData() {
        const replacements = [];
        document.querySelectorAll('.replacement-row').forEach(row => {
            const find = row.querySelector('.find-input').value.trim();
            const replace = row.querySelector('.replace-input').value.trim();
            if (find) { // Salva a regra apenas se o campo "Localizar" estiver preenchido
                replacements.push({ find, replace });
            }
        });
        return replacements;
    }

    /**
     * Função principal para exibir o modal com uma configuração específica.
     * @param {object} config - Objeto de configuração do modal.
     */
    function show(config) {
        currentConfig = config;
        modalTitleEl.textContent = config.title;

        // Constrói o conteúdo com base no tipo
        switch (config.type) {
            case 'modelEditor':
                _buildModelEditorContent(config.initialData);
                break;
            case 'replacementManager':
                _buildReplacementManagerContent(config.initialData);
                break;
            default:
                console.error('Tipo de modal desconhecido:', config.type);
                return;
        }

        modalContainer.classList.add('visible');
        const firstInput = dynamicContentArea.querySelector('input[type="text"]');
        if (firstInput) {
            firstInput.focus();
        }
    }

    /**
     * Oculta o modal e limpa o estado.
     */
    function hide() {
        modalContainer.classList.remove('visible');
        dynamicContentArea.innerHTML = ''; // Limpa o conteúdo para a próxima abertura
        currentConfig = null;
    }

    /**
     * Handler do botão Salvar. Coleta os dados e chama o callback.
     */
    function onSaveClick() {
        if (!currentConfig || typeof currentConfig.onSave !== 'function') return;

        let dataToSave;
        switch (currentConfig.type) {
            case 'modelEditor':
                dataToSave = {
                    name: document.getElementById('modal-input-name').value,
                    content: document.getElementById('modal-input-content').innerHTML
                };
                break;
            case 'replacementManager':
                 dataToSave = {
                    replacements: _getReplacementData()
                };
                break;
        }
        
        currentConfig.onSave(dataToSave);
        hide(); // O callback onSave é responsável por fechar, mas garantimos aqui.
    }

    // Adiciona os listeners de eventos uma única vez
    modalBtnSave.addEventListener('click', onSaveClick);
    modalBtnCancel.addEventListener('click', hide);
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) hide();
    });

    // Expõe a API pública
    return {
        show,
        hide
    };
})();