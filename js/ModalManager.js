const ModalManager = (() => {
    // Referências aos elementos do DOM do modal principal
    const modalContainer = document.getElementById('modal-container');
    const modalTitleEl = document.getElementById('modal-title');
    const modalDynamicContent = document.getElementById('modal-dynamic-content');
    const modalBtnSave = document.getElementById('modal-btn-save');
    const modalBtnCancel = document.getElementById('modal-btn-cancel');

    // Armazena a configuração atual, incluindo o callback onSave
    let currentConfig = null;

    /**
     * Constrói o HTML para o editor de modelos (Criar/Editar), incluindo o ícone de ajuda.
     * @param {object} data - Dados iniciais { name, content }.
     */
    function _buildModelEditorContent(data = {}) {
        modalDynamicContent.innerHTML = `
            <label for="modal-input-name">Nome do Modelo:</label>
            <input type="text" id="modal-input-name" placeholder="Digite o nome aqui..." value="${data.name || ''}">
            
            <label for="modal-input-content">
                Conteúdo do Modelo:
                <span id="variable-info-icon" title="Clique para saber como usar variáveis dinâmicas">i</span>
            </label>
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
        let replacementRowsHtml = (data.replacements || []).map(item => `
            <div class="replacement-row">
                <input type="text" class="find-input" placeholder="Localizar..." value="${item.find || ''}">
                <span class="arrow">→</span>
                <input type="text" class="replace-input" placeholder="Substituir por..." value="${item.replace || ''}">
                <button type="button" class="delete-rule-btn">&times;</button>
            </div>
        `).join('');

        modalDynamicContent.innerHTML = `
            <p class="modal-description">Gerencie suas regras de substituição. Elas serão aplicadas automaticamente enquanto você digita no editor.</p>
            <input type="text" id="replacement-search-input" placeholder="Buscar por uma regra...">
            <div id="replacement-list-container">${replacementRowsHtml}</div>
            <button id="add-new-rule-btn" class="control-btn btn-secondary" style="width: 100%; margin-top: 10px;">Adicionar Nova Regra</button>
        `;
    }

    /**
     * Constrói o HTML para o formulário de variáveis dinâmicas.
     * @param {object} data - Dados iniciais { variables }.
     */
    function _buildVariableFormContent(data = {}) {
        const toTitleCase = str => str.replace(/_/g, ' ').replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1));

        let formFieldsHtml = (data.variables || []).map(variable => `
            <div class="variable-row">
                <label for="var-${variable}">${toTitleCase(variable)}:</label>
                <input type="text" id="var-${variable}" name="${variable}" required>
            </div>
        `).join('');

        modalDynamicContent.innerHTML = `
            <p class="modal-description">Por favor, preencha os campos abaixo. Eles serão usados para completar o seu modelo.</p>
            <form id="variable-form">${formFieldsHtml}</form>
        `;
    }
    
    /**
     * Constrói o conteúdo HTML para um modal informativo.
     * @param {object} data - Dados iniciais { content }.
     */
    function _buildInfoContent(data = {}) {
        modalDynamicContent.innerHTML = `<div class="info-modal-content">${data.content || ''}</div>`;
    }

    /**
     * Adiciona listeners de eventos para o conteúdo dinâmico do modal.
     */
    function _attachDynamicEventListeners() {
        if (currentConfig.type === 'replacementManager') {
            const listContainer = modalDynamicContent.querySelector('#replacement-list-container');
            
            modalDynamicContent.querySelector('#add-new-rule-btn').addEventListener('click', () => {
                const newRow = document.createElement('div');
                newRow.className = 'replacement-row';
                newRow.innerHTML = `
                    <input type="text" class="find-input" placeholder="Localizar...">
                    <span class="arrow">→</span>
                    <input type="text" class="replace-input" placeholder="Substituir por...">
                    <button type="button" class="delete-rule-btn">&times;</button>
                `;
                listContainer.appendChild(newRow);
                newRow.querySelector('.find-input').focus();
            });

            modalDynamicContent.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-rule-btn')) {
                    e.target.parentElement.remove();
                }
            });

            modalDynamicContent.querySelector('#replacement-search-input').addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                listContainer.querySelectorAll('.replacement-row').forEach(row => {
                    const findValue = row.querySelector('.find-input').value.toLowerCase();
                    const replaceValue = row.querySelector('.replace-input').value.toLowerCase();
                    row.style.display = (findValue.includes(query) || replaceValue.includes(query)) ? 'flex' : 'none';
                });
            });
        }
        
        if (currentConfig.type === 'modelEditor') {
            const infoIcon = modalDynamicContent.querySelector('#variable-info-icon');
            if (infoIcon) {
                infoIcon.addEventListener('click', () => {
                    ModalManager.show({
                        type: 'info',
                        title: 'Guia Rápido: Variáveis Dinâmicas',
                        initialData: {
                            content: `
                                <h4>Para que servem?</h4>
                                <p>As variáveis permitem criar campos em seus modelos que serão preenchidos no momento do uso. Isso automatiza a inserção de informações como nomes, documentos ou datas.</p>
                                
                                <h4>Como usar:</h4>
                                <p>Para definir uma variável, envolva um nome descritivo com chaves duplas, como abaixo:</p>
                                <pre><code>{{nome_da_variavel}}</code></pre>
                                
                                <h4>Exemplo Prático:</h4>
                                <pre><code>Despacho referente ao processo de {{nome_do_cliente}}, inscrito sob o CPF {{cpf_do_cliente}}.</code></pre>
                                
                                <h4>Regras de Nomenclatura (Variáveis Permitidas):</h4>
                                <ul>
                                    <li>Use apenas letras (a-z), números (0-9) e o caractere de sublinhado ( _ ).</li>
                                    <li>Não use espaços, acentos ou caracteres especiais (ç, !, @, #, etc.).</li>
                                    <li>O nome da variável não diferencia maiúsculas de minúsculas.</li>
                                </ul>
                            `
                        }
                    });
                });
            }
        }
    }
    
    function _getReplacementData() {
        const replacements = [];
        modalDynamicContent.querySelectorAll('.replacement-row').forEach(row => {
            const find = row.querySelector('.find-input').value.trim();
            const replace = row.querySelector('.replace-input').value;
            if (find) {
                replacements.push({ find, replace });
            }
        });
        return replacements;
    }
    
    function _getModelEditorData() {
        return {
            name: modalDynamicContent.querySelector('#modal-input-name').value.trim(),
            content: modalDynamicContent.querySelector('#modal-input-content').innerHTML
        };
    }
    
    function _getVariableFormData() {
        const form = modalDynamicContent.querySelector('#variable-form');
        if (!form) return {};
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }

    function show(config) {
        currentConfig = config;
        modalTitleEl.textContent = config.title;

        if (config.type === 'info') {
            modalBtnSave.style.display = 'none';
            modalBtnCancel.textContent = 'Entendi';
        } else {
            modalBtnSave.style.display = 'inline-block';
            modalBtnCancel.textContent = 'Cancelar';
            modalBtnSave.textContent = config.saveButtonText || 'Salvar e Fechar';
        }

        switch (config.type) {
            case 'modelEditor':
                _buildModelEditorContent(config.initialData);
                break;
            case 'replacementManager':
                _buildReplacementManagerContent(config.initialData);
                break;
            case 'variableForm':
                _buildVariableFormContent(config.initialData);
                break;
            case 'info':
                _buildInfoContent(config.initialData);
                break;
            default:
                console.error('Tipo de modal desconhecido:', config.type);
                return;
        }

        modalContainer.classList.add('visible');
        _attachDynamicEventListeners();
        const firstInput = modalDynamicContent.querySelector('input[type="text"]');
        if (firstInput) {
            firstInput.focus();
        }
    }

    function hide() {
        modalContainer.classList.remove('visible');
        modalDynamicContent.innerHTML = '';
        currentConfig = null;
    }

    function onSaveClick() {
        if (!currentConfig || typeof currentConfig.onSave !== 'function') return hide();

        let dataToSave;
        switch (currentConfig.type) {
            case 'modelEditor':
                dataToSave = _getModelEditorData();
                break;
            case 'replacementManager':
                 dataToSave = {
                    replacements: _getReplacementData()
                };
                break;
            case 'variableForm':
                dataToSave = _getVariableFormData();
                break;
        }
        
        currentConfig.onSave(dataToSave);
        hide();
    }

    modalBtnSave.addEventListener('click', onSaveClick);
    modalBtnCancel.addEventListener('click', hide);
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) hide();
    });

    return {
        show,
        hide
    };
})();
