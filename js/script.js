// js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO DA APLICAÇÃO ---
    let appState = {
        tabs: [],
        models: [],
        activeTabId: null,
        editor: null,
        replacements: [] // Adicionado para armazenar as regras de substituição
    };

    // --- ELEMENTOS DO DOM ---
    const tabsContainer = document.getElementById('tabs-container');
    const modelList = document.getElementById('model-list');
    const searchBox = document.getElementById('search-box');
    const activeContentArea = document.getElementById('active-content-area');
    
    // Botões principais
    const formatDocBtn = document.getElementById('format-doc-btn');
    const clearDocBtn = document.getElementById('clear-doc-btn');
    const importBtn = document.getElementById('import-btn');
    const exportBtn = document.getElementById('export-btn');
    const addModelBtn = document.getElementById('add-new-model-btn');
    const addNewTabBtn = document.getElementById('add-new-tab-btn');

    // --- INICIALIZAÇÃO DO CKEDITOR ---
    async function initCKEditor() {
        try {
            // --- INÍCIO DA NOVA LÓGICA DO PLUGIN 'FORMATAR DOC' ---
            // Este plugin é definido localmente para garantir que ele tenha acesso ao 'editor'
            // no momento certo, resolvendo o erro 'Cannot read properties of undefined (reading 'Command')'.
            function FormatDocPlugin(editor) {
                // Registra o comando 'formatDocument' no núcleo do editor.
                editor.commands.add('formatDocument', {
                    execute: () => {
                        const model = editor.model;
                        const root = model.document.getRoot();

                        // Envolve todas as alterações em um único bloco 'change' para otimização e 'undo'
                        model.change(writer => {
                            // Itera sobre todos os elementos filhos diretos do editor (parágrafos, listas, etc.)
                            for (const child of root.getChildren()) {
                                // Critério 1: Ignora qualquer elemento que não seja um parágrafo.
                                if (!child.is('element', 'paragraph')) {
                                    continue;
                                }

                                // Critério 2: Ignora parágrafos que já fazem parte de um item de lista (numerada ou bullet).
                                if (child.parent && child.parent.is('element', 'listItem')) {
                                    continue;
                                }
                                
                                // Critério 3: Lógica de formatação baseada no atributo de recuo ('indent').
                                const indent = child.getAttribute('indent') || 0;

                                if (indent > 0) {
                                    // Se houver QUALQUER nível de recuo, transforma o parágrafo em uma citação.
                                    // Selecionamos o parágrafo inteiro antes de executar o comando 'blockQuote'.
                                    writer.setSelection(writer.createRangeOn(child));
                                    editor.execute('blockQuote');
                                } else {
                                    // Se não houver recuo, garantimos que o atributo 'indent' seja removido,
                                    // resetando o parágrafo para o alinhamento padrão (à esquerda).
                                    writer.removeAttribute('indent', child);
                                }
                            }
                        });
                        console.log("Documento formatado com sucesso via comando customizado.");
                    }
                });
            }
            // --- FIM DA NOVA LÓGICA DO PLUGIN ---

            const editorInstance = await DecoupledEditor.create(document.querySelector('.text-editor'), {
                // Aqui, registramos nosso plugin customizado in-line.
                extraPlugins: [FormatDocPlugin], 
                toolbar: {
                    items: [
                        'undo', 'redo', '|',
                        'bold', 'italic', 'underline', '|',
                        'bulletedList', 'numberedList', '|',
                        'outdent', 'indent', '|',
                        'blockQuote'
                    ]
                },
                language: 'pt-br'
            });

            document.querySelector('.toolbar').appendChild(editorInstance.ui.view.toolbar.element);
            appState.editor = editorInstance;
            
            // Carrega o conteúdo salvo no LocalStorage ao iniciar
            const savedContent = localStorage.getItem('editorContent');
            if (savedContent) {
                appState.editor.setData(savedContent);
            }

            // Listener para salvar automaticamente o conteúdo do editor
            appState.editor.model.document.on('change:data', () => {
                const content = appState.editor.getData();
                localStorage.setItem('editorContent', content);
                BackupManager.schedule(getStateForBackup());
            });

        } catch (error) {
            console.error('Ocorreu um erro ao inicializar o CKEditor:', error);
        }
    }
    
    // --- LÓGICA DE DADOS (CARREGAR, SALVAR) ---
    function loadState() {
        const savedState = localStorage.getItem('appState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            appState.tabs = parsedState.tabs || [];
            appState.models = parsedState.models || [];
            appState.activeTabId = parsedState.activeTabId || (appState.tabs.length > 0 ? appState.tabs[0].id : null);
            appState.replacements = parsedState.replacements || [];
        } else {
            // Estado inicial se não houver nada salvo
            const defaultTabId = `tab-${Date.now()}`;
            appState.tabs = [{ id: defaultTabId, name: 'Geral', color: '#6c757d' }];
            appState.models = [];
            appState.activeTabId = defaultTabId;
        }
    }

    function saveState() {
        localStorage.setItem('appState', JSON.stringify(getStateForBackup()));
        BackupManager.schedule(getStateForBackup());
    }
    
    function getStateForBackup() {
        // Retorna uma cópia do estado sem a instância do editor
        return {
            tabs: appState.tabs,
            models: appState.models,
            activeTabId: appState.activeTabId,
            replacements: appState.replacements
        };
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO (UI) ---
    function renderTabs() {
        tabsContainer.innerHTML = '';
        appState.tabs.forEach(tab => {
            const tabEl = document.createElement('div');
            tabEl.className = 'tab-item';
            tabEl.textContent = tab.name;
            tabEl.dataset.tabId = tab.id;
            tabEl.style.setProperty('--tab-color', tab.color);
            if (tab.id === appState.activeTabId) {
                tabEl.classList.add('active');
                activeContentArea.style.borderColor = tab.color;
            }
            tabsContainer.appendChild(tabEl);
        });
    }

    function renderModels() {
        modelList.innerHTML = '';
        const filteredModels = getFilteredModels();
        filteredModels.forEach(model => {
            const li = document.createElement('li');
            li.className = 'model-item';
            li.dataset.modelId = model.id;
            
            li.innerHTML = `
                <div class="model-header">
                    <span class="model-color-indicator" style="background-color: ${getTabColorById(model.tabId)};"></span>
                    <span class="model-name">${model.name}</span>
                </div>
                <div class="model-actions">
                    <button class="action-btn add-content-btn" title="Adicionar ao Editor">${ICON_PLUS}</button>
                    <button class="action-btn edit-model-btn" title="Editar Modelo">${ICON_PENCIL}</button>
                    <button class="action-btn delete-model-btn" title="Excluir Modelo">${ICON_TRASH}</button>
                </div>
            `;
            modelList.appendChild(li);
        });
    }
    
    function getFilteredModels() {
        const query = searchBox.value.toLowerCase();
        return appState.models
            .filter(m => m.tabId === appState.activeTabId)
            .filter(m => m.name.toLowerCase().includes(query));
    }
    
    function getTabColorById(tabId) {
        const tab = appState.tabs.find(t => t.id === tabId);
        return tab ? tab.color : '#ccc';
    }
    
    // --- EVENT LISTENERS ---
    
    // ATUALIZAÇÃO DO LISTENER DO BOTÃO 'FORMATAR DOC'
    formatDocBtn.addEventListener('click', () => {
        if (appState.editor) {
            console.log("Executando o comando 'formatDocument'...");
            // A chamada agora é simples e segura, usando a API nativa do editor
            appState.editor.execute('formatDocument');

            // Adiciona um feedback visual temporário para o usuário
            formatDocBtn.classList.add('is-processing');
            setTimeout(() => formatDocBtn.classList.remove('is-processing'), 1000);
        }
    });

    clearDocBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja apagar todo o conteúdo do editor?')) {
            EditorActions.clearDocument(appState.editor);
        }
    });

    tabsContainer.addEventListener('click', e => {
        if (e.target.classList.contains('tab-item')) {
            const tabId = e.target.dataset.tabId;
            appState.activeTabId = tabId;
            renderTabs();
            renderModels();
            saveState();
        }
    });
    
    modelList.addEventListener('click', e => {
        const button = e.target.closest('.action-btn');
        if (!button) return;

        const modelId = button.closest('.model-item').dataset.modelId;
        const model = appState.models.find(m => m.id === modelId);

        if (button.classList.contains('add-content-btn')) {
            if (appState.editor && model) {
                appState.editor.model.change(writer => {
                    const viewFragment = appState.editor.data.processor.toView(model.content);
                    const modelFragment = appState.editor.data.toModel(viewFragment);
                    appState.editor.model.insertContent(modelFragment, appState.editor.model.document.selection);
                });
            }
        } else if (button.classList.contains('edit-model-btn')) {
            if (model) {
                ModalManager.show({
                    title: 'Editar Modelo',
                    type: 'modelEditor',
                    initialData: { name: model.name, content: model.content },
                    onSave: (data) => {
                        model.name = data.name;
                        model.content = data.content;
                        saveState();
                        renderModels();
                    }
                });
            }
        } else if (button.classList.contains('delete-model-btn')) {
             if (confirm(`Tem certeza que deseja excluir o modelo "${model.name}"?`)) {
                appState.models = appState.models.filter(m => m.id !== modelId);
                saveState();
                renderModels();
            }
        }
    });

    searchBox.addEventListener('input', renderModels);
    
    addModelBtn.addEventListener('click', () => {
        ModalManager.show({
            title: 'Criar Novo Modelo',
            type: 'modelEditor',
            initialData: {},
            onSave: (data) => {
                if (!data.name) {
                    alert('O nome do modelo não pode estar vazio.');
                    return;
                }
                const newModel = {
                    id: `model-${Date.now()}`,
                    tabId: appState.activeTabId,
                    name: data.name,
                    content: data.content
                };
                appState.models.push(newModel);
                saveState();
                renderModels();
            }
        });
    });

    addNewTabBtn.addEventListener('click', () => {
        const name = prompt('Digite o nome da nova aba:');
        if (name) {
            const newTab = {
                id: `tab-${Date.now()}`,
                name: name,
                color: '#6c757d' // Cor padrão para novas abas
            };
            appState.tabs.push(newTab);
            appState.activeTabId = newTab.id;
            saveState();
            renderTabs();
            renderModels();
        }
    });
    
    exportBtn.addEventListener('click', () => {
        triggerAutoBackup(getStateForBackup()); // Usa a função de backup-manager.js
    });

    importBtn.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.onchange = e => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = event => {
                    try {
                        const importedState = JSON.parse(event.target.result);
                        if (importedState.tabs && importedState.models) {
                            appState.tabs = importedState.tabs;
                            appState.models = importedState.models;
                            appState.activeTabId = importedState.activeTabId || appState.tabs[0]?.id;
                            appState.replacements = importedState.replacements || [];
                            saveState();
                            renderTabs();
                            renderModels();
                            alert('Backup importado com sucesso!');
                        } else {
                            alert('Arquivo de backup inválido.');
                        }
                    } catch (err) {
                        alert('Erro ao ler o arquivo de backup.');
                        console.error(err);
                    }
                };
                reader.readAsText(file);
            }
        };
        fileInput.click();
    });

    // --- FUNÇÃO DE INICIALIZAÇÃO GERAL ---
    function initializeApp() {
        loadState();
        renderTabs();
        renderModels();
        initCKEditor();
    }

    initializeApp();
});
