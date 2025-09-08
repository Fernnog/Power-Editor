document.addEventListener('DOMContentLoaded', () => {
    const app = (() => {
        let editorInstance = null;
        let appState = {
            activeTabId: null,
            tabs: [],
            models: [],
            replacements: []
        };

        // ELEMENTOS DO DOM
        const modelListEl = document.getElementById('model-list');
        const tabsContainerEl = document.getElementById('tabs-container');
        const searchBoxEl = document.getElementById('search-box');

        function _initializeState() {
            const savedState = localStorage.getItem('appState');
            if (savedState) {
                appState = JSON.parse(savedState);
            } else {
                // Estado inicial padrão
                const defaultTabId = `tab-${Date.now()}`;
                appState = {
                    activeTabId: defaultTabId,
                    tabs: [{ id: defaultTabId, name: 'Geral', color: '#6c757d' }],
                    models: [],
                    replacements: []
                };
            }
            if (!appState.tabs.find(t => t.id === 'favorites')) {
                appState.tabs.unshift({ id: 'favorites', name: 'Favoritos', color: '#ffc107', isFavoriteTab: true });
            }
            if (!appState.activeTabId) {
                appState.activeTabId = appState.tabs[0]?.id;
            }
        }

        function _saveState() {
            localStorage.setItem('appState', JSON.stringify(appState));
        }

        function _renderTabs() {
            tabsContainerEl.innerHTML = '';
            appState.tabs.forEach(tab => {
                const tabEl = document.createElement('div');
                tabEl.className = 'tab-item';
                tabEl.dataset.tabId = tab.id;
                tabEl.textContent = tab.name;
                tabEl.style.setProperty('--tab-color', tab.color);
                if (tab.id === appState.activeTabId) {
                    tabEl.classList.add('active');
                }
                tabsContainerEl.appendChild(tabEl);
            });
        }

        function _renderModelList(tabId) {
            modelListEl.innerHTML = '';
            const modelsToRender = appState.models
                .filter(model => (tabId === 'favorites' ? model.isFavorite : model.tabId === tabId))
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            modelsToRender.forEach(model => {
                const item = document.createElement('li');
                item.className = 'model-item';
                item.dataset.modelId = model.id;
                item.innerHTML = `
                    <div class="model-header">
                        <span class="model-name">${model.name}</span>
                    </div>
                    <div class="model-actions">
                        <button class="action-btn add-content" title="Adicionar ao editor">${ICON_PLUS}</button>
                        <button class="action-btn edit-model" title="Editar">${ICON_PENCIL}</button>
                        <button class="action-btn move-model" title="Mover para outra aba">${ICON_MOVE}</button>
                        <button class="action-btn delete-model" title="Excluir">${ICON_TRASH}</button>
                        <button class="action-btn favorite-model" title="Favoritar">
                            ${model.isFavorite ? ICON_STAR_FILLED : ICON_STAR_OUTLINE}
                        </button>
                    </div>
                `;
                modelListEl.appendChild(item);
            });
        }
        
        function _addNewTab(name) {
            if (!name || !name.trim()) return;
            const newTab = {
                id: `tab-${Date.now()}`,
                name: name.trim(),
                color: '#6c757d'
            };
            appState.tabs.push(newTab);
            _saveState();
            BackupManager.schedule(appState); // Aciona backup após modificação
            _renderTabs();
            _setActiveTab(newTab.id);
        }

        function _saveModel(modelData) {
            const { id, name, content } = modelData;
            if (!name) {
                alert('O nome do modelo não pode estar vazio.');
                return;
            }
            if (id) { // Editando
                const model = appState.models.find(m => m.id === id);
                if (model) {
                    model.name = name;
                    model.content = content;
                }
            } else { // Criando
                appState.models.push({
                    id: `model-${Date.now()}`,
                    tabId: appState.activeTabId,
                    name,
                    content,
                    isFavorite: false
                });
            }
            _saveState();
            BackupManager.schedule(appState); // Aciona backup após modificação
            _renderModelList(appState.activeTabId);
        }
        
        function _deleteModel(modelId) {
            if(confirm('Tem certeza que deseja excluir este modelo?')) {
                appState.models = appState.models.filter(m => m.id !== modelId);
                _saveState();
                BackupManager.schedule(appState); // Aciona backup após modificação
                _renderModelList(appState.activeTabId);
            }
        }

        function _setActiveTab(tabId) {
            appState.activeTabId = tabId;
            _saveState(); 
            // Não precisa de backup aqui, pois o estado não foi modificado, apenas a visualização
            _renderTabs();
            _renderModelList(tabId);
        }
        
        function _exportData() {
            const dataStr = JSON.stringify(appState, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_modelos_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        function _importData() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = e => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = event => {
                        try {
                            const importedState = JSON.parse(event.target.result);
                            if (importedState.tabs && importedState.models) {
                                if(confirm('Isso substituirá todos os seus modelos e abas atuais. Deseja continuar?')) {
                                    appState = importedState;
                                    _saveState();
                                    BackupManager.schedule(appState); // Aciona backup após modificação
                                    _initializeUI();
                                }
                            } else {
                                alert('Arquivo de backup inválido.');
                            }
                        } catch (err) {
                            alert('Erro ao ler o arquivo de backup.');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        }

        function _attachEventListeners() {
            // INÍCIO DA ALTERAÇÃO: Apontar para os novos IDs dos botões de ícone
            document.getElementById('add-tab-icon-btn').addEventListener('click', () => {
                const tabName = prompt('Digite o nome da nova aba:');
                if (tabName) _addNewTab(tabName);
            });
            document.getElementById('import-btn-icon').addEventListener('click', _importData);
            document.getElementById('export-btn-icon').addEventListener('click', _exportData);
            // FIM DA ALTERAÇÃO

            document.getElementById('format-doc-btn').addEventListener('click', () => {
                if (editorInstance) {
                    editorInstance.execute('formatDocument');
                }
            });
            
            document.getElementById('clear-doc-btn').addEventListener('click', () => {
                if (editorInstance && confirm('Tem certeza que deseja apagar todo o conteúdo do editor?')) {
                    EditorActions.clearDocument(editorInstance);
                }
            });

            tabsContainerEl.addEventListener('click', (e) => {
                const tabItem = e.target.closest('.tab-item');
                if (tabItem) {
                    _setActiveTab(tabItem.dataset.tabId);
                }
            });
            
            modelListEl.addEventListener('click', (e) => {
                const modelId = e.target.closest('.model-item')?.dataset.modelId;
                if (!modelId) return;

                const model = appState.models.find(m => m.id === modelId);

                if (e.target.closest('.add-content')) {
                    editorInstance.model.change(writer => {
                        const viewFragment = editorInstance.data.processor.toView(model.content);
                        const modelFragment = editorInstance.data.toModel(viewFragment);
                        editorInstance.model.insertContent(modelFragment, editorInstance.model.document.selection);
                    });
                } else if (e.target.closest('.edit-model')) {
                    ModalManager.show({
                        type: 'modelEditor',
                        title: 'Editar Modelo',
                        initialData: { id: model.id, name: model.name, content: model.content },
                        onSave: (data) => _saveModel({ ...data, id: model.id })
                    });
                } else if (e.target.closest('.delete-model')) {
                    _deleteModel(modelId);
                }
            });
        }
        
        function _initializeUI() {
            _renderTabs();
            _renderModelList(appState.activeTabId);
            
            // Preenche os ícones que são definidos em ui-icons.js
            document.getElementById('add-tab-icon-btn').innerHTML = ICON_PLUS;
            document.getElementById('import-btn-icon').innerHTML = ICON_AI_BRAIN; // Placeholder icon
            document.getElementById('export-btn-icon').innerHTML = ICON_REPLACE; // Placeholder icon
        }

        function _initializeEditor() {
            DecoupledEditor
                .create(document.querySelector('.text-editor'), {
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
                })
                .then(editor => {
                    editorInstance = editor;
                    const toolbarContainer = document.querySelector('.toolbar');
                    toolbarContainer.appendChild(editor.ui.view.toolbar.element);
                    window.editor = editor; 
                })
                .catch(error => {
                    console.error('Ocorreu um erro ao inicializar o CKEditor:', error);
                });
        }

        return {
            init: () => {
                _initializeState();
                _initializeUI();
                _attachEventListeners();
                _initializeEditor();
            }
        };
    })();

    app.init();
});
