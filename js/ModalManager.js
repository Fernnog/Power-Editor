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
            // MODIFICADO: Estrutura de "cartão" com botão de ajuda
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
        // MODIFICADO: O botão cancelar é renomeado para "Fechar" nesta tela específica
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
     * NOVO: Passo 1 do assistente de Lógica Condicional.
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
     * NOVO: Passo 2 do assistente de Lógica Condicional.
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

            // MODIFICADO: Lógica de clique para separar a ação principal do botão de ajuda
            if (panelsContainer) {
                panelsContainer.addEventListener('click', (e) => {
                    const helpBtn = e.target.closest('.pv-card-help-btn');
                    
                    if (helpBtn) {
                        e.stopPropagation(); // Impede a seleção da ação ao clicar no 'i'
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
                        return; // Encerra a execução aqui
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
                                title: '📝 Modelos Condicionais (Lógica "Se...Então...")',
                                content: `
                                    <p>Leve seus modelos a outro nível. Em vez de criar um para o singular e outro para o plural, por exemplo, crie um único modelo que se adapta com base em uma escolha inicial.</p>
                                    <h4>Como usar:</h4>
                                    <p>A lógica condicional funciona em duas partes:</p>
                                    <p>1. <strong>O Gatilho:</strong> Uma variável do tipo <code>choice</code> que define a condição.</p>
                                    <p>2. <strong>Os Blocos de Conteúdo:</strong> Trechos de texto envolvidos pela sintaxe <code>{{#if:nome_da_variavel=ValorDaOpcao}} ... {{/if}}</code>.</p>
                                    
                                    <h4>Exemplo Prático (Singular vs. Plural):</h4>
                                    <pre><code>Determine-se a citação {{partes:choice(do réu|dos réus)}}.

{{#if:partes=do réu}}
1. Cite-se a parte executada para que, no prazo de 48h, efetue o pagamento da dívida.
{{/if}}

{{#if:partes=dos réus}}
1. Citem-se as partes executadas para que, no prazo de 48h, efetuem o pagamento da dívida.
{{/if}}
                                    </code></pre>
                                    <p><strong>Como funciona:</strong> Ao usar este modelo, o sistema primeiro perguntará: "do réu ou dos réus?". Se você escolher "do réu", ele incluirá APENAS o primeiro bloco de texto e descartará o segundo, montando o documento corretamente.</p>
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
                                NotificationService.show('Exemplo copiado para a área de transferência!', 'success');
                                e.target.textContent = 'Copiado!';
                                setTimeout(() => { e.target.textContent = 'Copiar Exemplo'; }, 2000);
                            }).catch(err => {
                                NotificationService.show('Falha ao copiar o texto.', 'error');
                                console.error('Erro ao copiar:', err);
                            });
                        }
                    }
                }
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
        if (!form) return {};

        const formData = new FormData(form);
        const values = {};
        for (let [key, value] of formData.entries()) {
            values[key] = value;
        }

        return {
            values: values
        };
    }
    
    function _getPowerVariableCreatorData() {
        // Lógica para o assistente de Lógica Condicional (Passo 2)
        if (modalDynamicContent.querySelector('#conditional-blocks-container')) {
            const triggerVariable = modalDynamicContent.querySelector('#trigger-variable-storage').value;
            const blocks = [];
            modalDynamicContent.querySelectorAll('.condition-block .condition-content').forEach(textarea => {
                blocks.push({
                    option: textarea.dataset.option,
                    content: textarea.value
                });
            });
            // Retorna os dados no formato que o blueprint 'conditional_logic' espera
            return {
                type: 'conditional_logic',
                name: triggerVariable, // Argumento 1 para .build()
                options: blocks // Argumento 2 para .build()
            };
        }

        // Lógica para ações interativas simples (prompt, choice)
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
            case 'replacementManager': _buildReplacementManagerContent(config.initialData); break;
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

        // Lógica de estado para o assistente de Lógica Condicional
        if (currentConfig.type === 'powerVariableCreator' && modalDynamicContent.querySelector('#pv-cond-trigger-name')) {
            const name = modalDynamicContent.querySelector('#pv-cond-trigger-name').value.trim();
            const optionsStr = modalDynamicContent.querySelector('#pv-cond-trigger-options').value.trim();
            
            if (!name || !optionsStr) {
                NotificationService.show('Nome da variável e opções são obrigatórios.', 'error');
                return; // Não continua
            }
            
            const options = optionsStr.split(',').map(o => o.trim()).filter(Boolean);
            const choiceBlueprint = POWER_VARIABLE_BLUEPRINTS.find(b => b.type === 'choice');
            const triggerVariable = choiceBlueprint.build(name, options);

            _buildConditionalLogicStep2_Blocks(triggerVariable, options);
            return; // Impede o fechamento do modal, avançando para o próximo passo
        }
        
        let dataToSave;
        switch (currentConfig.type) {
            case 'modelEditor': dataToSave = _getModelEditorData(); break;
            case 'replacementManager': dataToSave = { replacements: _getReplacementData() }; break;
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
