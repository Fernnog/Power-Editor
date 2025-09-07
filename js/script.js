// js/script.js

// --- DADOS E ESTADO DA APLICAÇÃO ---
let appState = {};
let ckEditorInstance = null; // Variável para armazenar a instância do CKEditor
const FAVORITES_TAB_ID = 'favorites-tab-id';
const TAB_COLORS = ['#34D399', '#60A5FA', '#FBBF24', '#F87171', '#A78BFA', '#2DD4BF', '#F472B6', '#818CF8', '#FB923C', '#EC4899', '#10B981', '#3B82F6'];

let colorIndex = 0;
let backupDebounceTimer;

const defaultModels = [
    { name: "IDPJ - Criação de Relatório de Sentença", content: "Este é o texto para a criação do relatório de sentença. Inclui seções sobre <b>fatos</b>, <i>fundamentos</i> e <u>dispositivo</u>." },
    { name: "IDPJ - Criar texto de ADMISSIBILIDADE", content: "Texto padrão para a análise de admissibilidade do Incidente de Desconsideração da Personalidade Jurídica." },
    { name: "IDPJ - RELATÓRIO de endereços", content: "Relatório gerado a partir da consulta de endereços nos sistemas conveniados. Segue abaixo a tabela:" }
];

// --- REFERÊNCIAS AOS ELEMENTOS DO HTML ---
const modelList = document.getElementById('model-list');
const searchBox = document.getElementById('search-box');
const tabsContainer = document.getElementById('tabs-container');
const addNewTabBtn = document.getElementById('add-new-tab-btn');
const addNewModelBtn = document.getElementById('add-new-model-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file-input');
const formatDocBtn = document.getElementById('format-doc-btn');
const clearDocBtn = document.getElementById('clear-doc-btn');
const tabActionsContainer = document.getElementById('tab-actions-container');
const sidebarBtnAi = document.getElementById('sidebar-btn-ai');
const sidebarBtnDictate = document.getElementById('sidebar-btn-dictate');
const sidebarBtnReplace = document.getElementById('sidebar-btn-replace');

// --- LÓGICA DE BACKUP E MODIFICAÇÃO DE ESTADO CENTRALIZADA ---

function renderBackupStatus() {
    const card = document.getElementById('backup-status-card');
    if (!card) return;

    if (appState.lastBackupTimestamp) {
        const date = new Date(appState.lastBackupTimestamp);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        card.innerHTML = `<span>Último Backup: ${day}/${month}/${year} ${hours}:${minutes}</span>`;
    } else {
        card.innerHTML = '<span>Nenhum backup recente.</span>';
    }
}

function triggerAutoBackup() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}`;
    const filename = `${timestamp}_ModelosDosMeusDocumentos.json`;

    appState.lastBackupTimestamp = now.toISOString();
    renderBackupStatus();

    const dataStr = JSON.stringify(appState, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function debouncedTriggerAutoBackup() { clearTimeout(backupDebounceTimer); backupDebounceTimer = setTimeout(() => { triggerAutoBackup(); }, 2500); }
function modifyStateAndBackup(modificationFn) { modificationFn(); saveStateToStorage(); debouncedTriggerAutoBackup(); }
function getNextColor() { const color = TAB_COLORS[colorIndex % TAB_COLORS.length]; colorIndex++; return color; }

// --- FUNÇÕES DE PERSISTÊNCIA ---
function saveStateToStorage() { localStorage.setItem('editorModelosApp', JSON.stringify(appState)); }
function loadStateFromStorage() {
    const savedState = localStorage.getItem('editorModelosApp');
    const setDefaultState = () => {
        const defaultTabId = `tab-${Date.now()}`;
        colorIndex = 0;
        appState = { models: defaultModels.map((m, i) => ({ id: `model-${Date.now() + i}`, name: m.name, content: m.content, tabId: defaultTabId, isFavorite: false })), tabs: [{ id: FAVORITES_TAB_ID, name: 'Favoritos', color: '#6c757d' }, { id: defaultTabId, name: 'Geral', color: getNextColor() }], activeTabId: defaultTabId, replacements: [], lastBackupTimestamp: null };
    };

    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            if (Array.isArray(parsedState.models) && Array.isArray(parsedState.tabs)) {
                appState = parsedState;
                if (!appState.tabs.find(t => t.id === FAVORITES_TAB_ID)) {
                    appState.tabs.unshift({ id: FAVORITES_TAB_ID, name: 'Favoritos', color: '#6c757d' });
                }
                appState.tabs.forEach(tab => {
                    if (!tab.color && tab.id !== FAVORITES_TAB_ID) {
                        tab.color = getNextColor();
                    }
                });
                if (!appState.replacements) {
                    appState.replacements = [];
                }
            } else {
                throw new Error("Formato de estado inválido.");
            }
        } catch (e) {
            console.error("Falha ao carregar estado do LocalStorage, restaurando para o padrão:", e);
            setDefaultState();
        }
    } else {
        setDefaultState();
    }
    renderBackupStatus();
    
    if (!appState.tabs.find(t => t.id === appState.activeTabId)) { appState.activeTabId = appState.tabs.find(t => t.id !== FAVORITES_TAB_ID)?.id || appState.tabs[0]?.id || null; }
}

// --- FUNÇÕES DO EDITOR (ATUALIZADA) ---
function insertModelContent(content, tabId) {
    if (searchBox.value && tabId && appState.activeTabId !== tabId) {
        appState.activeTabId = tabId;
        searchBox.value = '';
        render();
    }
    if (ckEditorInstance) {
        const editor = ckEditorInstance;
        
        editor.model.change(writer => {
            const viewFragment = editor.data.processor.toView(content);
            const modelFragment = editor.data.toModel(viewFragment);
            editor.model.insertContent(modelFragment, editor.model.document.selection);
        });

        editor.editing.view.focus();
    }
}

// --- FUNÇÕES DE RENDERIZAÇÃO ---
function renderTabActions() {
    tabActionsContainer.innerHTML = '';
    const activeTab = appState.tabs.find(t => t.id === appState.activeTabId);

    if (!activeTab || activeTab.id === FAVORITES_TAB_ID) {
        tabActionsContainer.classList.remove('visible');
        return;
    }

    const regularTabsCount = appState.tabs.filter(t => t.id !== FAVORITES_TAB_ID).length;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'tab-action-btn';
    deleteBtn.innerHTML = ICON_TRASH;
    deleteBtn.title = 'Excluir esta aba';
    if (regularTabsCount <= 1) {
        deleteBtn.disabled = true;
    }
    deleteBtn.onclick = () => deleteTab(appState.activeTabId);
    tabActionsContainer.appendChild(deleteBtn);

    const colorBtn = document.createElement('button');
    colorBtn.className = 'tab-action-btn';
    colorBtn.innerHTML = ICON_PALETTE;
    colorBtn.title = 'Alterar cor da aba';
    colorBtn.onclick = (event) => {
        event.stopPropagation();
        toggleColorPalette(tabActionsContainer, activeTab);
    };
    tabActionsContainer.appendChild(colorBtn);

    const renameBtn = document.createElement('button');
    renameBtn.className = 'tab-action-btn';
    renameBtn.innerHTML = ICON_PENCIL;
    renameBtn.title = 'Renomear esta aba';
    renameBtn.onclick = () => {
        const newName = prompt('Digite o novo nome para a aba:', activeTab.name);
        if (newName && newName.trim()) {
            modifyStateAndBackup(() => {
                activeTab.name = newName.trim();
                render();
            });
        }
    };
    tabActionsContainer.appendChild(renameBtn);

    tabActionsContainer.classList.add('visible');
}

function toggleColorPalette(anchorElement, tab) {
    const existingPalette = document.querySelector('.color-palette-popup');
    if (existingPalette) {
        existingPalette.remove();
        return;
    }

    const palette = document.createElement('div');
    palette.className = 'color-palette-popup';
    
    TAB_COLORS.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.onclick = () => {
            modifyStateAndBackup(() => {
                tab.color = color;
                render();
            });
            palette.remove();
        };
        palette.appendChild(swatch);
    });

    anchorElement.appendChild(palette);

    setTimeout(() => {
        document.addEventListener('click', () => palette.remove(), { once: true });
    }, 0);
}

function render() {
    renderTabs();
    renderModels(filterModels());
    renderTabActions();
}

function renderTabs() {
    tabsContainer.innerHTML = '';
    const activeContentArea = document.getElementById('active-content-area');
    let activeTabColor = '#ccc';

    appState.tabs.forEach(tab => {
        const tabEl = document.createElement('button');
        tabEl.className = 'tab-item';
        tabEl.dataset.tabId = tab.id;
        
        const tabColor = tab.color || '#6c757d';
        tabEl.style.setProperty('--tab-color', tabColor);

        if (tab.id === appState.activeTabId) {
            tabEl.classList.add('active');
            activeTabColor = tabColor;
        }

        tabEl.textContent = tab.name + (tab.id === FAVORITES_TAB_ID ? ' ⭐' : '');
        
        tabEl.addEventListener('click', () => {
            appState.activeTabId = tab.id;
            searchBox.value = '';
            render();
        });
        
        tabsContainer.appendChild(tabEl);
    });
    
    activeContentArea.style.borderColor = activeTabColor;
}

function renderModels(modelsToRender) {
    modelList.innerHTML = '';
    modelsToRender.forEach(model => {
        const li = document.createElement('li');
        li.className = 'model-item';
        const headerDiv = document.createElement('div');
        headerDiv.className = 'model-header';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'model-name';
        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'model-color-indicator';
        const parentTab = appState.tabs.find(t => t.id === model.tabId);
        colorIndicator.style.backgroundColor = parentTab ? parentTab.color : '#ccc';
        nameSpan.appendChild(colorIndicator);
        const textNode = document.createTextNode(" " + model.name);
        nameSpan.appendChild(textNode);
        headerDiv.appendChild(nameSpan);
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'model-actions';
        
        const addButton = document.createElement('button');
        addButton.className = 'action-btn';
        addButton.innerHTML = ICON_PLUS;
        addButton.title = 'Inserir modelo';
        addButton.onclick = () => insertModelContent(model.content, model.tabId);
        
        const editButton = document.createElement('button');
        editButton.className = 'action-btn';
        editButton.innerHTML = ICON_PENCIL;
        editButton.title = 'Editar modelo';
        editButton.onclick = () => editModel(model.id);
        
        const moveButton = document.createElement('button');
        moveButton.className = 'action-btn';
        moveButton.innerHTML = ICON_MOVE;
        moveButton.title = 'Mover para outra aba';
        moveButton.onclick = () => moveModelToAnotherTab(model.id);
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'action-btn';
        deleteButton.innerHTML = ICON_TRASH;
        deleteButton.title = 'Excluir modelo';
        deleteButton.onclick = () => deleteModel(model.id);
        
        const favoriteButton = document.createElement('button');
        favoriteButton.className = 'action-btn';
        favoriteButton.innerHTML = model.isFavorite ? ICON_STAR_FILLED : ICON_STAR_OUTLINE;
        favoriteButton.title = model.isFavorite ? 'Desfavoritar' : 'Favoritar';
        favoriteButton.onclick = () => toggleFavorite(model.id);

        actionsDiv.appendChild(addButton);
        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(moveButton);
        actionsDiv.appendChild(deleteButton);
        actionsDiv.appendChild(favoriteButton);
        li.appendChild(headerDiv);
        li.appendChild(actionsDiv);
        modelList.appendChild(li);
    });
}
let debounceTimer;
function debouncedFilter() { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { renderModels(filterModels()); }, 250); }
function filterModels() { const query = searchBox.value.toLowerCase().trim(); const activeContentArea = document.getElementById('active-content-area'); activeContentArea.style.borderColor = appState.tabs.find(t=>t.id === appState.activeTabId)?.color || '#ccc'; if (query) { activeContentArea.style.borderColor = '#aaa'; } if (!query) { if (appState.activeTabId === FAVORITES_TAB_ID) { return appState.models.filter(m => m.isFavorite); } else { return appState.models.filter(m => m.tabId === appState.activeTabId); } } const models = appState.models; if (query.includes(' ou ')) { const terms = query.split(' ou ').map(t => t.trim()).filter(Boolean); return models.filter(model => { const modelText = (model.name + ' ' + model.content).toLowerCase(); return terms.some(term => modelText.includes(term)); }); } else if (query.includes(' e ')) { const terms = query.split(' e ').map(t => t.trim()).filter(Boolean); return models.filter(model => { const modelText = (model.name + ' ' + model.content).toLowerCase(); return terms.every(term => modelText.includes(term)); }); } else { return models.filter(model => model.name.toLowerCase().includes(query) || model.content.toLowerCase().includes(query) ); } }

// --- MANIPULAÇÃO DE DADOS ---
function addNewTab() { const name = prompt("Digite o nome da nova aba:"); if (name && name.trim()) { modifyStateAndBackup(() => { const newTab = { id: `tab-${Date.now()}`, name: name.trim(), color: getNextColor() }; appState.tabs.push(newTab); appState.activeTabId = newTab.id; render(); }); } }
function deleteTab(tabId) { const tabToDelete = appState.tabs.find(t => t.id === tabId); if (!confirm(`Tem certeza que deseja excluir a aba "${tabToDelete.name}"? Os modelos desta aba serão movidos.`)) return; const regularTabs = appState.tabs.filter(t => t.id !== FAVORITES_TAB_ID); const destinationOptions = regularTabs.filter(t => t.id !== tabId); const promptMessage = `Para qual aba deseja mover os modelos?\n` + destinationOptions.map((t, i) => `${i + 1}: ${t.name}`).join('\n'); const choice = prompt(promptMessage); const choiceIndex = parseInt(choice, 10) - 1; if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= destinationOptions.length) { alert("Seleção inválida. A exclusão foi cancelada."); return; } modifyStateAndBackup(() => { const destinationTabId = destinationOptions[choiceIndex].id; appState.models.forEach(model => { if (model.tabId === tabId) { model.tabId = destinationTabId; } }); appState.tabs = appState.tabs.filter(t => t.id !== tabId); appState.activeTabId = destinationTabId; render(); }); }
function addNewModelFromEditor() { const content = ckEditorInstance ? ckEditorInstance.getData() : ''; if (!content) { alert('O editor está vazio. Escreva algo para salvar como modelo.'); return; } let targetTabId = appState.activeTabId; if (targetTabId === FAVORITES_TAB_ID) { targetTabId = appState.tabs.find(t => t.id !== FAVORITES_TAB_ID)?.id; if (!targetTabId) { alert("Crie uma aba regular primeiro para poder adicionar modelos."); return; } } ModalManager.show({ type: 'modelEditor', title: 'Salvar Novo Modelo', initialData: { name: '' }, onSave: (data) => { if (!data.name) { alert('O nome do modelo não pode ser vazio.'); return; } modifyStateAndBackup(() => { const newModel = { id: `model-${Date.now()}`, name: data.name, content: content, tabId: targetTabId, isFavorite: false }; appState.models.push(newModel); searchBox.value = ''; render(); }); } }); }
function editModel(modelId) { const model = appState.models.find(m => m.id === modelId); ModalManager.show({ type: 'modelEditor', title: 'Editar Modelo', initialData: { name: model.name, content: model.content }, onSave: (data) => { if (!data.name) { alert('O nome do modelo não pode ser vazio.'); return; } modifyStateAndBackup(() => { model.name = data.name; model.content = data.content; render(); }); } }); }
function deleteModel(modelId) { const model = appState.models.find(m => m.id === modelId); if (confirm(`Tem certeza que deseja excluir o modelo "${model.name}"?`)) { modifyStateAndBackup(() => { appState.models = appState.models.filter(m => m.id !== modelId); render(); }); } }
function toggleFavorite(modelId) { const model = appState.models.find(m => m.id === modelId); if (model) { modifyStateAndBackup(() => { model.isFavorite = !model.isFavorite; render(); }); } }
function moveModelToAnotherTab(modelId) { const model = appState.models.find(m => m.id === modelId); const destinationOptions = appState.tabs.filter(t => t.id !== FAVORITES_TAB_ID && t.id !== model.tabId); if (destinationOptions.length === 0) { alert("Não há outras abas para mover este modelo."); return; } const promptMessage = `Para qual aba deseja mover "${model.name}"?\n` + destinationOptions.map((t, i) => `${i + 1}: ${t.name}`).join('\n'); const choice = prompt(promptMessage); const choiceIndex = parseInt(choice, 10) - 1; if (!isNaN(choiceIndex) && choiceIndex >= 0 && choiceIndex < destinationOptions.length) { modifyStateAndBackup(() => { model.tabId = destinationOptions[choiceIndex].id; render(); }); } else if(choice) { alert("Seleção inválida."); } }
function exportModels() { const dataStr = JSON.stringify(appState, null, 2); const dataBlob = new Blob([dataStr], {type: 'application/json'}); const url = URL.createObjectURL(dataBlob); const a = document.createElement('a'); a.href = url; a.download = 'modelos_backup.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        if (!confirm("Atenção: A importação substituirá todos os seus modelos e abas atuais. Deseja continuar?")) {
            importFileInput.value = '';
            return;
        }
        try {
            const importedState = JSON.parse(e.target.result);

            const fileNameMatch = file.name.match(/(\d{8})_(\d{4})/);
            if (fileNameMatch) {
                const dateStr = fileNameMatch[1];
                const timeStr = fileNameMatch[2];
                const year = dateStr.substring(0, 4);
                const month = parseInt(dateStr.substring(4, 6), 10) - 1;
                const day = dateStr.substring(6, 8);
                const hours = timeStr.substring(0, 2);
                const minutes = timeStr.substring(2, 4);
                const fileTimestamp = new Date(year, month, day, hours, minutes).toISOString();
                
                if (!importedState.lastBackupTimestamp || fileTimestamp > importedState.lastBackupTimestamp) {
                    importedState.lastBackupTimestamp = fileTimestamp;
                }
            }
            
            if (importedState.models && importedState.tabs && importedState.activeTabId) {
                appState = importedState;
                saveStateToStorage();
                render();
                alert('Modelos importados com sucesso!');
                renderBackupStatus();
            } else {
                throw new Error('Formato de arquivo inválido.');
            }
        } catch (error) {
            alert('Erro ao importar o arquivo. Verifique se é um JSON válido.');
        } finally {
            importFileInput.value = '';
        }
    };
    reader.readAsText(file);
}

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
window.addEventListener('DOMContentLoaded', () => { 
    loadStateFromStorage(); 
    render(); 

    formatDocBtn.disabled = true;
    clearDocBtn.disabled = true;

    if (sidebarBtnAi && sidebarBtnDictate && sidebarBtnReplace) {
        sidebarBtnAi.innerHTML = ICON_AI_BRAIN;
        sidebarBtnDictate.innerHTML = ICON_MIC;
        sidebarBtnReplace.innerHTML = ICON_REPLACE;

        sidebarBtnAi.addEventListener('click', () => {
            if (!ckEditorInstance) return alert('Editor não carregado.');
            const model = ckEditorInstance.model;
            const selection = model.document.selection;
            const text = ckEditorInstance.data.stringify(model.getSelectedContent(selection));

            if (!text) {
                alert("Por favor, selecione o texto que deseja corrigir.");
                return;
            }

            sidebarBtnAi.classList.add('is-processing');
            sidebarBtnAi.disabled = true;

            GeminiService.correctText(text, CONFIG.apiKey).then(correctedText => {
                model.change(writer => {
                    model.insertContent(writer.createText(correctedText), selection);
                });
            }).catch(error => {
                console.error("Erro na correção:", error);
                alert('Erro ao corrigir o texto.');
            }).finally(() => {
                sidebarBtnAi.classList.remove('is-processing');
                sidebarBtnAi.disabled = false;
            });
        });

        sidebarBtnDictate.addEventListener('click', () => {
            if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                SpeechDictation.start();
            } else {
                alert('O reconhecimento de voz não é suportado.');
            }
        });

        sidebarBtnReplace.addEventListener('click', () => {
            ModalManager.show({
                type: 'replacementManager',
                title: 'Gerenciador de Substituições',
                initialData: { replacements: appState.replacements || [] },
                onSave: (data) => {
                    modifyStateAndBackup(() => { appState.replacements = data.replacements; });
                }
            });
        });
    }

    DecoupledEditor
        .create(document.querySelector('#editor'), CKEDITOR_CONFIG)
        .then(editor => {
            console.log('CKEditor (Decoupled) inicializado com sucesso.');
            ckEditorInstance = editor;

            const toolbarContainer = document.querySelector('.toolbar');
            if (toolbarContainer) {
                 toolbarContainer.appendChild(editor.ui.view.toolbar.element);
            } else {
                console.warn("Container da toolbar (.toolbar) não encontrado. A barra de ferramentas não será exibida.");
            }
            
            formatDocBtn.addEventListener('click', () => {
                ckEditorInstance.execute('formatDocument');
            });
            
            clearDocBtn.addEventListener('click', () => {
                if(confirm('Tem certeza que deseja apagar todo o conteúdo do editor?')) {
                    EditorActions.clearDocument(ckEditorInstance);
                }
            });

            formatDocBtn.disabled = false;
            clearDocBtn.disabled = false;

            if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                SpeechDictation.init({ 
                    micIcon: document.getElementById('dictation-mic-icon'), 
                    langSelect: document.getElementById('dictation-lang-select'), 
                    statusDisplay: document.getElementById('dictation-status'), 
                    dictationModal: document.getElementById('dictation-modal'),
                    toolbarMicButton: sidebarBtnDictate,
                    onResult: (transcript) => {
                        ckEditorInstance.model.change(writer => {
                            writer.insertText(transcript + ' ', ckEditorInstance.model.document.selection.getLastPosition());
                        });
                    }
                });
                
                const closeBtn = document.getElementById('dictation-close-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => { 
                        SpeechDictation.stop(); 
                    }); 
                }
            }
        })
        .catch(error => {
            console.error('Ocorreu um erro ao inicializar o CKEditor:', error);
        });

    // --- EVENT LISTENERS DA SIDEBAR (COM REMOÇÕES E ADIÇÕES) ---
    searchBox.addEventListener('input', debouncedFilter);
    searchBox.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); renderModels(filterModels()); } });
    addNewTabBtn.addEventListener('click', addNewTab);
    addNewModelBtn.addEventListener('click', addNewModelFromEditor);
    exportBtn.addEventListener('click', exportModels);
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleImportFile);
});
