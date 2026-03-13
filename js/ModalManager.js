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
    
        modalDynamicContent.innerHTML = `
            <p class="modal-description">Por favor, preencha os campos abaixo. Eles serão usados para completar o seu modelo.</p>
            <form id="variable-form">${formFieldsHtml}</form>
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
                    <button class="copy-code-btn">Copiar Exemplo</button>
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
    
    // --- LÓGICA DO ASSISTENTE DE CRIAÇÃO DE POWER VARIABLES E CONDICIONAIS ---

    /**
     * Passo Inicial: Mostra a tela de seleção com abas para as categorias de Power Variables.
     */
    function _buildPowerVariableCreatorSelectionScreen() {
        // Usa a constante global POWER_VARIABLE_BLUEPRINTS de script.js
        const categoryMap = {
            'system': 'Variáveis de Sistema',
            'interactive': 'Ações Interativas'
        };
        const categories = [...new Set(POWER_VARIABLE_BLUEPRINTS.map(bp => bp.category))];

        const tabsHtml = categories.map((cat, index) =>
            `<button class="pv-creator-tab ${index === 0 ? 'active' : ''}" data-category="${cat}">${categoryMap[cat] || cat}</button>`
        ).join('');

        const panelsHtml = categories.map((cat, index) => {
            const blueprintsInCategory = POWER_VARIABLE_BLUEPRINTS.filter(bp => bp.category === cat);
            const cardsHtml = blueprintsInCategory.map(bp => `
                <div class="pv-creator-card" data-type="${bp.type}" role="button" tabindex="0">
                    <div class="pv-card-main-content">
                        <span class="pv-creator-icon">${bp.icon}</span>
                        <div class="pv-creator-text">
                            <strong>${bp.label}</strong>
                            <p>${bp.description}</p>
                        </div>
                    </div>
                    ${bp.helpContent ? `<button class="pv-card-help-btn" data-type="${bp.type}" title="Saiba mais sobre: ${bp.label}">i</button>` : ''}
                </div>
            `).join('');
            return `<div class="pv-creator-panel ${index === 0 ? 'active' : ''}" data-category-panel="${cat}">${cardsHtml}</div>`;
        }).join('');

        modalDynamicContent.innerHTML = `
            <div class="info-modal-content">
                <div class="pv-creator-tabs">${tabsHtml}</div>
                <div class="pv-creator-panels-container">${panelsHtml}</div>
            </div>
        `;
        
        modalBtnSave.style.display = 'none';
        modalBtnCancel.textContent = 'Fechar';
    }


    /**
     * Mostra o formulário de configuração para Ações Interativas simples (prompt, choice).
     * @param {string} type - O tipo de blueprint (ex: 'prompt', 'choice').
     */
    function _renderPowerVariableConfigScreen(type) {
        const blueprint = POWER_VARIABLE_BLUEPRINTS.find(b => b.type === type);
        if (!blueprint) return;

        modalDynamicContent.dataset.pvType = type;
        modalTitleEl.textContent = 'Configurar Ação Rápida';

        let formFieldsHtml = `
            <div class="pv-config-field">
                <label for="pv-config-name">Nome da Ação:</label>
                <input type="text" id="pv-config-name" required placeholder="Ex: Nome do Cliente">
                <small>Este é o nome que você buscará na Paleta de Comandos.</small>
            </div>
        `;

        if (type === 'choice') {
            formFieldsHtml += `
                <div class="pv-config-field">
                    <label for="pv-config-options">Opções do Menu (separadas por vírgula):</label>
                    <textarea id="pv-config-options" required placeholder="Ex: Pendente, Aprovado, Recusado"></textarea>
                </div>
            `;
        }

        modalDynamicContent.innerHTML = `
            <p class="modal-description">Configurando a ação: <strong>${blueprint.label}</strong></p>
            <form id="pv-config-form">${formFieldsHtml}</form>
        `;
        
        modalBtnSave.style.display = 'inline-block';
        modalBtnSave.textContent = 'Salvar e Fechar';
        modalDynamicContent.querySelector('input[type="text"]')?.focus();
    }
    
    /**
     * Passo 1 do assistente de Lógica Condicional.
     */
    function _buildConditionalLogicStep1_Trigger() {
        modalTitleEl.textContent = 'Lógica Condicional (Passo 1 de 2)';
        modalDynamicContent.innerHTML = `
            <p class="modal-description">Primeiro, crie a pergunta que controlará a lógica. As opções que você definir aqui serão usadas para criar os blocos de texto no próximo passo.</p>
            <div class="pv-config-field">
                <label for="pv-cond-trigger-name">Nome da Variável (ex: partes):</label>
                <input type="text" id="pv-cond-trigger-name" required placeholder="A variável que aparecerá no menu">
            </div>
            <div class="pv-config-field">
                <label for="pv-cond-trigger-options">Opções (separadas por vírgula):</label>
                <textarea id="pv-cond-trigger-options" required placeholder="Ex: do réu, dos réus"></textarea>
            </div>
        `;
        modalBtnSave.style.display = 'inline-block';
        modalBtnSave.textContent = 'Próximo Passo';
    }

    /**
     * Passo 2 do assistente de Lógica Condicional.
     * @param {string} triggerVariable - A variável completa, ex: {{partes:choice(do réu|dos réus)}}
     * @param {string[]} options - As opções, ex: ['do réu', 'dos réus']
     */
    function _buildConditionalLogicStep2_Blocks(triggerVariable, options) {
        modalTitleEl.textContent = 'Lógica Condicional (Passo 2 de 2)';
        
        const blocksHtml = options.map(opt => `
            <div class="condition-block">
                <label class="condition-label">Se a escolha for "<strong>${opt}</strong>", inserir este texto:</label>
                <textarea class="text-editor-modal condition-content" data-option="${opt}"></textarea>
            </div>
        `).join('');

        modalDynamicContent.innerHTML = `
            <p class="modal-description">Agora, preencha o conteúdo para cada uma das opções. Apenas o bloco correspondente à escolha do usuário será inserido no documento final.</p>
            <div id="conditional-blocks-container">${blocksHtml}</div>
            <input type="hidden" id="trigger-variable-storage" value='${triggerVariable}'>
        `;
        modalBtnSave.textContent = 'Criar e Inserir';
    }


    /**
     * Adiciona listeners de eventos, incluindo a lógica para o acordeão de ajuda e o assistente.
     */
    function _attachDynamicEventListeners() {
        if (currentConfig.type === 'powerVariableCreator') {
            const tabsContainer = modalDynamicContent.querySelector('.pv-creator-tabs');
            const panelsContainer = modalDynamicContent.querySelector('.pv-creator-panels-container');

            if (tabsContainer) {
                tabsContainer.addEventListener('click', (e) => {
                    const tab = e.target.closest('.pv-creator-tab');
                    if (!tab) return;
                    tabsContainer.querySelectorAll('.pv-creator-tab').forEach(t => t.classList.remove('active'));
                    panelsContainer.querySelectorAll('.pv-creator-panel').forEach(p => p.classList.remove('active'));
                    tab.classList.add('active');
                    panelsContainer.querySelector(`[data-category-panel="${tab.dataset.category}"]`).classList.add('active');
                });
            }

            if (panelsContainer) {
                panelsContainer.addEventListener('click', (e) => {
                    const helpBtn = e.target.closest('.pv-card-help-btn');
                    
                    if (helpBtn) {
                        e.stopPropagation(); 
                        const type = helpBtn.dataset.type;
                        const blueprint = POWER_VARIABLE_BLUEPRINTS.find(b => b.type === type);
                        
                        if (blueprint && blueprint.helpContent) {
                            ModalManager.show({
                                type: 'info',
                                title: `Ajuda: ${blueprint.label}`,
                                initialData: {
                                    title: blueprint.helpContent.title,
                                    cards: [{
                                        title: 'Como Funciona',
                                        content: blueprint.helpContent.explanation
                                    }, {
                                        title: 'Exemplo de Uso',
                                        content: blueprint.helpContent.example
                                    }]
                                }
                            });
                        }
                        return; 
                    }

                    const card = e.target.closest('.pv-creator-card');
                    if (!card) return;

                    const type = card.dataset.type;
                    const category = card.dataset.category;
                    const blueprint = POWER_VARIABLE_BLUEPRINTS.find(b => b.type === type);

                    if (category === 'system') {
                        currentConfig.onSave({ type, name: blueprint.label, options: null });
                        hide();
                    } else if (type === 'conditional_logic') {
                        _buildConditionalLogicStep1_Trigger();
                    } else if (category === 'interactive') {
                        _renderPowerVariableConfigScreen(type);
                    }
                });
            }
            return;
        }


        if (currentConfig.type === 'globalVarManager') {
            const containerId = '#global-var-list-container';
            const rowClass = 'global-var-row';
            const findInputClass = 'var-name-input';
            const replaceInputClass = 'var-value-input';
            const findPlaceholder = 'nome_da_variavel';
            const replacePlaceholder = 'Valor de substituição';
            const addBtnId = '#add-new-var-btn';
            const searchInputId = '#global-var-search-input';

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
                                `
                            },
                            {
                                title: '🤖 Variáveis Inteligentes (com Opções)',
                                content: `
                                    <p>Em vez de um campo de texto livre, você pode criar variáveis que oferecem um <strong>menu de seleção com opções pré-definidas</strong>.</p>
                                    <h4>Como usar:</h4>
                                    <p>Use a sintaxe <code>{{nome_da_variavel:choice(Opção1|Opção2|Opção3)}}</code>.</p>
                                    <h4>Exemplo Prático:</h4>
                                    <pre><code>O status do processo é: {{status:choice(Pendente|Aprovado|Recusado)}}.</code></pre>
                                `
                            },
                            {
                                title: '📝 Modelos Condicionais (Lógica "Se...Então...")',
                                content: `
                                    <p>Crie um único modelo que se adapta com base em uma escolha inicial.</p>
                                    <h4>Como usar:</h4>
                                    <p>1. <strong>O Gatilho:</strong> Uma variável do tipo <code>choice</code>.</p>
                                    <p>2. <strong>Os Blocos:</strong> <code>{{#if:nome_da_variavel=Valor}} ... {{/if}}</code>.</p>
                                `
                            },
                            {
                                title: '⚡ Variáveis Automáticas e de Preenchimento Rápido',
                                content: `
                                    <p>Automatize seus documentos com variáveis preenchidas pelo próprio sistema.</p>
                                    <ul>
                                        <li><code>{{data_atual}}</code> - Data simples.</li>
                                        <li><code>{{data_por_extenso}}</code> - Data completa.</li>
                                        <li><code>{{hora_atual}}</code> - Hora atual.</li>
                                    </ul>
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

            modalDynamicContent.addEventListener('click', (e) => {
                if (e.target.classList.contains('copy-code-btn')) {
                    const accordionContent = e.target.closest('.accordion-content');
                    if (accordionContent) {
                        const preElement = accordionContent.querySelector('pre');
                        if (preElement) {
                            const codeText = preElement.textContent;
                            navigator.clipboard.writeText(codeText).then(() => {
                                NotificationService.show('Exemplo copiado!', 'success');
                                e.target.textContent = 'Copiado!';
                                setTimeout(() => { e.target.textContent = 'Copiar Exemplo'; }, 2000);
                            });
                        }
                    }
                }
            });
        }
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
        if (!form) return {};

        const formData = new FormData(form);
        const values = {};
        for (let [key, value] of formData.entries()) {
            values[key] = value;
        }

        return { values: values };
    }
    
    function _getPowerVariableCreatorData() {
        if (modalDynamicContent.querySelector('#conditional-blocks-container')) {
            const triggerVariable = modalDynamicContent.querySelector('#trigger-variable-storage').value;
            const blocks = [];
            modalDynamicContent.querySelectorAll('.condition-block .condition-content').forEach(textarea => {
                blocks.push({
                    option: textarea.dataset.option,
                    content: textarea.value
                });
            });
            return {
                type: 'conditional_logic',
                name: triggerVariable,
                options: blocks
            };
        }

        const type = modalDynamicContent.dataset.pvType;
        if (!type) return null;

        const name = modalDynamicContent.querySelector('#pv-config-name')?.value;
        let options = null;

        if (type === 'choice') {
            const optionsText = modalDynamicContent.querySelector('#pv-config-options')?.value || '';
            options = optionsText.split(',').map(opt => opt.trim()).filter(Boolean);
        }

        return { type, name, options };
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
            case 'modelEditor': _buildModelEditorContent(config.initialData); break;
            case 'variableForm': _buildVariableFormContent(config.initialData); break;
            case 'globalVarManager': _buildGlobalVarManagerContent(config.initialData); break;
            case 'textFixer': _buildTextFixerContent(config.initialData); break;
            case 'info': _buildInfoContent(config.initialData); break;
            case 'powerVariableCreator': _buildPowerVariableCreatorSelectionScreen(); break;
            default: console.error('Tipo de modal desconhecido:', config.type); return;
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

        if (currentConfig.type === 'powerVariableCreator' && modalDynamicContent.querySelector('#pv-cond-trigger-name')) {
            const name = modalDynamicContent.querySelector('#pv-cond-trigger-name').value.trim();
            const optionsStr = modalDynamicContent.querySelector('#pv-cond-trigger-options').value.trim();
            
            if (!name || !optionsStr) {
                NotificationService.show('Nome da variável e opções são obrigatórios.', 'error');
                return;
            }
            
            const options = optionsStr.split(',').map(o => o.trim()).filter(Boolean);
            const choiceBlueprint = POWER_VARIABLE_BLUEPRINTS.find(b => b.type === 'choice');
            const triggerVariable = choiceBlueprint.build(name, options);

            _buildConditionalLogicStep2_Blocks(triggerVariable, options);
            return;
        }
        
        let dataToSave;
        switch (currentConfig.type) {
            case 'modelEditor': dataToSave = _getModelEditorData(); break;
            case 'variableForm': dataToSave = _getVariableFormData(); break;
            case 'globalVarManager': dataToSave = { globalVariables: _getGlobalVarData() }; break;
            case 'textFixer': dataToSave = { text: modalDynamicContent.querySelector('#modal-input-broken-text').value }; break;
            case 'powerVariableCreator': dataToSave = _getPowerVariableCreatorData(); break;
        }
        
        if (dataToSave) {
            currentConfig.onSave(dataToSave);
        }
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
