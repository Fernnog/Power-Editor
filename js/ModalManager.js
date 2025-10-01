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
     * CONSTRUÇÃO DO FORMULÁRIO DE VARIÁVEIS, COM SUPORTE A VARIÁVEIS DE ESCOLHA (<select>).
     * @param {object} data - Dados iniciais { variables, modelId }.
     */
    function _buildVariableFormContent(data = {}) {
        const savedValues = (appState.variableMemory && appState.variableMemory[data.modelId]) || {};
        const toTitleCase = str => str.replace(/_/g, ' ').replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1));
    
        let formFieldsHtml = (data.variables || []).map(variableFullName => {
            const parts = variableFullName.split(':');
            const variableName = parts[0];
            const variableType = parts.length > 1 ? parts[1] : 'text';
    
            const prefilledValue = savedValues[variableName] || '';
            let fieldHtml = '';
    
            const choiceMatch = variableType.match(/^choice\((.*)\)$/);
            if (choiceMatch) {
                const options = choiceMatch[1].split('|');
                const optionsHtml = options.map(opt => 
                    `<option value="${opt}" ${prefilledValue === opt ? 'selected' : ''}>${opt}</option>`
                ).join('');
                
                fieldHtml = `
                    <label for="var-${variableName}">${toTitleCase(variableName)}:</label>
                    <select id="var-${variableName}" name="${variableName}">${optionsHtml}</select>
                `;
            } else { // Fallback para campo de texto padrão
                fieldHtml = `
                    <label for="var-${variableName}">${toTitleCase(variableName)}:</label>
                    <input type="text" id="var-${variableName}" name="${variableName}" value="${prefilledValue}" required>
                `;
            }
            return `<div class="variable-row">${fieldHtml}</div>`;
        }).join('');
    
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
     * Constrói o conteúdo HTML para o gerenciador de Variáveis Globais.
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
     * Constrói o HTML para um modal informativo com estrutura de acordeão.
     * @param {object} data - Dados iniciais { title, cards }.
     */
    function _buildInfoContent(data = {}) {
        const cardsHtml = (data.cards || []).map((card, index) => `
            <div class="accordion-card">
                <button class="accordion-header" aria-expanded="false" aria-controls="accordion-content-${index}">
                    <span>${card.title}</span>
                    <span class="accordion-toggle-icon">+</span>
                </button>
                <div id="accordion-content-${index}" class="accordion-content" role="region">
                    ${card.content}
                </div>
            </div>
        `).join('');

        modalDynamicContent.innerHTML = `
            <div class="info-modal-content">
                <h4>${data.title || 'Guia Rápido'}</h4>
                <div class="accordion-container">${cardsHtml}</div>
            </div>`;
    }
    
    /**
     * Constrói o HTML para o ajustador de texto quebrado.
     * @param {object} data - Dados iniciais (geralmente vazio).
     */
    function _buildTextFixerContent(data = {}) {
        modalDynamicContent.innerHTML = `
            <label for="modal-input-broken-text">Cole o texto quebrado (copiado do PDF) abaixo:</label>
            <textarea id="modal-input-broken-text" class="text-editor-modal" style="min-height: 200px;" placeholder="Seu texto com quebras de linha..."></textarea>
        `;
    }

    /**
     * Adiciona listeners de eventos, incluindo a lógica para o acordeão de ajuda.
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
                    // CONTEÚDO DO GUIA INTERATIVO DEFINIDO AQUI
                    const helpContent = {
                        title: 'Guia de Funcionalidades Avançadas',
                        cards: [
                            {
                                title: '✨ Modelos Encadeados (Snippets)',
                                content: `
                                    <p>Pense nos snippets como <strong>"blocos de LEGO"</strong> de texto que você pode reutilizar. Crie um modelo pequeno e, em seguida, insira-o em outros modelos maiores.</p>
                                    <h4>Como usar:</h4>
                                    <p>Use a sintaxe <code>{{snippet:Nome_Exato_Do_Modelo}}</code>.</p>
                                    <h4>Exemplo Prático:</h4>
                                    <p>1. Crie um modelo chamado "Assinatura_Padrao" com seu texto de assinatura.</p>
                                    <p>2. Em outro modelo, escreva:</p>
                                    <pre><code>Prezado(a) {{nome_do_cliente}},<br><br>... corpo do e-mail ...<br><br>{{snippet:Assinatura_Padrao}}</code></pre>
                                    <p><strong>Vantagem:</strong> Se precisar atualizar sua assinatura, edite apenas o modelo "Assinatura_Padrao" e a mudança será aplicada em todos os lugares que o utilizam!</p>
                                `
                            },
                            {
                                title: '🤖 Variáveis Inteligentes (com Opções)',
                                content: `
                                    <p>Em vez de um campo de texto livre, você pode criar variáveis que oferecem um <strong>menu de seleção com opções pré-definidas</strong>. Isso agiliza o preenchimento e evita erros de digitação.</p>
                                    <h4>Como usar:</h4>
                                    <p>Use a sintaxe <code>{{nome_da_variavel:choice(Opção1|Opção2|Opção3)}}</code>. Separe as opções com uma barra vertical ( | ).</p>
                                    <h4>Exemplo Prático:</h4>
                                    <pre><code>O status do processo é: {{status:choice(Pendente|Aprovado|Recusado)}}.</code></pre>
                                    <p>Ao usar este modelo, o sistema exibirá um menu suspenso com as opções "Pendente", "Aprovado" e "Recusado" para você escolher.</p>
                                `
                            },
                            {
                                title: '⚡ Variáveis Automáticas e de Preenchimento Rápido',
                                content: `
                                    <p>Automatize seus documentos com variáveis que são preenchidas pelo próprio sistema ou através de uma pergunta rápida. Elas são 'mágicas': o sistema as insere no último segundo, por isso <strong>nunca aparecem no formulário de perguntas.</strong></p>
                                    <h4>Variáveis de Sistema (Automáticas):</h4>
                                    <p>São preenchidas no momento do uso, sem que você precise digitar nada.</p>
                                    <ul>
                                        <li><code>{{data_atual}}</code> - Insere a data simples (ex: 26/07/2024).</li>
                                        <li><code>{{data_por_extenso}}</code> - Insere a data completa (ex: terça-feira, 26 de julho de 2024).</li>
                                        <li><code>{{hora_atual}}</code> - Insere a hora atual (ex: 14:30).</li>
                                    </ul>
                                    <h4>Preenchimento Rápido (Prompt):</h4>
                                    <p>Para informações simples, use <code>{{nome_da_variavel:prompt}}</code>. O sistema fará uma pergunta rápida em vez de abrir o formulário completo.</p>
                                    <pre><code>Contrato referente ao serviço prestado para {{cliente_nome:prompt}}.</code></pre>
                                `
                            }
                        ]
                    };

                    ModalManager.show({
                        type: 'info',
                        title: 'Guia Rápido: Funcionalidades Avançadas',
                        initialData: helpContent
                    });
                });
            }
        }

        // LÓGICA PARA CONTROLAR O ACORDEÃO NO MODAL DE INFORMAÇÕES
        if (currentConfig.type === 'info' && modalDynamicContent.querySelector('.accordion-container')) {
            const headers = modalDynamicContent.querySelectorAll('.accordion-header');
            headers.forEach(header => {
                header.addEventListener('click', () => {
                    const content = header.nextElementSibling;
                    const isVisible = content.classList.contains('visible');

                    if (!isVisible) {
                        header.classList.add('active');
                        content.classList.add('visible');
                        header.setAttribute('aria-expanded', 'true');
                    } else {
                         header.classList.remove('active');
                         content.classList.remove('visible');
                         header.setAttribute('aria-expanded', 'false');
                    }
                });
            });
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

    function _getGlobalVarData() {
        const globalVariables = [];
        modalDynamicContent.querySelectorAll('.global-var-row').forEach(row => {
            const find = row.querySelector('.var-name-input').value.trim().replace(/[{}]/g, '');
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
            case 'globalVarManager':
                _buildGlobalVarManagerContent(config.initialData);
                break;
            case 'textFixer':
                _buildTextFixerContent(config.initialData);
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
        const firstInput = modalDynamicContent.querySelector('input[type="text"], textarea, select');
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
            case 'globalVarManager':
                 dataToSave = {
                    globalVariables: _getGlobalVarData()
                };
                break;
            case 'textFixer':
                dataToSave = {
                    text: modalDynamicContent.querySelector('#modal-input-broken-text').value
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
