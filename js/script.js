// --- DADOS E ESTADO DA APLICAÇÃO ---
let appState = {};
const FAVORITES_TAB_ID = 'favorites-tab-id';
const TAB_COLORS = ['#34D399', '#60A5FA', '#FBBF24', '#F87171', '#A78BFA', '#2DD4BF', '#F472B6', '#818CF8', '#FB923C', '#EC4899', '#10B981', '#3B82F6'];
const ICON_TRASH = `<svg xmlns="http://www.w.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const ICON_PALETTE = `<svg xmlns="http://www.w.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69a3.6 3.6 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.4.1 2.64.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.73c0 .27.16.58.67.5A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z"></path></svg>`;
const ICON_PENCIL = `<svg xmlns="http://www.w.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
const ICON_PLUS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
const ICON_MOVE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
const ICON_STAR_FILLED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
const ICON_STAR_OUTLINE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
let colorIndex = 0;
let backupDebounceTimer;

const defaultModels = [
    { name: "IDPJ - Criação de Relatório de Sentença", content: "Este é o texto para a criação do relatório de sentença. Inclui seções sobre <b>fatos</b>, <i>fundamentos</i> e <u>dispositivo</u>." },
    { name: "IDPJ - Criar texto de ADMISSIBILIDADE", content: "Texto padrão para a análise de admissibilidade do Incidente de Desconsideração da Personalidade Jurídica." },
    { name: "IDPJ - RELATÓRIO de endereços", content: "Relatório gerado a partir da consulta de endereços nos sistemas conveniados. Segue abaixo a tabela:" }
];

// --- REFERÊNCIAS AOS ELEMENTOS DO HTML ---
const editor = document.getElementById('editor');
const modelList = document.getElementById('model-list');
const searchBox = document.getElementById('search-box');
const tabsContainer = document.getElementById('tabs-container');
const addNewTabBtn = document.getElementById('add-new-tab-btn');
const addNewModelBtn = document.getElementById('add-new-model-btn');
const indentBtn = document.getElementById('indent-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file-input');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search-btn');
const formatDocBtn = document.getElementById('format-doc-btn');
const clearDocBtn = document.getElementById('clear-doc-btn');
const blockquoteBtn = document.getElementById('blockquote-btn');
const backupStatusEl = document.getElementById('backup-status');
const tabActionsContainer = document.getElementById('tab-actions-container');

// --- REFERÊNCIAS DO MODAL ---
const modalContainer = document.getElementById('modal-container');
const modalTitle = document.getElementById('modal-title');
const modalInputName = document.getElementById('modal-input-name');
const modalInputContent = document.getElementById('modal-input-content');
const modalBtnSave = document.getElementById('modal-btn-save');
const modalBtnCancel = document.getElementById('modal-btn-cancel');
const modalContentLabel = document.querySelector('label[for="modal-input-content"]');
let currentOnSave = null;

// --- LÓGICA DE BACKUP E MODIFICAÇÃO DE ESTADO CENTRALIZADA ---
function updateBackupStatus(dateObject) { if (!backupStatusEl) return; if (dateObject) { const day = String(dateObject.getDate()).padStart(2, '0'); const month = String(dateObject.getMonth() + 1).padStart(2, '0'); const year = dateObject.getFullYear(); const hours = String(dateObject.getHours()).padStart(2, '0'); const minutes = String(dateObject.getMinutes()).padStart(2, '0'); backupStatusEl.textContent = `Último Backup: ${day}/${month}/${year} ${hours}:${minutes}`; } else { backupStatusEl.textContent = 'Nenhum backup recente.'; } }
function triggerAutoBackup() { const now = new Date(); const year = now.getFullYear(); const month = String(now.getMonth() + 1).padStart(2, '0'); const day = String(now.getDate()).padStart(2, '0'); const hours = String(now.getHours()).padStart(2, '0'); const minutes = String(now.getMinutes()).padStart(2, '0'); const timestamp = `${year}${month}${day}_${hours}${minutes}`; const filename = `${timestamp}_ModelosDosMeusDocumentos.json`; appState.lastBackupTimestamp = now.toISOString(); const dataStr = JSON.stringify(appState, null, 2); const dataBlob = new Blob([dataStr], {type: 'application/json'}); const url = URL.createObjectURL(dataBlob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); updateBackupStatus(now); }
function debouncedTriggerAutoBackup() { clearTimeout(backupDebounceTimer); backupDebounceTimer = setTimeout(() => { triggerAutoBackup(); }, 2500); }
function modifyStateAndBackup(modificationFn) { modificationFn(); saveStateToStorage(); debouncedTriggerAutoBackup(); }
function getNextColor() { const color = TAB_COLORS[colorIndex % TAB_COLORS.length]; colorIndex++; return color; }

// --- FUNÇÕES DE PERSISTÊNCIA ---
function saveStateToStorage() { localStorage.setItem('editorModelosApp', JSON.stringify(appState)); }
function loadStateFromStorage() { const savedState = localStorage.getItem('editorModelosApp'); const setDefaultState = () => { const defaultTabId = `tab-${Date.now()}`; colorIndex = 0; appState = { models: defaultModels.map((m, i) => ({ id: `model-${Date.now() + i}`, name: m.name, content: m.content, tabId: defaultTabId, isFavorite: false })), tabs: [{ id: FAVORITES_TAB_ID, name: 'Favoritos', color: '#6c757d' }, { id: defaultTabId, name: 'Geral', color: getNextColor() }], activeTabId: defaultTabId, replacements: [], lastBackupTimestamp: null }; }; if (savedState) { try { const parsedState = JSON.parse(savedState); if (Array.isArray(parsedState.models) && Array.isArray(parsedState.tabs)) { appState = parsedState; if (!appState.tabs.find(t => t.id === FAVORITES_TAB_ID)) { appState.tabs.unshift({ id: FAVORITES_TAB_ID, name: 'Favoritos', color: '#6c757d' }); } appState.tabs.forEach(tab => { if (!tab.color && tab.id !== FAVORITES_TAB_ID) { tab.color = getNextColor(); } }); if (!appState.replacements) { appState.replacements = []; } } else { throw new Error("Formato de estado inválido."); } } catch (e) { console.error("Falha ao carregar estado do LocalStorage, restaurando para o padrão:", e); setDefaultState(); } } else { setDefaultState(); } if (appState.lastBackupTimestamp) { updateBackupStatus(new Date(appState.lastBackupTimestamp)); } else { updateBackupStatus(null); } if (!appState.tabs.find(t => t.id === appState.activeTabId)) { appState.activeTabId = appState.tabs.find(t => t.id !== FAVORITES_TAB_ID)?.id || appState.tabs[0]?.id || null; } }

// --- FUNÇÕES DO EDITOR ---
function execCmd(command, value = null) { document.execCommand(command, false, value); }
function insertModelContent(content, tabId) { if (searchBox.value && tabId && appState.activeTabId !== tabId) { appState.activeTabId = tabId; searchBox.value = ''; render(); } editor.focus(); execCmd('insertHTML', content); execCmd('justifyFull'); }

// --- FUNÇÕES DE RENDERIZAÇÃO ---
function renderTabActions() {
    tabActionsContainer.innerHTML = '';
    const activeTab = appState.tabs.find(t => t.id === appState.activeTabId);

    if (!activeTab || activeTab.id === FAVORITES_TAB_ID) {
        tabActionsContainer.classList.remove('visible');
        return;
    }

    const regularTabsCount = appState.tabs.filter(t => t.id !== FAVORITES_TAB_ID).length;

    // Botão de Excluir
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'tab-action-btn';
    deleteBtn.innerHTML = ICON_TRASH;
    deleteBtn.title = 'Excluir esta aba';
    if (regularTabsCount <= 1) {
        deleteBtn.disabled = true;
    }
    deleteBtn.onclick = () => deleteTab(appState.activeTabId);
    tabActionsContainer.appendChild(deleteBtn);

    // Botão de Alterar Cor
    const colorBtn = document.createElement('button');
    colorBtn.className = 'tab-action-btn';
    colorBtn.innerHTML = ICON_PALETTE;
    colorBtn.title = 'Alterar cor da aba';
    colorBtn.onclick = (event) => {
        event.stopPropagation();
        toggleColorPalette(tabActionsContainer, activeTab);
    };
    tabActionsContainer.appendChild(colorBtn);

    // Botão de Renomear
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
function addNewModelFromEditor() { const content = editor.innerHTML.trim(); if (content === '' || content === '<p><br></p>') { alert('O editor está vazio. Escreva algo para salvar como modelo.'); return; } let targetTabId = appState.activeTabId; if (targetTabId === FAVORITES_TAB_ID) { targetTabId = appState.tabs.find(t => t.id !== FAVORITES_TAB_ID)?.id; if (!targetTabId) { alert("Crie uma aba regular primeiro para poder adicionar modelos."); return; } } openModal({ title: 'Salvar Novo Modelo', onSave: (name) => { if (!name) { alert('O nome do modelo não pode ser vazio.'); return; } modifyStateAndBackup(() => { const newModel = { id: `model-${Date.now()}`, name: name, content: content, tabId: targetTabId, isFavorite: false }; appState.models.push(newModel); searchBox.value = ''; closeModal(); render(); }); } }); }
function editModel(modelId) { const model = appState.models.find(m => m.id === modelId); openModal({ title: 'Editar Modelo', initialName: model.name, initialContent: model.content, onSave: (name, content) => { if (!name) { alert('O nome do modelo não pode ser vazio.'); return; } modifyStateAndBackup(() => { model.name = name; model.content = content; closeModal(); render(); }); } }); }
function deleteModel(modelId) { const model = appState.models.find(m => m.id === modelId); if (confirm(`Tem certeza que deseja excluir o modelo "${model.name}"?`)) { modifyStateAndBackup(() => { appState.models = appState.models.filter(m => m.id !== modelId); render(); }); } }
function toggleFavorite(modelId) { const model = appState.models.find(m => m.id === modelId); if (model) { modifyStateAndBackup(() => { model.isFavorite = !model.isFavorite; render(); }); } }
function moveModelToAnotherTab(modelId) { const model = appState.models.find(m => m.id === modelId); const destinationOptions = appState.tabs.filter(t => t.id !== FAVORITES_TAB_ID && t.id !== model.tabId); if (destinationOptions.length === 0) { alert("Não há outras abas para mover este modelo."); return; } const promptMessage = `Para qual aba deseja mover "${model.name}"?\n` + destinationOptions.map((t, i) => `${i + 1}: ${t.name}`).join('\n'); const choice = prompt(promptMessage); const choiceIndex = parseInt(choice, 10) - 1; if (!isNaN(choiceIndex) && choiceIndex >= 0 && choiceIndex < destinationOptions.length) { modifyStateAndBackup(() => { model.tabId = destinationOptions[choiceIndex].id; render(); }); } else if(choice) { alert("Seleção inválida."); } }
function exportModels() { const dataStr = JSON.stringify(appState, null, 2); const dataBlob = new Blob([dataStr], {type: 'application/json'}); const url = URL.createObjectURL(dataBlob); const a = document.createElement('a'); a.href = url; a.download = 'modelos_backup.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
function handleImportFile(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(e) { if (!confirm("Atenção: A importação substituirá todos os seus modelos e abas atuais. Deseja continuar?")) { importFileInput.value = ''; return; } try { const importedState = JSON.parse(e.target.result); if (importedState.models && importedState.tabs && importedState.activeTabId) { appState = importedState; saveStateToStorage(); render(); alert('Modelos importados com sucesso!'); const now = new Date(); appState.lastBackupTimestamp = now.toISOString(); updateBackupStatus(now); } else { throw new Error('Formato de arquivo inválido.'); } } catch (error) { alert('Erro ao importar o arquivo. Verifique se é um JSON válido.'); } finally { importFileInput.value = ''; } }; reader.readAsText(file); }

// --- FUNÇÕES DO MODAL ---
function openModal(config) { modalTitle.textContent = config.title; modalInputName.value = config.initialName || ''; modalInputContent.innerHTML = config.initialContent || ''; const isContentVisible = config.initialContent !== undefined; modalInputContent.style.display = isContentVisible ? 'block' : 'none'; modalContentLabel.style.display = isContentVisible ? 'block' : 'none'; currentOnSave = () => config.onSave(modalInputName.value, modalInputContent.innerHTML); modalContainer.classList.add('visible'); modalInputName.focus(); }
function closeModal() { modalContainer.classList.remove('visible'); currentOnSave = null; }

// --- INICIALIZAÇÃO ---
window.addEventListener('DOMContentLoaded', () => { 
    loadStateFromStorage(); 
    render(); 
    const dictateBtn = document.getElementById('dictate-btn'); 
    const dictationModal = document.getElementById('dictation-modal'); 
    const dictationCloseBtn = document.getElementById('dictation-close-btn'); 
    
    if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) { 
        SpeechDictation.init({ 
            micIcon: document.getElementById('dictation-mic-icon'), 
            langSelect: document.getElementById('dictation-lang-select'), 
            statusDisplay: document.getElementById('dictation-status'), 
            dictationModal: dictationModal,
            toolbarMicButton: dictateBtn,
            onResult: (transcript) => { 
                insertModelContent(transcript); 
            } 
        }); 
        dictateBtn.addEventListener('click', SpeechDictation.start); 
        dictationCloseBtn.addEventListener('click', () => { 
            SpeechDictation.stop(); 
        }); 
    } else { 
        dictateBtn.style.display = 'none'; 
    } 
    
    editor.addEventListener('keydown', (event) => { 
        if (event.ctrlKey) { 
            switch (event.key.toLowerCase()) { 
                case 'b': event.preventDefault(); execCmd('bold'); break; 
                case 'i': event.preventDefault(); execCmd('italic'); break; 
                case 'u': event.preventDefault(); execCmd('underline'); break; 
            } 
        } else if (event.key === 'Tab') { 
            event.preventDefault(); 
            EditorActions.indentFirstLine(); 
        } 
    }); 
    
    if (blockquoteBtn) { 
        blockquoteBtn.addEventListener('click', EditorActions.formatAsBlockquote); 
    } 
    
    const replaceBtn = document.getElementById('replace-btn'); 
    if (replaceBtn) { 
        replaceBtn.addEventListener('click', () => {
            ModalManager.show({
                type: 'replacementManager',
                title: 'Gerenciador de Substituições',
                initialData: {
                    replacements: appState.replacements || []
                },
                onSave: (data) => {
                    modifyStateAndBackup(() => {
                        appState.replacements = data.replacements;
                    });
                },
                onApply: () => {
                    const rules = appState.replacements;
                    if (!rules || rules.length === 0) {
                        alert("Nenhuma regra de substituição foi salva para aplicar.");
                        return;
                    }

                    let content = editor.innerHTML;
                    let replacementsMade = 0;

                    rules.forEach(rule => {
                        if (rule.find) {
                            const regex = new RegExp(rule.find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
                            if (content.match(regex)) {
                                content = content.replace(regex, rule.replace);
                                replacementsMade++;
                            }
                        }
                    });

                    if (replacementsMade > 0) {
                        editor.innerHTML = content;
                        alert("Substituições aplicadas com sucesso!");
                    } else {
                        alert("Nenhum texto correspondente às regras foi encontrado no editor.");
                    }
                }
            });
        });
    }

    // --- CÓDIGO DA FUNCIONALIDADE DE CORREÇÃO ---
    const correctTextBtn = document.getElementById('correct-text-btn');

    if (correctTextBtn) {
        correctTextBtn.addEventListener('click', async () => {
            if (typeof CONFIG === 'undefined' || !CONFIG.apiKey || CONFIG.apiKey === "SUA_CHAVE_API_VAI_AQUI") {
                alert("Erro de configuração: A chave de API não foi encontrada. Verifique o arquivo js/config.js");
                return;
            }

            const apiKey = CONFIG.apiKey;
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();

            if (!selectedText) {
                alert("Por favor, selecione o texto que deseja corrigir.");
                return;
            }
            
            const originalButtonText = correctTextBtn.textContent;
            correctTextBtn.textContent = 'Corrigindo...';
            correctTextBtn.disabled = true;

            const correctedText = await GeminiService.correctText(selectedText, apiKey);
            
            document.execCommand('insertText', false, correctedText);

            correctTextBtn.textContent = originalButtonText;
            correctTextBtn.disabled = false;
        });
    }
    // --- FIM DO CÓDIGO DA FUNCIONALIDADE ---
});

// --- EVENT LISTENERS ---
searchBox.addEventListener('input', debouncedFilter);
searchBox.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); renderModels(filterModels()); } });
addNewTabBtn.addEventListener('click', addNewTab);
addNewModelBtn.addEventListener('click', addNewModelFromEditor);
indentBtn.addEventListener('click', EditorActions.indentFirstLine);
formatDocBtn.addEventListener('click', EditorActions.formatDocument);
clearDocBtn.addEventListener('click', EditorActions.clearDocument);
searchBtn.addEventListener('click', () => { renderModels(filterModels()); });
clearSearchBtn.addEventListener('click', () => { searchBox.value = ''; renderModels(filterModels()); });
exportBtn.addEventListener('click', exportModels);
importBtn.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', handleImportFile);
modalBtnSave.addEventListener('click', () => { if (currentOnSave) currentOnSave(); });
modalBtnCancel.addEventListener('click', closeModal);
modalContainer.addEventListener('click', (e) => { if (e.target === modalContainer) closeModal(); });
