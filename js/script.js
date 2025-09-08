// js/script.js (Versão Completa e Corrigida)

document.addEventListener('DOMContentLoaded', () => {
    _renderStaticIcons();
    _initializeApp();
});

let appState = {
    tabs: [],
    models: {},
    activeTabId: null,
};

let editor = null;

/**
 * Ponto de entrada da aplicação. Carrega o estado e inicializa a UI e o editor.
 */
function _initializeApp() {
    _loadState();
    _initializeUI();
    _initializeEditor();
    _attachEventListeners();
}

/**
 * Renderiza os ícones estáticos da aplicação que não dependem do estado.
 * CORREÇÃO: Esta função preenche os botões da sidebar, tornando-os visíveis.
 */
function _renderStaticIcons() {
    try {
        document.getElementById('add-tab-icon-btn').innerHTML = ICON_PLUS;
        document.getElementById('import-btn-icon').innerHTML = ICON_MOVE; // Ícone para Importar
        document.getElementById('export-btn-icon').innerHTML = ICON_PALETTE; // Ícone para Exportar
    } catch (error) {
        console.error("Erro ao renderizar ícones estáticos. Verifique se os IDs dos botões no HTML estão corretos.", error);
    }
}

/**
 * Carrega o estado da aplicação do LocalStorage. Se não houver estado, cria um padrão.
 */
function _loadState() {
    const savedState = localStorage.getItem('documentEditorState');
    if (savedState) {
        appState = JSON.parse(savedState);
    } else {
        // Estado inicial padrão se não houver nada salvo
        const defaultTabId = `tab-${Date.now()}`;
        appState = {
            tabs: [{ id: defaultTabId, name: 'Geral', color: '#6c757d' }],
            models: { [defaultTabId]: [] },
            activeTabId: defaultTabId,
        };
        _saveState();
    }
}

/**
 * Salva o estado atual da aplicação no LocalStorage.
 */
function _saveState() {
    localStorage.setItem('documentEditorState', JSON.stringify(appState));
}

/**
 * Inicializa e renderiza os componentes da interface (abas, lista de modelos).
 */
function _initializeUI() {
    _renderTabs();
    if (appState.activeTabId) {
        _renderModelList(appState.activeTabId);
    }
}

/**
 * Inicializa a instância do CKEditor.
 * CORREÇÃO: Adiciona `extraPlugins` para carregar nosso comando customizado.
 */
function _initializeEditor() {
    DecoupledEditor
        .create(document.querySelector('.text-editor'), {
            language: 'pt-br',
            toolbar: {
                items: [
                    'undo', 'redo', '|', 'bold', 'italic', 'underline', '|',
                    'bulletedList', 'numberedList', '|', 'outdent', 'indent', '|', 'blockQuote'
                ]
            },
            // ATIVAÇÃO DO PLUGIN "FORMATAR DOC"
            extraPlugins: [FormatDocPlugin],
        })
        .then(newEditor => {
            editor = newEditor;
            window.editor = newEditor; // Para acesso global se necessário
            document.querySelector('.toolbar').appendChild(editor.ui.view.toolbar.element);
        })
        .catch(error => {
            console.error('Ocorreu um erro ao inicializar o CKEditor:', error);
        });
}

/**
 * Anexa todos os listeners de eventos da aplicação.
 * CORREÇÃO: Aponta para os novos IDs dos botões da sidebar.
 */
function _attachEventListeners() {
    // Listeners da Toolbar
    document.getElementById('format-doc-btn').addEventListener('click', () => {
        if (editor) {
            editor.execute('formatDocument');
        }
    });

    document.getElementById('clear-doc-btn').addEventListener('click', () => {
        if (editor && confirm('Tem certeza que deseja apagar todo o conteúdo?')) {
            EditorActions.clearDocument(editor);
        }
    });
    
    // Listeners da Sidebar (com IDs corrigidos)
    document.getElementById('add-tab-icon-btn').addEventListener('click', () => {
        const tabName = prompt('Digite o nome da nova aba:');
        if (tabName && tabName.trim()) {
            _addNewTab(tabName.trim());
        }
    });

    document.getElementById('import-btn-icon').addEventListener('click', _importData);
    document.getElementById('export-btn-icon').addEventListener('click', _exportData);
}

// --- Funções de Renderização da UI ---

function _renderTabs() {
    const tabsContainer = document.querySelector('.tabs-container');
    tabsContainer.innerHTML = '';
    appState.tabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.className = 'tab-item';
        tabEl.textContent = tab.name;
        tabEl.dataset.tabId = tab.id;
        tabEl.style.setProperty('--tab-color', tab.color || '#6c757d');
        if (tab.id === appState.activeTabId) {
            tabEl.classList.add('active');
        }
        tabEl.addEventListener('click', () => _setActiveTab(tab.id));
        tabsContainer.appendChild(tabEl);
    });
}

function _renderModelList(tabId) {
    const modelListEl = document.getElementById('model-list');
    modelListEl.innerHTML = '';
    const models = appState.models[tabId] || [];

    if (models.length === 0) {
        modelListEl.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">Nenhum modelo nesta aba.</p>';
        return;
    }

    models.forEach(model => {
        const item = document.createElement('li');
        item.className = 'model-item';
        item.innerHTML = `
            <div class="model-header">
                <span class="model-name">${model.name}</span>
            </div>
            <div class="model-actions">
                <button class="action-btn add-btn" title="Adicionar ao editor">${ICON_PLUS}</button>
                <button class="action-btn edit-btn" title="Editar modelo">${ICON_PENCIL}</button>
                <button class="action-btn delete-btn" title="Excluir modelo">${ICON_TRASH}</button>
            </div>
        `;
        // Adicionar eventos para os botões do modelo aqui (add, edit, delete)
        item.querySelector('.add-btn').addEventListener('click', () => {
            if(editor) editor.setData(editor.getData() + model.content);
        });
        item.querySelector('.edit-btn').addEventListener('click', () => _editModel(model.id));
        item.querySelector('.delete-btn').addEventListener('click', () => _deleteModel(model.id));
        
        modelListEl.appendChild(item);
    });
}

// --- Funções de Manipulação de Estado (CRUD) ---

function _addNewTab(name) {
    const newTabId = `tab-${Date.now()}`;
    appState.tabs.push({ id: newTabId, name: name, color: '#6c757d' });
    appState.models[newTabId] = [];
    _saveState();
    _setActiveTab(newTabId);
    BackupManager.schedule(appState);
}

function _setActiveTab(tabId) {
    appState.activeTabId = tabId;
    _saveState();
    _renderTabs();
    _renderModelList(tabId);
}

function _editModel(modelId) {
    // Lógica para abrir o modal de edição
    alert(`Lógica de edição para o modelo ${modelId} a ser implementada.`);
}

function _deleteModel(modelId) {
    if (confirm('Tem certeza que deseja excluir este modelo?')) {
        const models = appState.models[appState.activeTabId];
        const modelIndex = models.findIndex(m => m.id === modelId);
        if (modelIndex > -1) {
            models.splice(modelIndex, 1);
            _saveState();
            _renderModelList(appState.activeTabId);
            BackupManager.schedule(appState);
        }
    }
}

// --- Funções de Importação e Exportação ---

function _exportData() {
    const dataStr = JSON.stringify(appState, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Modelos_Documentos_Backup.json';
    a.click();
    URL.revokeObjectURL(url);
}

function _importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = readerEvent => {
                try {
                    const content = readerEvent.target.result;
                    const newState = JSON.parse(content);
                    if (newState.tabs && newState.models) {
                        appState = newState;
                        _saveState();
                        _initializeApp(); // Reinicializa a UI com os novos dados
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
    input.click();
}
