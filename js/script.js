// js/script.js

// --- DADOS E ESTADO DA APLICAÇÃO ---
let appState = {};
const FAVORITES_TAB_ID = 'favorites-tab-id';
const POWER_TAB_ID = 'rapidos-tab-id';
const TAB_COLORS = [
    // Vermelhos e Rosas
    '#F87171', '#EF4444', '#EC4899', '#D946EF', '#c0392b', // Vinho
    // Laranjas e Amarelos
    '#FBBF24', '#F59E0B', '#F97316', '#EAB308',
    // Verdes
    '#34D399', '#10B981', '#22C55E', '#84CC16', '#6b8e23', // Verde Oliva
    // Azuis
    '#60A5FA', '#3B82F6', '#0EA5E9', '#06B6D4',
    // Roxos e Índigos
    '#A78BFA', '#8B5CF6', '#6366F1', '#8E44AD',
    // Sóbrios e Neutros
    '#6B7280', '#374151', '#111827', '#7f5539', '#A8A29E' // Cinza, Chumbo, Preto, Marrom, Taupe
];

let colorIndex = 0;

const defaultModels = [
    { name: "IDPJ - Criação de Relatório de Sentença", content: "Este é o texto para a criação do relatório de sentença. Inclui seções sobre <b>fatos</b>, <i>fundamentos</i> e <u>dispositivo</u>." },
    { name: "IDPJ - Criar texto de ADMISSIBILIDADE", content: "Texto padrão para a análise de admissibilidade do Incidente de Desconsideração da Personalidade Jurídica." },
    { name: "IDPJ - RELATÓRIO de endereços", content: "Relatório gerado a partir da consulta de endereços nos sistemas conveniados. Segue abaixo a tabela:" }
];

// --- REFERÊNCIAS AOS ELEMENTOS DO HTML ---
const searchBox = document.getElementById('search-box');
const addNewTabBtn = document.getElementById('add-new-tab-btn');
const addNewFolderBtn = document.getElementById('add-new-folder-btn'); // NOVO
const addNewModelBtn = document.getElementById('add-new-model-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file-input');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search-btn');
const searchInTabCheckbox = document.getElementById('search-in-tab-checkbox');

// --- LÓGICA DE BACKUP E MODIFICAÇÃO DE ESTADO CENTRALIZADA ---
function modifyStateAndBackup(modificationFn) {
    modificationFn();
    saveStateToStorage();
    BackupManager.schedule(appState);
    render(); // Re-renderiza a UI após qualquer modificação
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
            models: defaultModels.map((m, i) => ({ id: `model-${Date.now() + i}`, name: m.name, content: m.content, tabId: defaultTabId, isFavorite: false, folderId: null })),
            folders: [], // NOVO
            tabs: [
                { id: FAVORITES_TAB_ID, name: 'Favoritos', color: '#6c757d' },
                { id: POWER_TAB_ID, name: 'Power ⚡', color: '#ce2a66' },
                { id: defaultTabId, name: 'Geral', color: getNextColor() }
            ],
            activeTabId: defaultTabId,
            replacements: [],
            variableMemory: {},
            globalVariables: [],
            lastBackupTimestamp: null
        };
    };

    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            if (Array.isArray(parsedState.models) && Array.isArray(parsedState.tabs)) {
                appState = parsedState;

                // --- Garantir compatibilidade com backups antigos ---
                appState.folders = parsedState.folders || []; // NOVO
                appState.models.forEach(model => {
                    if (typeof model.folderId === 'undefined') {
                        model.folderId = null;
                    }
                });
                // --- Fim da compatibilidade ---
                
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

// --- FUNÇÃO DE RENDERIZAÇÃO PRINCIPAL ---
function render() {
    SidebarManager.render(appState);
}

// --- LÓGICA DE PROCESSAMENTO DE MODELOS (SNIPPETS E VARIÁVEIS AVANÇADAS) ---

/**
 * Função auxiliar para resolver snippets aninhados de forma recursiva.
 * @param {string} content - O conteúdo a ser processado.
 * @param {number} [recursionDepth=0] - Controle para evitar loops infinitos.
 * @returns {string} O conteúdo com todos os snippets substituídos.
 */
function _resolveSnippets(content, recursionDepth = 0) {
    if (recursionDepth > 10) { // Trava de segurança contra loops infinitos
        console.error("Profundidade máxima de snippets aninhados atingida. Verifique se há referências circulares.");
        NotificationService.show("Erro: Referência circular ou excesso de aninhamento nos snippets.", "error");
        return content;
    }

    const snippetRegex = /{{\s*snippet:([^}]+?)\s*}}/g;
    let requiresAnotherPass = false;
    
    const resolvedContent = content.replace(snippetRegex, (match, modelName) => {
        const snippetModel = appState.models.find(m => m.name.toLowerCase() === modelName.trim().toLowerCase());
        if (snippetModel) {
            requiresAnotherPass = true; // O snippet pode conter outros snippets
            return snippetModel.content;
        } else {
            NotificationService.show(`Snippet "${modelName}" não encontrado.`, "error");
            return `[SNIPPET "${modelName}" NÃO ENCONTRADO]`;
        }
    });

    // Se algum snippet foi substituído, faz outra passagem para resolver snippets aninhados
    return requiresAnotherPass ? _resolveSnippets(resolvedContent, recursionDepth + 1) : resolvedContent;
}

/**
 * Processa e substitui todas as variáveis de sistema em um bloco de texto.
 * @param {string} content O texto a ser processado.
 * @returns {string} O texto com as variáveis de sistema substituídas.
 */
function _processSystemVariables(content) {
    const now = new Date();
    
    // Formato DD/MM/AAAA
    const dataSimples = now.toLocaleDateString('pt-BR');
    
    // Formato "terça-feira, 01 de outubro de 2025"
    const optionsExtenso = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dataExtenso = now.toLocaleDateString('pt-BR', optionsExtenso);

    // Formato HH:MM
    const horaSimples = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let processedContent = content;
    processedContent = processedContent.replace(/{{data_atual}}/gi, dataSimples);
    processedContent = processedContent.replace(/{{hora_atual}}/gi, horaSimples);
    processedContent = processedContent.replace(/{{data_por_extenso}}/gi, dataExtenso);
    
    return processedContent;
}

/**
 * Função orquestradora para inserir o conteúdo de um modelo, processando
 * snippets, prompts, variáveis globais e variáveis de formulário em etapas.
 * @param {object} model - O objeto do modelo a ser inserido.
 */
async function insertModelContent(model) {
    if (searchBox.value && appState.activeTabId !== model.tabId) {
        appState.activeTabId = model.tabId;
        searchBox.value = '';
        render();
    }

    // --- ETAPA 1: Resolver todos os snippets primeiro ---
    let processedContent = _resolveSnippets(model.content);

    // Processar variáveis globais
    if (appState.globalVariables && appState.globalVariables.length > 0) {
        appState.globalVariables.forEach(gVar => {
            const globalVarRegex = new RegExp(`{{\\s*${gVar.find}\\s*}}`, 'gi');
            processedContent = processedContent.replace(globalVarRegex, gVar.replace);
        });
    }

    // --- ETAPA 2: Processar variáveis de preenchimento rápido (:prompt) ---
    const promptRegex = /{{\s*([^:]+?):prompt\s*}}/g;
    let promptMatches;
    // Usamos um loop while para garantir que todos os prompts sejam processados sequencialmente
    while ((promptMatches = promptRegex.exec(processedContent)) !== null) {
        const variableName = promptMatches[1];
        const userValue = prompt(`Por favor, insira o valor para "${variableName.replace(/_/g, ' ')}":`);
        
        // Substitui todas as ocorrências desta variável de prompt específica
        const replaceRegex = new RegExp(`{{\\s*${variableName}:prompt\\s*}}`, 'g');
        processedContent = processedContent.replace(replaceRegex, userValue || '');
    }

    // --- ETAPA 3: Coletar variáveis restantes para o modal ---
    const variableRegex = /{{\s*([^}]+?)\s*}}/g;
    const matches = [...processedContent.matchAll(variableRegex)];
    
    // Filtra para não incluir snippets, prompts ou variáveis de sistema
    const uniqueVariablesForModal = [...new Set(matches
        .map(match => match[1])
        .filter(v => 
            !v.startsWith('snippet:') && 
            !v.endsWith(':prompt') && 
            v !== 'data_atual' && 
            v !== 'hora_atual' &&
            v !== 'data_por_extenso'
        )
    )];

    // --- ETAPA 4: Exibir o modal se houver variáveis ---
    if (uniqueVariablesForModal.length > 0) {
        ModalManager.show({
            type: 'variableForm',
            title: 'Preencha as Informações do Modelo',
            initialData: { variables: uniqueVariablesForModal, modelId: model.id },
            saveButtonText: 'Inserir Texto',
            onSave: (data) => {
                let finalContent = processedContent;
                
                // Substitui variáveis do modal
                for (const key in data.values) {
                    const placeholder = new RegExp(`{{\\s*${key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}(:choice\\(.*?\\))?\\s*}}`, 'g');
                    finalContent = finalContent.replace(placeholder, data.values[key] || '');
                }
                
                // ETAPA FINAL: Processa TODAS as variáveis de sistema de uma vez
                finalContent = _processSystemVariables(finalContent);

                if(tinymce.activeEditor) {
                    tinymce.activeEditor.execCommand('mceInsertContent', false, finalContent);
                    tinymce.activeEditor.focus();
                }

                // CORREÇÃO: A chamada modifyStateAndBackup foi completamente removida daqui para não acionar o backup.
            }
        });
    } else {
        // --- ETAPA 5: Inserir diretamente se não houver mais variáveis de usuário ---
        
        // ETAPA FINAL: Processa TODAS as variáveis de sistema de uma vez
        processedContent = _processSystemVariables(processedContent);
    
        if(tinymce.activeEditor) {
            tinymce.activeEditor.execCommand('mceInsertContent', false, processedContent);
            tinymce.activeEditor.focus();
        }
    }
}


// --- FUNÇÕES DE FILTRAGEM ---
let debounceTimer;
function debouncedFilter() { clearTimeout(debounceTimer); debounceTimer = setTimeout(render, 250); }

function filterModels() {
    const query = searchBox.value.toLowerCase().trim();
    const searchInCurrentTab = searchInTabCheckbox.checked;

    let searchPoolModels = appState.models;
    let searchPoolFolders = appState.folders;

    if (searchInCurrentTab) {
        if (appState.activeTabId === FAVORITES_TAB_ID) {
            searchPoolModels = appState.models.filter(m => m.isFavorite);
            const visibleFolderIds = new Set(searchPoolModels.map(m => m.folderId).filter(Boolean));
            searchPoolFolders = appState.folders.filter(f => visibleFolderIds.has(f.id));
        } else {
            searchPoolModels = appState.models.filter(m => m.tabId === appState.activeTabId);
            searchPoolFolders = appState.folders.filter(f => f.tabId === appState.activeTabId);
        }
    }

    // Se não houver busca, retorna todos os itens raiz (modelos sem pasta) e todas as pastas da pool.
    if (!query) {
        const rootItems = searchPoolModels.filter(m => !m.folderId);
        return [...searchPoolFolders, ...rootItems].sort((a, b) => a.name.localeCompare(b.name));
    }

    const matchQuery = (text) => text.toLowerCase().includes(query);

    const matchingModels = searchPoolModels.filter(m => matchQuery(m.name) || matchQuery(m.content));
    const matchingFolders = searchPoolFolders.filter(f => matchQuery(f.name));

    // Inclui as pastas-pai dos modelos encontrados
    const parentFolderIds = new Set(matchingModels.map(m => m.folderId).filter(Boolean));
    const parentFolders = appState.folders.filter(f => parentFolderIds.has(f.id));
    
    // Une todos os resultados (modelos, pastas que deram match, e pastas-pai)
    const resultSet = new Map();
    [...matchingModels, ...matchingFolders, ...parentFolders].forEach(item => resultSet.set(item.id, item));

    return Array.from(resultSet.values()).sort((a, b) => a.name.localeCompare(b.name));
}


// --- MANIPULAÇÃO DE DADOS ---
function addNewTab() { 
    const name = prompt("Digite o nome da nova aba:"); 
    if (name && name.trim()) { 
        modifyStateAndBackup(() => { 
            const newTab = { id: `tab-${Date.now()}`, name: name.trim(), color: getNextColor() }; 
            appState.tabs.push(newTab); 
            appState.activeTabId = newTab.id; 
        }); 
    } 
}

// --- NOVAS FUNÇÕES DE CRUD PARA PASTAS ---
function addNewFolder() {
    let targetTabId = appState.activeTabId;
    if (targetTabId === FAVORITES_TAB_ID || targetTabId === POWER_TAB_ID) {
        NotificationService.show("Não é possível criar pastas nas abas especiais.", "info");
        return;
    }
    const name = prompt("Digite o nome da nova pasta:");
    if (name && name.trim()) {
        modifyStateAndBackup(() => {
            const newFolder = {
                id: `folder-${Date.now()}`,
                name: name.trim(),
                tabId: targetTabId,
                isExpanded: false
            };
            appState.folders.push(newFolder);
        });
    }
}

function renameFolder(folderId) {
    const folder = appState.folders.find(f => f.id === folderId);
    if (!folder) return;
    const newName = prompt('Digite o novo nome para a pasta:', folder.name);
    if (newName && newName.trim()) {
        modifyStateAndBackup(() => {
            folder.name = newName.trim();
        });
    }
}

function deleteFolder(folderId) {
    const folder = appState.folders.find(f => f.id === folderId);
    if (!folder) return;

    NotificationService.showConfirm({
        message: `O que fazer com os modelos dentro da pasta "${folder.name}"?`,
        onConfirm: () => { // Botão "Confirmar" agora significa Mover para a raiz
            modifyStateAndBackup(() => {
                appState.models.forEach(model => {
                    if (model.folderId === folderId) {
                        model.folderId = null;
                    }
                });
                appState.folders = appState.folders.filter(f => f.id !== folderId);
            });
            NotificationService.show('Pasta excluída e modelos movidos para a raiz da aba.', 'success');
        },
        onCancel: () => { // Botão "Cancelar" é usado para a segunda opção
             NotificationService.showConfirm({
                message: `Tem certeza que deseja EXCLUIR PERMANENTEMENTE a pasta "${folder.name}" E todos os modelos contidos nela? Esta ação não pode ser desfeita.`,
                onConfirm: () => {
                    modifyStateAndBackup(() => {
                        appState.models = appState.models.filter(model => model.folderId !== folderId);
                        appState.folders = appState.folders.filter(f => f.id !== folderId);
                    });
                     NotificationService.show('Pasta e seus modelos foram excluídos permanentemente.', 'success');
                }
            });
        }
    });
}

function toggleFolderExpansion(folderId) {
    // Não precisa de modifyStateAndBackup pois é uma alteração de UI temporária
    const folder = appState.folders.find(f => f.id === folderId);
    if (folder) {
        folder.isExpanded = !folder.isExpanded;
        saveStateToStorage(); // Salva o estado de expansão, mas sem acionar backup
        render();
    }
}

function moveModelToFolder(modelId, folderId) {
    modifyStateAndBackup(() => {
        const model = appState.models.find(m => m.id === modelId);
        if (model) {
            model.folderId = folderId;
        }
    });
}
// --- FIM DAS FUNÇÕES DE PASTA ---


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
                // Move os modelos para a nova aba e para a raiz (remove de pastas)
                appState.models.forEach(model => { 
                    if (model.tabId === tabId) {
                        model.tabId = destinationTabId;
                        model.folderId = null; 
                    }
                });
                // Exclui as pastas da aba removida
                appState.folders = appState.folders.filter(f => f.tabId !== tabId);
                appState.tabs = appState.tabs.filter(t => t.id !== tabId);
                appState.activeTabId = destinationTabId;
            });
        }
    });
}

function renameTab(tab) {
    const newName = prompt('Digite o novo nome para a aba:', tab.name);
    if (newName && newName.trim()) {
        modifyStateAndBackup(() => {
            const tabToUpdate = appState.tabs.find(t => t.id === tab.id);
            if(tabToUpdate) tabToUpdate.name = newName.trim();
        });
    }
}

function changeTabColor(tab, color) {
    modifyStateAndBackup(() => {
        const tabToUpdate = appState.tabs.find(t => t.id === tab.id);
        if(tabToUpdate) tabToUpdate.color = color;
    });
}

function addNewModelFromEditor() {
    const content = tinymce.activeEditor.getContent();
    if (!content) {
        NotificationService.show('O editor está vazio. Escreva algo para salvar como modelo.', 'error');
        return;
    }
    let targetTabId = appState.activeTabId;
    if (targetTabId === FAVORITES_TAB_ID || targetTabId === POWER_TAB_ID) {
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
                const newModel = { id: `model-${Date.now()}`, name: data.name, content: content, tabId: targetTabId, isFavorite: false, folderId: null };
                appState.models.push(newModel);
                searchBox.value = '';
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
            });
            NotificationService.show('Modelo excluído com sucesso!', 'success');
        }
    });
}

function toggleFavorite(modelId) { 
    modifyStateAndBackup(() => {
        const model = appState.models.find(m => m.id === modelId);
        if (model) model.isFavorite = !model.isFavorite;
    });
}

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
            model.folderId = null; // Move para a raiz da nova aba
        });
        NotificationService.show(`Modelo movido para a aba "${destinationOptions[choiceIndex].name}".`, 'success');
    } else if(choice) {
        NotificationService.show("Seleção inválida.", "error");
    }
}

function moveModelToTab(modelId, newTabId) {
    modifyStateAndBackup(() => {
        const model = appState.models.find(m => m.id === modelId);
        if (model) {
            if (newTabId === FAVORITES_TAB_ID) {
                model.isFavorite = true;
                NotificationService.show(`"${model.name}" adicionado aos Favoritos.`, 'success');
            } else {
                model.tabId = newTabId;
                model.folderId = null; // Move para a raiz da nova aba
                NotificationService.show(`Modelo movido para a nova aba.`, 'success');
            }
        }
    });
}

function reorderModel(modelId, newIndex) {
    modifyStateAndBackup(() => {
        const modelsInCurrentTab = filterModels();
        const modelToMove = modelsInCurrentTab.find(m => m.id === modelId);
        if (!modelToMove) return;

        const globalIndex = appState.models.findIndex(m => m.id === modelId);
        appState.models.splice(globalIndex, 1);

        if (newIndex >= modelsInCurrentTab.length -1) {
            let lastModelOfTabId = null;
            for(let i = appState.models.length - 1; i >= 0; i--) {
                if (appState.models[i].tabId === modelToMove.tabId) {
                    lastModelOfTabId = appState.models[i].id;
                    break;
                }
            }
            if(lastModelOfTabId) {
                 const targetGlobalIndex = appState.models.findIndex(m => m.id === lastModelOfTabId);
                 appState.models.splice(targetGlobalIndex + 1, 0, modelToMove);
            } else {
                 appState.models.push(modelToMove);
            }
        } else {
            const modelAfter = modelsInCurrentTab[newIndex];
            const targetGlobalIndex = appState.models.findIndex(m => m.id === modelAfter.id);
            appState.models.splice(targetGlobalIndex, 0, modelToMove);
        }
    });
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
                        
                        // --- LÓGICA MANUAL PARA EVITAR BACKUP AUTOMÁTICO ---
                        appState = importedState;
                        
                        const filename = file.name;
                        const match = filename.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})/);
                        let fileDate = null;
                        if (match) {
                            const [, year, month, day, hours, minutes] = match;
                            fileDate = new Date(year, parseInt(month, 10) - 1, day, hours, minutes);
                            if (!isNaN(fileDate)) { 
                                appState.lastBackupTimestamp = fileDate.toISOString(); 
                            }
                        }
                        
                        saveStateToStorage();
                        render();
                        BackupManager.updateStatus(fileDate); // Atualiza o card com a data do arquivo
                        NotificationService.show('Modelos importados com sucesso!', 'success');
                        // FIM DA LÓGICA MANUAL

                    } else {
                        throw new Error('Formato de arquivo inválido.');
                    }
                } catch (error) {
                    NotificationService.show('Erro ao importar o arquivo. Verifique se é um JSON válido.', 'error');
                } finally {
                    importFileInput.value = '';
                }
            },
            onCancel: () => { importFileInput.value = ''; }
        });
    };
    reader.readAsText(file);
}

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
window.addEventListener('DOMContentLoaded', () => { 
    const backupStatusEl = document.getElementById('backup-status-text');
    BackupManager.init({ statusElement: backupStatusEl });

    loadStateFromStorage(); 

    if (typeof TINYMCE_CONFIG !== 'undefined') {
        tinymce.init(TINYMCE_CONFIG);
    } else {
        console.error('A configuração do TinyMCE (TINYMCE_CONFIG) não foi encontrada.');
    }

    CommandPalette.init();
    
    SidebarManager.init({
        filterModels,
        getFavoritesTabId: () => FAVORITES_TAB_ID,
        getPowerTabId: () => POWER_TAB_ID,
        getTabColors: () => TAB_COLORS,
        onTabChange: (tabId) => { appState.activeTabId = tabId; searchBox.value = ''; render(); },
        onTabReorder: (oldIndex, newIndex) => modifyStateAndBackup(() => {
            const movedItem = appState.tabs.splice(oldIndex, 1)[0];
            appState.tabs.splice(newIndex, 0, movedItem);
        }),
        onTabDelete: deleteTab,
        onTabRename: renameTab,
        onTabColorChange: changeTabColor,
        onModelInsert: insertModelContent,
        onModelEdit: editModel,
        onModelDelete: deleteModel,
        onModelMove: moveModelToAnotherTab,
        onModelFavoriteToggle: toggleFavorite,
        onModelReorder: reorderModel,
        onModelDropOnTab: moveModelToTab,
        // --- NOVOS CALLBACKS PARA PASTAS ---
        onFolderToggleExpand: toggleFolderExpansion,
        onFolderRename: renameFolder,
        onFolderDelete: deleteFolder,
        onModelDropOnFolder: moveModelToFolder,
    });
    
    render(); // Primeira renderização

    searchInTabCheckbox.addEventListener('change', debouncedFilter);
    searchBox.addEventListener('input', debouncedFilter);
    searchBox.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); render(); } });
    addNewTabBtn.addEventListener('click', addNewTab);
    addNewFolderBtn.addEventListener('click', addNewFolder); // NOVO
    addNewModelBtn.addEventListener('click', addNewModelFromEditor);
    searchBtn.addEventListener('click', render);
    clearSearchBtn.addEventListener('click', () => { searchBox.value = ''; render(); });
    exportBtn.addEventListener('click', exportModels);
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleImportFile);
});