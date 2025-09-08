// js/script.js

document.addEventListener('DOMContentLoaded', () => {
    let appState = {
        tabs: [],
        models: [],
        activeTabId: null,
        replacements: []
    };
    let editorInstance = null;
    
    // Elementos da UI
    const tabsContainer = document.getElementById('tabs-container');
    const modelList = document.getElementById('model-list');
    const activeContentArea = document.getElementById('active-content-area');
    const searchBox = document.getElementById('search-box');
    const searchClearBtn = document.querySelector('.search-clear-btn');
    const addNewModelBtn = document.getElementById('add-new-model-btn');
    const addNewTabBtn = document.getElementById('add-new-tab-btn');
    const importBtn = document.getElementById('import-btn');
    const exportBtn = document.getElementById('export-btn');
    const fileInput = document.getElementById('file-input');
    const formatDocBtn = document.getElementById('format-doc-btn');
    const clearDocBtn = document.getElementById('clear-doc-btn');

    // Funções de Inicialização
    function _initializeApp() {
        _loadState();
        _initializeCKEditor();
        _attachEventListeners();
        _renderAll();
    }
    
    function _loadState() {
        const savedState = localStorage.getItem('docEditorState');
        if (savedState) {
            appState = JSON.parse(savedState);
            // Garante que a estrutura mínima exista
            appState.tabs = appState.tabs || [];
            appState.models = appState.models || [];
            appState.replacements = appState.replacements || [];
            if (appState.tabs.length > 0 && !appState.activeTabId) {
                appState.activeTabId = appState.tabs[0].id;
            }
        } else {
            // Estado inicial padrão se não houver nada salvo
            const defaultTabId = `tab-${Date.now()}`;
            appState = {
                tabs: [{ id: defaultTabId, name: 'Geral', color: '#6c757d' }],
                models: [],
                activeTabId: defaultTabId,
                replacements: []
            };
            _saveState();
        }
    }

    function _saveState() {
        localStorage.setItem('docEditorState', JSON.stringify(appState));
        BackupManager.schedule(appState);
    }

    function _initializeCKEditor() {
        DecoupledEditor
            .create(document.querySelector('.text-editor'), {
                // MODIFICAÇÃO: Adiciona nosso plugin customizado à inicialização do editor.
                // Esta linha garante que o CKEditor carregue e registre nosso comando 'formatDocument'.
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
                
                // Aplica a lógica de substituição automática ao digitar
                editor.model.document.on('change:data', () => {
                    const changes = editor.model.document.differ.getChanges();
                    if (changes.some(change => change.type === 'insert' && change.length > 0)) {
                       _applyReplacements();
                    }
                });

            })
            .catch(error => {
                console.error('Ocorreu um erro ao inicializar o CKEditor:', error);
            });
    }

    // Funções de Renderização
    function _renderAll() {
        _renderTabs();
        _renderModels();
    }

    function _renderTabs() {
        tabsContainer.innerHTML = '';
        appState.tabs.forEach(tab => {
            const tabEl = document.createElement('div');
            tabEl.className = `tab-item ${tab.id === appState.activeTabId ? 'active' : ''}`;
            tabEl.textContent = tab.name;
            tabEl.dataset.tabId = tab.id;
            tabEl.style.setProperty('--tab-color', tab.color);
            tabsContainer.appendChild(tabEl);
        });
        
        const activeTab = appState.tabs.find(t => t.id === appState.activeTabId);
        if (activeTab) {
            activeContentArea.style.borderColor = activeTab.color;
        }
    }

    function _renderModels() {
        modelList.innerHTML = '';
        const query = searchBox.value.toLowerCase();
        const modelsInTab = appState.models.filter(m => m.tabId === appState.activeTabId);
        
        const filteredModels = modelsInTab.filter(model => {
             return model.name.toLowerCase().includes(query) || model.content.toLowerCase().includes(query);
        });

        filteredModels.forEach(model => {
            const li = document.createElement('li');
            li.className = 'model-item';
            li.dataset.modelId = model.id;
            
            li.innerHTML = `
                <div class="model-header">
                    <span class="model-name">${model.name}</span>
                </div>
                <div class="model-actions">
                    <button class="action-btn add-to-editor" title="Adicionar ao Editor">${ICON_PLUS}</button>
                    <button class="action-btn edit-model" title="Editar Modelo">${ICON_PENCIL}</button>
                    <button class="action-btn delete-model" title="Excluir Modelo">${ICON_TRASH}</button>
                    <button class="action-btn move-model" title="Mover para outra Aba">${ICON_MOVE}</button>
                </div>
            `;
            modelList.appendChild(li);
        });
    }

    // Lógica de Eventos
    function _attachEventListeners() {
        tabsContainer.addEventListener('click', e => {
            if (e.target.classList.contains('tab-item')) {
                appState.activeTabId = e.target.dataset.tabId;
                _saveState();
                _renderAll();
            }
        });
        
        modelList.addEventListener('click', e => {
            const button = e.target.closest('.action-btn');
            if (!button) return;

            const modelId = button.closest('.model-item').dataset.modelId;
            
            if (button.classList.contains('add-to-editor')) {
                const model = appState.models.find(m => m.id === modelId);
                if (model && editorInstance) {
                    editorInstance.model.change(writer => {
                       const contentFragment = editorInstance.data.processor.toView(model.content);
                       const modelFragment = editorInstance.data.toModel(contentFragment);
                       editorInstance.model.insertContent(modelFragment, editorInstance.model.document.selection);
                    });
                }
            } else if (button.classList.contains('edit-model')) {
                _handleEditModel(modelId);
            } else if (button.classList.contains('delete-model')) {
                if (confirm('Tem certeza que deseja excluir este modelo?')) {
                    appState.models = appState.models.filter(m => m.id !== modelId);
                    _saveState();
                    _renderModels();
                }
            }
        });

        searchBox.addEventListener('input', () => {
            _renderModels();
            searchClearBtn.style.display = searchBox.value ? 'block' : 'none';
        });

        searchClearBtn.addEventListener('click', () => {
            searchBox.value = '';
            searchClearBtn.style.display = 'none';
            _renderModels();
        });
        
        addNewModelBtn.addEventListener('click', () => _handleEditModel(null));

        addNewTabBtn.addEventListener('click', () => {
            const name = prompt('Nome da nova aba:');
            if (name) {
                const newTab = { id: `tab-${Date.now()}`, name, color: '#6c757d' };
                appState.tabs.push(newTab);
                appState.activeTabId = newTab.id;
                _saveState();
                _renderAll();
            }
        });
        
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', _handleImport);
        exportBtn.addEventListener('click', _handleExport);
        
        // MODIFICAÇÃO: O botão agora executa o comando nativo do editor.
        // A lógica complexa foi movida para o plugin 'ckeditor-formatdoc-command.js'.
        // Esta chamada é mais limpa, estável e se integra ao histórico de ações do editor.
        formatDocBtn.addEventListener('click', () => {
            if (editorInstance) {
                editorInstance.execute('formatDocument');
            }
        });

        clearDocBtn.addEventListener('click', () => {
            if (editorInstance && confirm('Tem certeza que deseja apagar todo o conteúdo do documento?')) {
                editorInstance.setData('');
            }
        });
    }

    // Handlers de Ações
    function _handleEditModel(modelId) {
        const isNew = !modelId;
        const modelData = isNew 
            ? { name: '', content: '' } 
            : appState.models.find(m => m.id === modelId);

        ModalManager.show({
            type: 'modelEditor',
            title: isNew ? 'Criar Novo Modelo' : 'Editar Modelo',
            initialData: modelData,
            onSave: (data) => {
                if (!data.name) {
                    alert('O nome do modelo não pode ser vazio.');
                    return;
                }
                if (isNew) {
                    appState.models.push({
                        id: `model-${Date.now()}`,
                        tabId: appState.activeTabId,
                        name: data.name,
                        content: data.content
                    });
                } else {
                    const modelIndex = appState.models.findIndex(m => m.id === modelId);
                    appState.models[modelIndex] = { ...appState.models[modelIndex], ...data };
                }
                _saveState();
                _renderModels();
            }
        });
    }

    function _handleImport(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const importedState = JSON.parse(e.target.result);
                    if (confirm('Isso substituirá todos os seus dados atuais. Continuar?')) {
                        appState = importedState;
                        appState.activeTabId = appState.tabs.length > 0 ? appState.tabs[0].id : null;
                        _saveState();
                        _renderAll();
                        alert('Dados importados com sucesso!');
                    }
                } catch (err) {
                    alert('Erro ao ler o arquivo. Verifique se é um JSON válido.');
                }
            };
            reader.readAsText(file);
            fileInput.value = ''; // Reseta o input para permitir importar o mesmo arquivo novamente
        }
    }
    
    function _handleExport() {
        const dataStr = JSON.stringify(appState, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'meus-modelos-backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function _applyReplacements() {
        if (!editorInstance || appState.replacements.length === 0) return;

        const model = editorInstance.model;
        model.change(writer => {
            for(const rule of appState.replacements) {
                const ranges = model.document.getRoot().getRanges();
                for (const range of ranges) {
                    const results = model.find(rule.find, range);
                    for (const result of results) {
                        model.insertContent(writer.createText(rule.replace), result.range);
                    }
                }
            }
        });
    }

    // Iniciar a aplicação
    _initializeApp();
});
