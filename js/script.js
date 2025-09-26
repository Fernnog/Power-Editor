// js/script.js

// --- DADOS E ESTADO DA APLICAÇÃO ---
let appState = {};
const FAVORITES_TAB_ID = 'favorites-tab-id';
const POWER_TAB_ID = 'rapidos-tab-id'; // Nome da constante para clareza (ID interno mantido)
const TAB_COLORS = [
    '#34D399', '#60A5FA', '#FBBF24', '#F87171', '#A78BFA', '#2DD4BF', 
    '#F472B6', '#818CF8', '#FB923C', '#EC4899', '#10B981', '#3B82F6',
    // Novas cores adicionadas
    '#8B5CF6', '#F97316', '#14B8A6', '#EAB308', '#EF4444', '#6366F1'
];

let colorIndex = 0;

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
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search-btn');
const tabActionsContainer = document.getElementById('tab-actions-container');

// --- LÓGICA DE BACKUP E MODIFICAÇÃO DE ESTADO CENTRALIZADA ---
function modifyStateAndBackup(modificationFn) {
    modificationFn();
    saveStateToStorage();
    BackupManager.schedule(appState);
}
function getNextColor() { const color = TAB_COLORS[colorIndex % TAB_COLORS.length]; colorIndex++; return color; }

// --- FUNÇÕES DE PERSISTÊNCIA ---
function saveStateToStorage() { localStorage.setItem('editorModelosApp', JSON.stringify(appState)); }

function loadStateFromStorage() {
    const savedState = localStorage.getItem('editorModelosApp');
    
    const setDefaultState = () => {
        const defaultTabId = `tab-${Date.now()}`;
        colorIndex = 0;
        appState = {
            models: defaultModels.map((m, i) => ({ id: `model-${Date.now() + i}`, name: m.name, content: m.content, tabId: defaultTabId, isFavorite: false })),
            tabs: [
                { id: FAVORITES_TAB_ID, name: 'Favoritos', color: '#6c757d' },
                { id: POWER_TAB_ID, name: 'Power ⚡', color: '#ce2a66' },
                { id: defaultTabId, name: 'Geral', color: getNextColor() }
            ],
            activeTabId: defaultTabId,
            replacements: [],
            variableMemory: {}, // INICIALIZA A MEMÓRIA DE VARIÁVEIS
            globalVariables: [], // INICIALIZA AS VARIÁVEIS GLOBAIS
            lastBackupTimestamp: null
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

                const powerTab = appState.tabs.find(t => t.id === POWER_TAB_ID);
                if (powerTab) {
                    powerTab.name = 'Power ⚡';
                    powerTab.color = '#ce2a66';
                } else {
                    const favIndex = appState.tabs.findIndex(t => t.id === FAVORITES_TAB_ID);
                    const newPowerTab = { id: POWER_TAB_ID, name: 'Power ⚡', color: '#ce2a66' };
                    if (favIndex !== -1) {
                        appState.tabs.splice(favIndex + 1, 0, newPowerTab);
                    } else {
                        appState.tabs.unshift(newPowerTab);
                    }
                }

                appState.tabs.forEach(tab => {
                    if (!tab.color && tab.id !== FAVORITES_TAB_ID) {
                        tab.color = getNextColor();
                    }
                });

                // GARANTE COMPATIBILIDADE COM VERSÕES ANTIGAS
                appState.replacements = parsedState.replacements || [];
                appState.variableMemory = parsedState.variableMemory || {};
                appState.globalVariables = parsedState.globalVariables || [];

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

    BackupManager.updateStatus(appState.lastBackupTimestamp ? new Date(appState.lastBackupTimestamp) : null);
    if (!appState.tabs.find(t => t.id === appState.activeTabId)) {
        appState.activeTabId = appState.tabs.find(t => t.id !== FAVORITES_TAB_ID)?.id || appState.tabs[0]?.id || null;
    }
}


// --- FUNÇÕES DO EDITOR (ATUALIZADA COM VARIÁVEIS DINÂMICAS) ---
function insertModelContent(model) {
    // Se a busca estiver ativa, muda para a aba do modelo e limpa a busca
    if (searchBox.value && appState.activeTabId !== model.tabId) {
        appState.activeTabId = model.tabId;
        searchBox.value = '';
        render(); // Renderiza a UI com a nova aba ativa
    }

    let content = model.content;

    // ETAPA 1: Substituir variáveis dinâmicas (geradas pelo sistema)
    const now = new Date();
    content = content.replace(/{{data_atual}}/gi, now.toLocaleDateString('pt-BR'));
    content = content.replace(/{{hora_atual}}/gi, now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

    // ETAPA 2: Substituir variáveis globais (definidas pelo usuário)
    if (appState.globalVariables && appState.globalVariables.length > 0) {
        appState.globalVariables.forEach(gVar => {
            // Cria um RegEx para cada variável global, tratando espaços
            const globalVarRegex = new RegExp(`{{\\s*${gVar.find}\\s*}}`, 'gi');
            content = content.replace(globalVarRegex, gVar.replace);
        });
    }

    // ETAPA 3: Lógica de formulário para as variáveis restantes
    const variableRegex = /{{\s*([^}]+?)\s*}}/g;
    const matches = [...content.matchAll(variableRegex)];
    const uniqueVariables = [...new Set(matches.map(match => match[1]))];

    if (uniqueVariables.length > 0) {
        // A lógica do checkbox "Lembrar valores" será gerenciada no ModalManager
        // com base na existência de memória para este model.id
        ModalManager.show({
            type: 'variableForm',
            title: 'Preencha as Informações do Modelo',
            initialData: { variables: uniqueVariables, modelId: model.id }, // Passa o ID do modelo
            saveButtonText: 'Inserir Texto',
            onSave: (data) => {
                // O objeto 'data' agora contém os valores das variáveis e o status do checkbox
                const remember = data.rememberValues;
                const valuesToInsert = { ...data };
                delete valuesToInsert.rememberValues; // Remove a chave do checkbox dos dados de inserção

                modifyStateAndBackup(() => {
                    if (remember) {
                        // Salva os valores na memória
                        appState.variableMemory[model.id] = valuesToInsert;
                    } else {
                        // Remove os valores da memória se a caixa for desmarcada
                        delete appState.variableMemory[model.id];
                    }
                });

                let processedContent = content;
                for (const key in valuesToInsert) {
                    const placeholder = new RegExp(`{{\\s*${key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*}}`, 'g');
                    processedContent = processedContent.replace(placeholder, valuesToInsert[key] || '');
                }

                if (tinymce.activeEditor) {
                    tinymce.activeEditor.execCommand('mceInsertContent', false, processedContent);
                    tinymce.activeEditor.focus();
                }
            }
        });
    } else {
        // Se não houver variáveis restantes, insere o conteúdo pré-processado
        if (tinymce.activeEditor) {
            tinymce.activeEditor.execCommand('mceInsertContent', false, content);
            tinymce.activeEditor.focus();
        }
    }
}

// --- FUNÇÕES DE RENDERIZAÇÃO ---
function renderTabActions() {
    tabActionsContainer.innerHTML = '';
    const activeTab = appState.tabs.find(t => t.id === appState.activeTabId);

    if (!activeTab || activeTab.id === FAVORITES_TAB_ID || activeTab.id === POWER_TAB_ID) {
        tabActionsContainer.classList.remove('visible');
        return;
    }

    const regularTabsCount = appState.tabs.filter(t => t.id !== FAVORITES_TAB_ID && t.id !== POWER_TAB_ID).length;

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

        // MODIFICADO: Lógica para renderizar ícone ou texto
        if (tab.id === FAVORITES_TAB_ID) {
            tabEl.innerHTML = ICON_STAR_FILLED;
            tabEl.title = tab.name;
            tabEl.classList.add('tab-item-icon-only');
        } else if (tab.id === POWER_TAB_ID) {
            tabEl.innerHTML = ICON_LIGHTNING;
            tabEl.title = tab.name;
            tabEl.classList.add('tab-item-icon-only');
        } else {
            tabEl.textContent = tab.name;
        }
        
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
        
        if (model.content && model.content.includes('{{')) {
            const variableIndicator = document.createElement('span');
            variableIndicator.className = 'model-variable-indicator';
            variableIndicator.title = 'Este modelo contém variáveis dinâmicas';
            variableIndicator.textContent = '🤖';
            nameSpan.appendChild(variableIndicator);
        }

        const textNode = document.createTextNode(" " + model.name);
        nameSpan.appendChild(textNode);
        headerDiv.appendChild(nameSpan);
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'model-actions';
        
        const addButton = document.createElement('button');
        addButton.className = 'action-btn';
        addButton.innerHTML = ICON_PLUS;
        addButton.title = 'Inserir modelo';
        addButton.onclick = () => insertModelContent(model); // ALTERADO: Passa o objeto model inteiro
        
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

function filterModels() {
    const query = searchBox.value.toLowerCase().trim();
    const activeContentArea = document.getElementById('active-content-area');
    activeContentArea.style.borderColor = appState.tabs.find(t => t.id === appState.activeTabId)?.color || '#ccc';

    let filteredModels = [];
    
    if (!query) {
        if (appState.activeTabId === FAVORITES_TAB_ID) {
            filteredModels = appState.models.filter(m => m.isFavorite);
        } else {
            filteredModels = appState.models.filter(m => m.tabId === appState.activeTabId);
        }
    } else {
        activeContentArea.style.borderColor = '#aaa';
        const models = appState.models;
        if (query.includes(' ou ')) {
            const terms = query.split(' ou ').map(t => t.trim()).filter(Boolean);
            filteredModels = models.filter(model => {
                const modelText = (model.name + ' ' + model.content).toLowerCase();
                return terms.some(term => modelText.includes(term));
            });
        } else if (query.includes(' e ')) {
            const terms = query.split(' e ').map(t => t.trim()).filter(Boolean);
            filteredModels = models.filter(model => {
                const modelText = (model.name + ' ' + model.content).toLowerCase();
                return terms.every(term => modelText.includes(term));
            });
        } else {
            filteredModels = models.filter(model =>
                model.name.toLowerCase().includes(query) || model.content.toLowerCase().includes(query)
            );
        }
    }

    return filteredModels.sort((a, b) => a.name.localeCompare(b.name));
}

// --- MANIPULAÇÃO DE DADOS (COM alert/confirm SUBSTITUÍDOS) ---
function addNewTab() { const name = prompt("Digite o nome da nova aba:"); if (name && name.trim()) { modifyStateAndBackup(() => { const newTab = { id: `tab-${Date.now()}`, name: name.trim(), color: getNextColor() }; appState.tabs.push(newTab); appState.activeTabId = newTab.id; render(); }); } }

function deleteTab(tabId) {
    const tabToDelete = appState.tabs.find(t => t.id === tabId);
    NotificationService.showConfirm({
        message: `Tem certeza que deseja excluir a aba "${tabToDelete.name}"? Os modelos desta aba serão movidos.`,
        onConfirm: () => {
            const regularTabs = appState.tabs.filter(t => t.id !== FAVORITES_TAB_ID && t.id !== POWER_TAB_ID);
            const destinationOptions = regularTabs.filter(t => t.id !== tabId);
            const promptMessage = `Para qual aba deseja mover os modelos?\n` + destinationOptions.map((t, i) => `${i + 1}: ${t.name}`).join('\n');
            const choice = prompt(promptMessage);
            const choiceIndex = parseInt(choice, 10) - 1;
            if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= destinationOptions.length) {
                NotificationService.show("Seleção inválida. A exclusão foi cancelada.", "error");
                return;
            }
            modifyStateAndBackup(() => {
                const destinationTabId = destinationOptions[choiceIndex].id;
                appState.models.forEach(model => {
                    if (model.tabId === tabId) { model.tabId = destinationTabId; }
                });
                appState.tabs = appState.tabs.filter(t => t.id !== tabId);
                appState.activeTabId = destinationTabId;
                render();
            });
        }
    });
}

function addNewModelFromEditor() {
    const content = tinymce.activeEditor.getContent();
    if (!content) {
        NotificationService.show('O editor está vazio. Escreva algo para salvar como modelo.', 'error');
        return;
    }
    let targetTabId = appState.activeTabId;
    if (targetTabId === FAVORITES_TAB_ID) {
        targetTabId = appState.tabs.find(t => t.id !== FAVORITES_TAB_ID && t.id !== POWER_TAB_ID)?.id;
        if (!targetTabId) {
            NotificationService.show("Crie uma aba regular primeiro para poder adicionar modelos.", "error");
            return;
        }
    }
    ModalManager.show({
        type: 'modelEditor',
        title: 'Salvar Novo Modelo',
        initialData: { name: '' },
        onSave: (data) => {
            if (!data.name) {
                NotificationService.show('O nome do modelo não pode ser vazio.', 'error');
                return;
            }
            modifyStateAndBackup(() => {
                const newModel = { id: `model-${Date.now()}`, name: data.name, content: content, tabId: targetTabId, isFavorite: false };
                appState.models.push(newModel);
                searchBox.value = '';
                render();
            });
            NotificationService.show('Novo modelo salvo com sucesso!', 'success');
        }
    });
}

function editModel(modelId) {
    const model = appState.models.find(m => m.id === modelId);
    ModalManager.show({
        type: 'modelEditor',
        title: 'Editar Modelo',
        initialData: { name: model.name, content: model.content },
        onSave: (data) => {
            if (!data.name) {
                NotificationService.show('O nome do modelo não pode ser vazio.', 'error');
                return;
            }
            modifyStateAndBackup(() => {
                model.name = data.name;
                model.content = data.content;
                render();
            });
            NotificationService.show('Modelo atualizado!', 'success');
        }
    });
}

function deleteModel(modelId) {
    const model = appState.models.find(m => m.id === modelId);
    NotificationService.showConfirm({
        message: `Tem certeza que deseja excluir o modelo "${model.name}"?`,
        onConfirm: () => {
            modifyStateAndBackup(() => {
                appState.models = appState.models.filter(m => m.id !== modelId);
                render();
            });
            NotificationService.show('Modelo excluído com sucesso!', 'success');
        }
    });
}

function toggleFavorite(modelId) { const model = appState.models.find(m => m.id === modelId); if (model) { modifyStateAndBackup(() => { model.isFavorite = !model.isFavorite; render(); }); } }

function moveModelToAnotherTab(modelId) {
    const model = appState.models.find(m => m.id === modelId);
    const destinationOptions = appState.tabs.filter(t => t.id !== FAVORITES_TAB_ID && t.id !== model.tabId);
    if (destinationOptions.length === 0) {
        NotificationService.show("Não há outras abas para mover este modelo.", "info");
        return;
    }
    const promptMessage = `Para qual aba deseja mover "${model.name}"?\n` + destinationOptions.map((t, i) => `${i + 1}: ${t.name}`).join('\n');
    const choice = prompt(promptMessage);
    const choiceIndex = parseInt(choice, 10) - 1;
    if (!isNaN(choiceIndex) && choiceIndex >= 0 && choiceIndex < destinationOptions.length) {
        modifyStateAndBackup(() => {
            model.tabId = destinationOptions[choiceIndex].id;
            render();
        });
        NotificationService.show(`Modelo movido para a aba "${destinationOptions[choiceIndex].name}".`, 'success');
    } else if(choice) {
        NotificationService.show("Seleção inválida.", "error");
    }
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
        NotificationService.showConfirm({
            message: "Atenção: A importação substituirá todos os seus modelos e abas atuais. Deseja continuar?",
            onConfirm: () => {
                try {
                    const importedState = JSON.parse(e.target.result);
                    if (importedState.models && importedState.tabs && importedState.activeTabId) {
                        appState = importedState;
                        const filename = file.name;
                        const match = filename.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})/);
                        if (match) {
                            const [, year, month, day, hours, minutes] = match;
                            const fileDate = new Date(year, parseInt(month, 10) - 1, day, hours, minutes);
                            if (!isNaN(fileDate)) { appState.lastBackupTimestamp = fileDate.toISOString(); }
                        }
                        saveStateToStorage();
                        render();
                        NotificationService.show('Modelos importados com sucesso!', 'success');
                        BackupManager.updateStatus(appState.lastBackupTimestamp ? new Date(appState.lastBackupTimestamp) : null);
                    } else {
                        throw new Error('Formato de arquivo inválido.');
                    }
                } catch (error) {
                    NotificationService.show('Erro ao importar o arquivo. Verifique se é um JSON válido.', 'error');
                } finally {
                    importFileInput.value = '';
                }
            },
            onCancel: () => {
                importFileInput.value = '';
            }
        });
    };
    reader.readAsText(file);
}

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
window.addEventListener('DOMContentLoaded', () => { 
    const backupStatusEl = document.getElementById('backup-status-text');
    BackupManager.init({ statusElement: backupStatusEl });

    loadStateFromStorage(); 
    render(); 

    if (typeof TINYMCE_CONFIG !== 'undefined') {
        tinymce.init(TINYMCE_CONFIG);
    } else {
        console.error('A configuração do TinyMCE (TINYMCE_CONFIG) não foi encontrada.');
    }

    // Inicializa o módulo da Paleta de Comandos
    CommandPalette.init();

    searchBox.addEventListener('input', debouncedFilter);
    searchBox.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); renderModels(filterModels()); } });
    addNewTabBtn.addEventListener('click', addNewTab);
    addNewModelBtn.addEventListener('click', addNewModelFromEditor);
    searchBtn.addEventListener('click', () => { renderModels(filterModels()); });
    clearSearchBtn.addEventListener('click', () => { searchBox.value = ''; renderModels(filterModels()); });
    exportBtn.addEventListener('click', exportModels);
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleImportFile);
});