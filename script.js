// --- DADOS E ESTADO DA APLICAÇÃO ---
let appState = {};
const FAVORITES_TAB_ID = 'favorites-tab-id';
const TAB_COLORS = ['#34D399', '#60A5FA', '#FBBF24', '#F87171', '#A78BFA', '#2DD4BF', '#F472B6', '#818CF8', '#FB923C'];
let colorIndex = 0;
let backupDebounceTimer; // Prioridade 3: Variável para o timer do debounce

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
const backupStatusEl = document.getElementById('backup-status'); // Prioridade 1: Referência centralizada

// --- REFERÊNCIAS DO MODAL ---
const modalContainer = document.getElementById('modal-container');
const modalTitle = document.getElementById('modal-title');
const modalInputName = document.getElementById('modal-input-name');
const modalInputContent = document.getElementById('modal-input-content');
const modalBtnSave = document.getElementById('modal-btn-save');
const modalBtnCancel = document.getElementById('modal-btn-cancel');
const modalContentLabel = document.querySelector('label[for="modal-input-content"]');
let currentOnSave = null;

// --- LÓGICA DE BACKUP INTELIGENTE (COM DEBOUNCE E PERSISTÊNCIA) ---

/**
 * Prioridade 1: Atualiza o texto do status de backup na interface.
 * @param {Date} dateObject - O objeto Date do momento do backup.
 */
function updateBackupStatus(dateObject) {
    if (!backupStatusEl) return;
    
    if (dateObject) {
        const day = String(dateObject.getDate()).padStart(2, '0');
        const month = String(dateObject.getMonth() + 1).padStart(2, '0');
        const year = dateObject.getFullYear();
        const hours = String(dateObject.getHours()).padStart(2, '0');
        const minutes = String(dateObject.getMinutes()).padStart(2, '0');
        backupStatusEl.textContent = `Último Backup: ${day}/${month}/${year} ${hours}:${minutes}`;
    } else {
        backupStatusEl.textContent = 'Nenhum backup recente.';
    }
}

/**
 * Prioridade 1 & 2: Executa o download do backup e atualiza o estado.
 */
function triggerAutoBackup() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const timestamp = `${year}${month}${day}_${hours}${minutes}`;
    const filename = `${timestamp}_ModelosDosMeusDocumentos.json`;

    appState.lastBackupTimestamp = now.toISOString(); // Prioridade 2: Salva o timestamp no estado

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
    
    updateBackupStatus(now); // Prioridade 1: Atualiza a UI
}

/**
 * Prioridade 3: Função "debounce" que evita backups excessivos.
 * Só aciona o backup 2.5 segundos após a ÚLTIMA alteração.
 */
function debouncedTriggerAutoBackup() {
    clearTimeout(backupDebounceTimer);
    backupDebounceTimer = setTimeout(() => {
        triggerAutoBackup();
    }, 2500); // 2.5 segundos de espera
}

/**
 * Função central que executa uma modificação no estado e depois
 * chama o backup com debounce.
 * @param {Function} modificationFn - A função que altera o appState.
 */
function modifyStateAndBackup(modificationFn) {
    modificationFn(); // Executa a modificação (ex: apagar modelo)
    debouncedTriggerAutoBackup(); // Aciona o backup inteligente
}

// --- FUNÇÃO AUXILIAR DE COR ---
function getNextColor() {
    const color = TAB_COLORS[colorIndex % TAB_COLORS.length];
    colorIndex++;
    return color;
}

// --- FUNÇÕES DE PERSISTÊNCIA (LocalStorage) ---
function saveStateToStorage() {
    localStorage.setItem('editorModelosApp', JSON.stringify(appState));
}

function loadStateFromStorage() {
    const savedState = localStorage.getItem('editorModelosApp');
    
    const setDefaultState = () => {
        const defaultTabId = `tab-${Date.now()}`;
        colorIndex = 0;
        appState = {
            models: defaultModels.map((m, i) => ({ id: `model-${Date.now() + i}`, name: m.name, content: m.content, tabId: defaultTabId, isFavorite: false })),
            tabs: [{ id: FAVORITES_TAB_ID, name: 'Favoritos', color: '#6c757d' }, { id: defaultTabId, name: 'Geral', color: getNextColor() }],
            activeTabId: defaultTabId,
            lastBackupTimestamp: null // Prioridade 2: Inicializa a propriedade
        };
    };

    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            if (Array.isArray(parsedState.models) && Array.isArray(parsedState.tabs)) {
                appState = parsedState;
                if (!appState.tabs.find(t => t.id === FAVORITES_TAB_ID)) {
                    appState.tabs.unshift({ id: FAVORITES_TAB_ID, name: 'Favoritos', color: '#6c757d' });
                }
                appState.tabs.forEach(tab => { if (!tab.color && tab.id !== FAVORITES_TAB_ID) { tab.color = getNextColor(); } });
            } else { throw new Error("Formato de estado inválido."); }
        } catch (e) {
            console.error("Falha ao carregar estado do LocalStorage, restaurando para o padrão:", e);
            setDefaultState();
        }
    } else {
        setDefaultState();
    }
    
    // Prioridade 2: Atualiza o status de backup ao carregar a página
    if (appState.lastBackupTimestamp) {
        updateBackupStatus(new Date(appState.lastBackupTimestamp));
    } else {
        updateBackupStatus(null);
    }

    if (!appState.tabs.find(t => t.id === appState.activeTabId)) {
        appState.activeTabId = appState.tabs.find(t => t.id !== FAVORITES_TAB_ID)?.id || appState.tabs[0]?.id || null;
    }
}

// --- FUNÇÕES DO EDITOR ---
function execCmd(command, value = null) {
    document.execCommand(command, false, value);
}

function insertModelContent(content, tabId) {
    if (searchBox.value && tabId && appState.activeTabId !== tabId) {
        appState.activeTabId = tabId;
        searchBox.value = '';
        render();
    }
    editor.focus();
    execCmd('insertHTML', content);
}

// --- FUNÇÕES DE RENDERIZAÇÃO ---
function render() {
    saveStateToStorage();
    renderTabs();
    renderModels(filterModels());
}

// ... (O resto das funções de renderização como renderTabs, renderModels, filterModels, etc. permanecem idênticas)
function renderTabs() {
    const inactiveTabsContainer = document.getElementById('tabs-container');
    const activeTabContainer = document.getElementById('active-tab-container');
    const activeContentArea = document.getElementById('active-content-area');
    
    inactiveTabsContainer.innerHTML = '';
    activeTabContainer.innerHTML = '';

    const activeTab = appState.tabs.find(t => t.id === appState.activeTabId);

    appState.tabs.forEach(tab => {
        if (tab.id === appState.activeTabId) return;

        const tabEl = document.createElement('button');
        tabEl.className = 'tab-item';
        tabEl.dataset.tabId = tab.id;
        if (tab.color) {
            tabEl.style.backgroundColor = tab.color;
            tabEl.style.borderColor = tab.color;
        }
        tabEl.textContent = tab.name + (tab.id === FAVORITES_TAB_ID ? ' ⭐' : '');
        tabEl.addEventListener('click', () => {
            appState.activeTabId = tab.id;
            searchBox.value = '';
            render();
        });
        inactiveTabsContainer.appendChild(tabEl);
    });
    
    if (activeTab) {
        const activeTabEl = document.createElement('button');
        activeTabEl.className = 'tab-item active';
        activeTabEl.dataset.tabId = activeTab.id;

        if (activeTab.color) {
            activeTabEl.style.backgroundColor = activeTab.color;
            activeTabEl.style.borderColor = activeTab.color;
        }
        
        activeTabEl.textContent = activeTab.name + (activeTab.id === FAVORITES_TAB_ID ? ' ⭐' : '');
        
        const regularTabsCount = appState.tabs.filter(t => t.id !== FAVORITES_TAB_ID).length;
        if (activeTab.id !== FAVORITES_TAB_ID && regularTabsCount > 1) {
            const closeBtn = document.createElement('span');
            closeBtn.className = 'close-tab-btn';
            closeBtn.innerHTML = '&times;';
            closeBtn.title = 'Excluir aba';
            closeBtn.onclick = (e) => { e.stopPropagation(); deleteTab(activeTab.id); };
            activeTabEl.appendChild(closeBtn);
        }
        activeTabContainer.appendChild(activeTabEl);

        activeContentArea.style.borderColor = activeTab.color || '#ccc';
        tabsContainer.style.borderBottomColor = activeTab.color || '#ccc';
    } else {
        activeContentArea.style.borderColor = '#ccc';
        tabsContainer.style.borderBottomColor = '#ccc';
    }
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
        addButton.innerHTML = '➕';
        addButton.title = 'Inserir modelo';
        addButton.onclick = () => insertModelContent(model.content, model.tabId);

        const editButton = document.createElement('button');
        editButton.className = 'action-btn';
        editButton.innerHTML = '✏️';
        editButton.title = 'Editar modelo';
        editButton.onclick = () => editModel(model.id);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'action-btn';
        deleteButton.innerHTML = '🗑️';
        deleteButton.title = 'Excluir modelo';
        deleteButton.onclick = () => deleteModel(model.id);
        
        const moveButton = document.createElement('button');
        moveButton.className = 'action-btn';
        moveButton.innerHTML = '➡️';
        moveButton.title = 'Mover para outra aba';
        moveButton.onclick = () => moveModelToAnotherTab(model.id);
        
        const favoriteButton = document.createElement('button');
        favoriteButton.className = 'action-btn';
        favoriteButton.innerHTML = model.isFavorite ? '🌟' : '⭐';
        favoriteButton.title = 'Favoritar/Desfavoritar';
        favoriteButton.onclick = () => toggleFavorite(model.id);

        if (model.isFavorite) {
            const favIcon = document.createElement('span');
            favIcon.innerHTML = '⭐';
            favIcon.style.marginLeft = 'auto';
            favIcon.style.paddingLeft = '10px';
            headerDiv.appendChild(favIcon);
        }

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
function debouncedFilter() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        renderModels(filterModels());
    }, 250);
}

function filterModels() {
    const query = searchBox.value.toLowerCase().trim();
    const activeContentArea = document.getElementById('active-content-area');

    activeContentArea.classList.toggle('searching', !!query);

    if (!query) {
        if (appState.activeTabId === FAVORITES_TAB_ID) {
            return appState.models.filter(m => m.isFavorite);
        } else {
            return appState.models.filter(m => m.tabId === appState.activeTabId);
        }
    }

    const models = appState.models;
    if (query.includes(' ou ')) {
        const terms = query.split(' ou ').map(t => t.trim()).filter(Boolean);
        return models.filter(model => {
            const modelText = (model.name + ' ' + model.content).toLowerCase();
            return terms.some(term => modelText.includes(term));
        });
    } else if (query.includes(' e ')) {
        const terms = query.split(' e ').map(t => t.trim()).filter(Boolean);
        return models.filter(model => {
            const modelText = (model.name + ' ' + model.content).toLowerCase();
            return terms.every(term => modelText.includes(term));
        });
    } else {
        return models.filter(model =>
            model.name.toLowerCase().includes(query) ||
            model.content.toLowerCase().includes(query)
        );
    }
}
// --- FUNÇÕES DE MANIPULAÇÃO DE DADOS (AGORA USANDO modifyStateAndBackup) ---

function addNewTab() {
    const name = prompt("Digite o nome da nova aba:");
    if (name && name.trim()) {
        modifyStateAndBackup(() => {
            const newTab = { id: `tab-${Date.now()}`, name: name.trim(), color: getNextColor() };
            appState.tabs.push(newTab);
            appState.activeTabId = newTab.id;
            render();
        });
    }
}

function deleteTab(tabId) {
    const tabToDelete = appState.tabs.find(t => t.id === tabId);
    if (!confirm(`Tem certeza que deseja excluir a aba "${tabToDelete.name}"? Os modelos desta aba serão movidos.`)) return;

    const regularTabs = appState.tabs.filter(t => t.id !== FAVORITES_TAB_ID);
    const destinationOptions = regularTabs.filter(t => t.id !== tabId);
    const promptMessage = `Para qual aba deseja mover os modelos?\n` + destinationOptions.map((t, i) => `${i + 1}: ${t.name}`).join('\n');
    const choice = prompt(promptMessage);
    const choiceIndex = parseInt(choice, 10) - 1;

    if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= destinationOptions.length) {
        alert("Seleção inválida. A exclusão foi cancelada.");
        return;
    }
    
    modifyStateAndBackup(() => {
        const destinationTabId = destinationOptions[choiceIndex].id;
        appState.models.forEach(model => { if (model.tabId === tabId) { model.tabId = destinationTabId; } });
        appState.tabs = appState.tabs.filter(t => t.id !== tabId);
        appState.activeTabId = destinationTabId;
        render();
    });
}

function addNewModelFromEditor() {
    const content = editor.innerHTML.trim();
    if (content === '' || content === '<p><br></p>') {
        alert('O editor está vazio. Escreva algo para salvar como modelo.');
        return;
    }
    let targetTabId = appState.activeTabId;
    if (targetTabId === FAVORITES_TAB_ID) {
        targetTabId = appState.tabs.find(t => t.id !== FAVORITES_TAB_ID)?.id;
        if (!targetTabId) { alert("Crie uma aba regular primeiro para poder adicionar modelos."); return; }
    }
    openModal({
        title: 'Salvar Novo Modelo',
        onSave: (name) => {
            if (!name) { alert('O nome do modelo não pode ser vazio.'); return; }
            modifyStateAndBackup(() => {
                const newModel = { id: `model-${Date.now()}`, name: name, content: content, tabId: targetTabId, isFavorite: false };
                appState.models.push(newModel);
                searchBox.value = '';
                closeModal();
                render();
            });
        }
    });
}

function editModel(modelId) {
    const model = appState.models.find(m => m.id === modelId);
    openModal({
        title: 'Editar Modelo', initialName: model.name, initialContent: model.content,
        onSave: (name, content) => {
            if (!name) { alert('O nome do modelo não pode ser vazio.'); return; }
            modifyStateAndBackup(() => {
                model.name = name;
                model.content = content;
                closeModal();
                render();
            });
        }
    });
}

function deleteModel(modelId) {
    const model = appState.models.find(m => m.id === modelId);
    if (confirm(`Tem certeza que deseja excluir o modelo "${model.name}"?`)) {
        modifyStateAndBackup(() => {
            appState.models = appState.models.filter(m => m.id !== modelId);
            render();
        });
    }
}

function toggleFavorite(modelId) {
    const model = appState.models.find(m => m.id === modelId);
    if (model) {
        modifyStateAndBackup(() => {
            model.isFavorite = !model.isFavorite;
            render();
        });
    }
}

function moveModelToAnotherTab(modelId) {
    const model = appState.models.find(m => m.id === modelId);
    const destinationOptions = appState.tabs.filter(t => t.id !== FAVORITES_TAB_ID && t.id !== model.tabId);
    if (destinationOptions.length === 0) { alert("Não há outras abas para mover este modelo."); return; }
    const promptMessage = `Para qual aba deseja mover "${model.name}"?\n` + destinationOptions.map((t, i) => `${i + 1}: ${t.name}`).join('\n');
    const choice = prompt(promptMessage);
    const choiceIndex = parseInt(choice, 10) - 1;
    if (!isNaN(choiceIndex) && choiceIndex >= 0 && choiceIndex < destinationOptions.length) {
        modifyStateAndBackup(() => {
            model.tabId = destinationOptions[choiceIndex].id;
            render();
        });
    } else if(choice) { alert("Seleção inválida."); }
}

function exportModels() {
    const dataStr = JSON.stringify(appState, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelos_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

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
            if (importedState.models && importedState.tabs && importedState.activeTabId) {
                appState = importedState;
                render();
                alert('Modelos importados com sucesso!');
                const now = new Date(); // Prioridade 1: Atualiza status na importação
                appState.lastBackupTimestamp = now.toISOString(); // Prioridade 2
                updateBackupStatus(now); // Prioridade 1
            } else { throw new Error('Formato de arquivo inválido.'); }
        } catch (error) {
            alert('Erro ao importar o arquivo. Verifique se é um JSON válido.');
        } finally {
            importFileInput.value = '';
        }
    };
    reader.readAsText(file);
}

// ... (Funções do Modal e de Inicialização permanecem as mesmas)
function openModal(config) {
    modalTitle.textContent = config.title;
    modalInputName.value = config.initialName || '';
    modalInputContent.innerHTML = config.initialContent || '';
    
    const isContentVisible = config.initialContent !== undefined;
    modalInputContent.style.display = isContentVisible ? 'block' : 'none';
    modalContentLabel.style.display = isContentVisible ? 'block' : 'none';

    currentOnSave = () => config.onSave(modalInputName.value, modalInputContent.innerHTML);
    
    modalContainer.classList.add('visible');
    modalInputName.focus();
}

function closeModal() {
    modalContainer.classList.remove('visible');
    currentOnSave = null;
}

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
            onResult: (transcript) => { insertModelContent(transcript); }
        });
        dictateBtn.addEventListener('click', () => { dictationModal.classList.add('visible'); });
        dictationCloseBtn.addEventListener('click', () => {
            SpeechDictation.stop();
            dictationModal.classList.remove('visible');
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