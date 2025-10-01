// js/ModalManager.js

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
     * CONSTRUÇÃO DO FORMULÁRIO DE VARIÁVEIS, AGORA COM MEMÓRIA E CHECKBOX DE CONTROLE.
     * @param {object} data - Dados iniciais { variables, modelId }.
     */
    function _buildVariableFormContent(data = {}) {
        // Busca os dados salvos na memória para este modelo específico.
        const savedValues = (appState.variableMemory && appState.variableMemory[data.modelId]) || {};
        const hasSavedValues = Object.keys(savedValues).length > 0;

        const toTitleCase = str => str.replace(/_/g, ' ').replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1));

        let formFieldsHtml = (data.variables || []).map(variable => {
            // Usa o valor salvo na memória, se existir; caso contrário, usa uma string vazia.
            const prefilledValue = savedValues[variable] || '';
            return `
            <div class="variable-row">
                <label for="var-${variable}">${toTitleCase(variable)}:</label>
                <input type="text" id="var-${variable}" name="${variable}" value="${prefilledValue}" required>
            </div>
            `;
        }).join('');

        // Adiciona o checkbox para controlar o salvamento dos dados.
        // Ele vem marcado por padrão para incentivar o uso da funcionalidade.
        const rememberCheckboxHtml = `
            <div class="modal-remember-choice">
                <input type="checkbox" id="modal-remember-vars" checked>
                <label for="modal-remember-vars">Lembrar valores para o próximo uso deste modelo</label>
            </div>
        `;

        modalDynamicContent.innerHTML = `
            <p class="modal-description">Por favor, preencha os campos abaixo. Eles serão usados para completar o seu modelo.</p>
            <form id="variable-form">${formFieldsHtml}</form>
            ${rememberCheckboxHtml}
        `;
    }

    /**
     * NOVO: Constrói o conteúdo HTML para o gerenciador de Variáveis Globais.
     * @param {object} data - Dados iniciais { globalVariables }.
     */
    function _buildGlobalVarManagerContent(data = {}) {
        let globalVarRowsHtml = (data.globalVariables || []).map(item => `
            <div class="global-var-row">
                <input type="text" class="var-name-input" placeholder="nome_da_variavel" value="${item.find || ''}">
                <span class="arrow">→</span>
                <input type="text" class="var-value-input" placeholder="Valor de substituição" value="${item.replace || ''}">
                <button type="button" class="delete-rule-btn">&times;</button>
            </div>
        `).join('');

        modalDynamicContent.innerHTML = `
            <p class="modal-description">Gerencie suas variáveis globais. Use <code>{{nome_da_variavel}}</code> em qualquer modelo para substituí-la automaticamente.</p>
            <input type="text" id="global-var-search-input" placeholder="Buscar por uma variável...">
            <div id="global-var-list-container">${globalVarRowsHtml}</div>
            <button id="add-new-var-btn" class="control-btn btn-secondary" style="width: 100%; margin-top: 10px;">Adicionar Nova Variável</button>
        `;
    }
    
    /**
     * Constrói o conteúdo HTML para um modal informativo.
     * @param {object} data - Dados iniciais { content }.
     */
    function _buildInfoContent(data = {}) {
        modalDynamicContent.innerHTML = `<div class="info-modal-content">${data.content || ''}</div>`;
    }

    // --- FUNÇÃO DE DIAGNÓSTICO E CORREÇÃO ---
    function _buildBackupHistoryContent(data = {}) {
        let historyRowsHtml = (data.history || []).map(item => {
            const date = new Date(item.timestamp);
            const formattedDate = `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
            
            const isCurrent = item.timestamp === data.currentTimestamp;
            const currentIndicator = isCurrent ? '<span class="current-backup-indicator">(Atual)</span>' : '';

            return `
                <li class="backup-history-item ${isCurrent ? 'current' : ''}">
                    <span class="timestamp">${formattedDate} ${currentIndicator}</span>
                    <button class="restore-backup-btn" data-timestamp="${item.timestamp}">Restaurar</button>
                </li>
            `;
        }).join('');
    
        if (!historyRowsHtml) {
            historyRowsHtml = '<li class="backup-history-item"><span class="timestamp">Nenhum backup no histórico ainda.</span></li>';
        }
    
        modalDynamicContent.innerHTML = `
            <p class="modal-description">Selecione um ponto de restauração. A restauração substituirá todos os dados atuais.</p>
            <ul id="backup-history-list">${historyRowsHtml}</ul>
        `;
    
        modalDynamicContent.querySelectorAll('.restore-backup-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const timestamp = e.target.dataset.timestamp;
                // O callback onSave será chamado com o timestamp para que script.js possa processar
                if (currentConfig.onSave) {
                    currentConfig.onSave({ timestamp });
                }
            });
        });
    }

    /**
     * Adiciona listeners de eventos para o conteúdo dinâmico do modal.
     */
    function _attachDynamicEventListeners() {
        // Lógica genérica para gerenciadores de lista (Substituições e Variáveis Globais)
        if (currentConfig.type === 'replacementManager' || currentConfig.type === 'globalVarManager') {
            const isReplacement = currentConfig.type === 'replacementManager';
            const containerId = isReplacement ? '#replacement-list-container' : '#global-var-list-container';
            const rowClass = isReplacement ? 'replacement-row' : 'global-var-row';
            const findInputClass = isReplacement ? 'find-input' : 'var-name-input';
            const replaceInputClass = isReplacement ? 'replace-input' : 'var-value-input';
            const findPlaceholder = isReplacement ? 'Localizar...' : 'nome_da_variavel';
            const replacePlaceholder = isReplacement ? 'Substituir por...' : 'Valor de substituição';
            const addBtnId = isReplacement ? '#add-new-rule-btn' : '#add-new-var-btn';
            const searchInputId = isReplacement ? '#replacement-search-input' : '#global-var-search-input';

            const listContainer = modalDynamicContent.querySelector(containerId);
            
            modalDynamicContent.querySelector(addBtnId).addEventListener('click', () => {
                const newRow = document.createElement('div');
                newRow.className = rowClass;
                newRow.innerHTML = `
                    <input type="text" class="${findInputClass}" placeholder="${findPlaceholder}">
                    <span class="arrow">→</span>
                    <input type="text" class="${replaceInputClass}" placeholder="${replacePlaceholder}">
                    <button type="button" class="delete-rule-btn">&times;</button>
                `;
                listContainer.appendChild(newRow);
                newRow.querySelector(`.${findInputClass}`).focus();
            });

            modalDynamicContent.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-rule-btn')) {
                    e.target.parentElement.remove();
                }
            });

            modalDynamicContent.querySelector(searchInputId).addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                listContainer.querySelectorAll(`.${rowClass}`).forEach(row => {
                    const findValue = row.querySelector(`.${findInputClass}`).value.toLowerCase();
                    const replaceValue = row.querySelector(`.${replaceInputClass}`).value.toLowerCase();
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
                                <h4>✨ Funcionalidade Nova: Memória de Variáveis</h4>
                                <p>Para agilizar seu trabalho, o sistema agora <strong>lembra os valores</strong> que você preenche nos campos de um modelo. Na próxima vez que usar o mesmo modelo, os campos já virão pré-preenchidos. Você pode controlar esse comportamento com a caixa de seleção "Lembrar valores" que aparece no formulário.</p>
                                <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;">

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

    // NOVO: Coleta os dados do gerenciador de variáveis globais
    function _getGlobalVarData() {
        const globalVariables = [];
        modalDynamicContent.querySelectorAll('.global-var-row').forEach(row => {
            const find = row.querySelector('.var-name-input').value.trim().replace(/[{}]/g, ''); // Garante que não tenha chaves
            const replace = row.querySelector('.var-value-input').value;
            if (find) {
                globalVariables.push({ find, replace });
            }
        });
        return globalVariables;
    }
    
    function _getModelEditorData() {
        return {
            name: modalDynamicContent.querySelector('#modal-input-name').value.trim(),
            content: modalDynamicContent.querySelector('#modal-input-content').innerHTML
        };
    }
    
    /**
     * MODIFICADO: Coleta os dados do formulário de variáveis e o estado do checkbox.
     * Retorna um objeto composto para que a lógica de negócio decida o que fazer.
     */
    function _getVariableFormData() {
        const form = modalDynamicContent.querySelector('#variable-form');
        const rememberCheckbox = modalDynamicContent.querySelector('#modal-remember-vars');
        if (!form) return {};

        const formData = new FormData(form);
        const values = {};
        for (let [key, value] of formData.entries()) {
            values[key] = value;
        }

        return {
            values: values,
            shouldRemember: rememberCheckbox ? rememberCheckbox.checked : false
        };
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
            case 'globalVarManager': // NOVO TIPO DE MODAL
                _buildGlobalVarManagerContent(config.initialData);
                break;
            case 'backupHistory': // NOVO TIPO DE MODAL
                _buildBackupHistoryContent(config.initialData);
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
                dataToSave = _getVariableFormData(); // Retorna o objeto composto { values, shouldRemember }
                break;
            case 'globalVarManager': // NOVO
                 dataToSave = {
                    globalVariables: _getGlobalVarData()
                };
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
