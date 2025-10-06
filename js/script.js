// js/script.js

// --- NOVA BIBLIOTECA DE "BLUEPRINTS" PARA POWER VARIABLES ---
const POWER_VARIABLE_BLUEPRINTS = [
    {
        type: 'prompt',
        label: 'Caixa de Pergunta',
        description: 'Pede ao usuário para digitar um texto livre.',
        icon: '💬',
        build: (name) => `{{${name.replace(/\s+/g, '_').toLowerCase()}:prompt}}`
    },
    {
        type: 'choice',
        label: 'Menu de Opções',
        description: 'Apresenta uma lista de opções para o usuário escolher.',
        icon: '✅',
        build: (name, options) => `{{${name.replace(/\s+/g, '_').toLowerCase()}:choice(${options.join('|')})}}`
    },
    {
        type: 'data_atual',
        label: 'Data Atual (Simples)',
        description: 'Insere a data de hoje no formato DD/MM/AAAA.',
        icon: '📅',
        build: (name) => `{{data_atual}}`
    },
    {
        type: 'data_por_extenso',
        label: 'Data por Extenso',
        description: 'Insere a data completa (ex: sexta-feira, 2 de agosto de 2024).',
        icon: '📜',
        build: (name) => `{{data_por_extenso}}`
    },
    {
        type: 'hora_atual',
        label: 'Hora Atual',
        description: 'Insere a hora e os minutos atuais.',
        icon: '⏰',
        build: (name) => `{{hora_atual}}`
    },
    // --- INÍCIO DAS NOVAS VARIÁVEIS (v1.0.2) ---
    {
        type: 'dia_da_semana',
        label: 'Dia da Semana',
        description: 'Insere o dia atual por extenso (ex: segunda-feira).',
        icon: '🗓️',
        build: (name) => `{{dia_da_semana}}`
    },
    {
        type: 'mes_por_extenso',
        label: 'Mês por Extenso',
        description: 'Insere o mês atual por extenso (ex: julho).',
        icon: '📜',
        build: (name) => `{{mes_por_extenso}}`
    },
    {
        type: 'ano_atual',
        label: 'Ano Atual',
        description: 'Insere o ano corrente com quatro dígitos.',
        icon: '📅',
        build: (name) => `{{ano_atual}}`
    },
    {
        type: 'numero_processo',
        label: 'Número do Processo',
        description: 'Pede ao usuário para digitar o número do processo.',
        icon: '⚖️',
        build: (name) => `{{numero_processo:prompt}}`
    },
    {
        type: 'nome_autor',
        label: 'Nome da Parte (Autor)',
        description: 'Pede ao usuário para digitar o nome do autor.',
        icon: '👤',
        build: (name) => `{{nome_autor:prompt}}`
    },
    {
        type: 'nome_reu',
        label: 'Nome da Parte (Réu)',
        description: 'Pede ao usuário para digitar o nome do réu.',
        icon: '👤',
        build: (name) => `{{nome_reu:prompt}}`
    },
    {
        type: 'status_decisao',
        label: 'Status da Decisão',
        description: 'Apresenta um menu de opções para o status.',
        icon: '✅',
        build: (name) => `{{status_decisao:choice(DEFIRO|INDEFIRO|DEFIRO PARCIALMENTE)}}`
    },
    {
        type: 'id_unico',
        label: 'ID Único',
        description: 'Gera um código de referência único (timestamp).',
        icon: '🆔',
        build: (name) => `{{id_unico}}`
    },
    {
        type: 'cursor',
        label: 'Posição do Cursor',
        description: 'Marca onde o cursor deve ficar após a inserção.',
        icon: '✍️',
        build: (name) => `{{cursor}}`
    }
    // --- FIM DAS NOVAS VARIÁVEIS (v1.0.2) ---
];

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
const addNewFolderBtn = document.getElementById('add-new-folder-btn');
const addNewModelBtn = document.getElementById('add-new-model-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file-input');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search-btn');
const searchInTabCheckbox = document.getElementById('search-in-tab-checkbox');

// --- FUNÇÃO AUXILIAR PARA DETECÇÃO DE POWER VARIABLES ---
/**
 * Verifica se o conteúdo de um modelo consiste em apenas uma única variável.
 * @param {object} model - O objeto do modelo a ser verificado.
 * @returns {boolean} - True se for uma Power Variable, false caso contrário.
 */
function isPowerVariable(model) {
    if (!model || !model.content) return false;
    // A Regex verifica se a string começa (^) e termina ($) com uma única variável {{...}},
    // permitindo espaços em branco (\s*) antes e depois.
    const POWER_VAR_REGEX = /^\s*{{\s*[^}]+?\s*}}\s*$/;
    return POWER_VAR_REGEX.test(model.content);
}

// --- LÓGICA DE BACKUP E MODIFICAÇÃO DE ESTADO CENTRALIZADA (REATORADA) ---

/**
 * Para alterações de DADOS que são significativas e devem acionar um backup.
 * Ex: Criar/editar/excluir modelos, abas, pastas.
 */
function modifyDataState(modificationFn) {
    modificationFn();
    saveStateToStorage();
    BackupManager.schedule(appState);
    render(); // Re-renderiza a UI após qualquer modificação
}

/**
 * Para alterações de ESTADO DA UI que devem ser salvas, mas NÃO acionam backup.
 * Ex: Expandir/recolher pastas.
 */
function modifyUIState(modificationFn) {
    modificationFn();
    saveStateToStorage();
    render(); // Apenas salva e re-renderiza, sem acionar o BackupManager.
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
            tabs: [
                { id: FAVORITES_TAB_ID, name: 'Favoritos', color: '#6c757d' },
                { id: POWER_TAB_ID, name: 'Power ⚡', color: '#ce2a66' },
                { id: defaultTabId, name: 'Geral', color: getNextColor() }
            ],
            folders: [],
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

                appState.folders = parsedState.folders || [];
                // Garante que modelos antigos tenham a propriedade folderId
                appState.models.forEach(m => {
                    if (m.folderId === undefined) {
                        m.folderId = null;
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
    const activeTab = appState.tabs.find(t => t.id === appState.activeTabId);
    
    if (addNewFolderBtn && activeTab) {
        addNewFolderBtn.style.backgroundColor = activeTab.color || '#17a2b8';
        addNewFolderBtn.style.borderColor = activeTab.color ? 'rgba(0,0,0,0.2)' : '#138496';
    }

    SidebarManager.render(appState);
}

// --- LÓGICA DE PROCESSAMENTO DE MODELOS (SNIPPETS E VARIÁVEIS AVANÇADAS) ---

function _resolveSnippets(content, recursionDepth = 0) {
    if (recursionDepth > 10) {
        console.error("Profundidade máxima de snippets aninhados atingida.");
        NotificationService.show("Erro: Referência circular nos snippets.", "error");
        return content;
    }
    const snippetRegex = /{{\s*snippet:([^}]+?)\s*}}/g;
    let requiresAnotherPass = false;
    const resolvedContent = content.replace(snippetRegex, (match, modelName) => {
        const snippetModel = appState.models.find(m => m.name.toLowerCase() === modelName.trim().toLowerCase());
        if (snippetModel) {
            requiresAnotherPass = true;
            return snippetModel.content;
        } else {
            NotificationService.show(`Snippet "${modelName}" não encontrado.`, "error");
            return `[SNIPPET "${modelName}" NÃO ENCONTRADO]`;
        }
    });
    return requiresAnotherPass ? _resolveSnippets(resolvedContent, recursionDepth + 1) : resolvedContent;
}

function _processSystemVariables(content) {
    const now = new Date();
    const dataSimples = now.toLocaleDateString('pt-BR');
    const optionsExtenso = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dataExtenso = now.toLocaleDateString('pt-BR', optionsExtenso);
    const horaSimples = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Novas variáveis (v1.0.2)
    const diaSemana = now.toLocaleDateString('pt-BR', { weekday: 'long' });
    const mesExtenso = now.toLocaleDateString('pt-BR', { month: 'long' });
    const ano = now.getFullYear();
    const idUnico = `ID-${Date.now()}`;

    let processedContent = content;
    processedContent = processedContent.replace(/{{data_atual}}/gi, dataSimples);
    processedContent = processedContent.replace(/{{hora_atual}}/gi, horaSimples);
    processedContent = processedContent.replace(/{{data_por_extenso}}/gi, dataExtenso);
    // Novas substituições (v1.0.2)
    processedContent = processedContent.replace(/{{dia_da_semana}}/gi, diaSemana);
    processedContent = processedContent.replace(/{{mes_por_extenso}}/gi, mesExtenso);
    processedContent = processedContent.replace(/{{ano_atual}}/gi, ano);
    processedContent = processedContent.replace(/{{id_unico}}/gi, idUnico);
    
    return processedContent;
}

async function insertModelContent(model) {
    if (searchBox.value && appState.activeTabId !== model.tabId) {
        appState.activeTabId = model.tabId;
        searchBox.value = '';
        render();
    }
    let processedContent = _resolveSnippets(model.content);

    if (appState.globalVariables && appState.globalVariables.length > 0) {
        appState.globalVariables.forEach(gVar => {
            const globalVarRegex = new RegExp(`{{\\s*${gVar.find}\\s*}}`, 'gi');
            processedContent = processedContent.replace(globalVarRegex, gVar.replace);
        });
    }

    const promptRegex = /{{\s*([^:]+?):prompt\s*}}/g;
    let promptMatches;
    while ((promptMatches = promptRegex.exec(processedContent)) !== null) {
        const variableName = promptMatches[1];
        const userValue = prompt(`Por favor, insira o valor para "${variableName.replace(/_/g, ' ')}":`);
        const replaceRegex = new RegExp(`{{\\s*${variableName}:prompt\s*}}`, 'g');
        processedContent = processedContent.replace(replaceRegex, userValue || '');
    }

    const variableRegex = /{{\s*([^}]+?)\s*}}/g;
    const matches = [...processedContent.matchAll(variableRegex)];
    const uniqueVariablesForModal = [...new Set(matches.map(match => match[1]).filter(v => !v.startsWith('snippet:') && !v.endsWith(':prompt') && v !== 'data_atual' && v !== 'hora_atual' && v !== 'data_por_extenso' && v !== 'dia_da_semana' && v !== 'mes_por_extenso' && v !== 'ano_atual' && v !== 'id_unico' && v !== 'cursor'))];

    if (uniqueVariablesForModal.length > 0) {
        ModalManager.show({
            type: 'variableForm',
            title: 'Preencha as Informações do Modelo',
            initialData: { variables: uniqueVariablesForModal, modelId: model.id },
            saveButtonText: 'Inserir Texto',
            onSave: (data) => {
                let finalContent = processedContent;
                for (const key in data.values) {
                    const placeholder = new RegExp(`{{\\s*${key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}(:choice\\(.*?\\))?\\s*}}`, 'g');
                    finalContent = finalContent.replace(placeholder, data.values[key] || '');
                }
                finalContent = _processSystemVariables(finalContent);
                if (tinymce.activeEditor) {
                    tinymce.activeEditor.execCommand('mceInsertContent', false, finalContent);
                    tinymce.activeEditor.focus();
                }
            }
        });
    } else {
        processedContent = _processSystemVariables(processedContent);
        if (tinymce.activeEditor) {
            const hasCursor = processedContent.includes('{{cursor}}');
            const cursorMarker = `<span id="cursor-marker" style="display:none;">\uFEFF</span>`;
            processedContent = processedContent.replace(/{{cursor}}/g, hasCursor ? cursorMarker : '');

            tinymce.activeEditor.execCommand('mceInsertContent', false, processedContent);

            if (hasCursor) {
                const markerEl = tinymce.activeEditor.dom.get('cursor-marker');
                if (markerEl) {
                    tinymce.activeEditor.selection.select(markerEl);
                    tinymce.activeEditor.selection.collapse(true);
                    tinymce.activeEditor.dom.remove(markerEl);
                }
            }
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

    let sourceModels;
    let sourceFolders;

    if (searchInCurrentTab || !query) {
        if (appState.activeTabId === FAVORITES_TAB_ID) {
            sourceModels = appState.models.filter(m => m.isFavorite);
            sourceFolders = [];
        } else if (appState.activeTabId === POWER_TAB_ID) {
            const userPowerModels = appState.models.filter(m => m.tabId === appState.activeTabId);
            
            // Lógica refatorada para buscar variáveis de sistema dinamicamente (v1.0.2)
            const systemVariableTypes = [
                'data_atual', 'data_por_extenso', 'hora_atual', 'dia_da_semana', 
                'mes_por_extenso', 'ano_atual', 'id_unico', 'cursor'
            ];
            const systemVariables = POWER_VARIABLE_BLUEPRINTS
                .filter(bp => systemVariableTypes.includes(bp.type))
                .map(bp => ({
                    id: `system-var-${bp.type}`,
                    name: bp.label,
                    content: bp.build(bp.label),
                    isSystemVariable: true,
                    tabId: POWER_TAB_ID,
                    type: 'model'
                }));

            sourceModels = [...systemVariables, ...userPowerModels];
            sourceFolders = (appState.folders || []).filter(f => f.tabId === appState.activeTabId);

        } else {
            sourceModels = appState.models.filter(m => m.tabId === appState.activeTabId);
            sourceFolders = (appState.folders || []).filter(f => f.tabId === appState.activeTabId);
        }
    } else {
        sourceModels = appState.models;
        sourceFolders = appState.folders || [];
    }

    if (!query) {
        const foldersWithType = sourceFolders.map(f => ({ ...f, type: 'folder' }));
        const modelsWithType = sourceModels.map(m => ({ ...m, type: 'model' }));
        return [...foldersWithType, ...modelsWithType].sort((a, b) => a.name.localeCompare(b.name));
    }

    let matchedModels;
    if (query.includes(' ou ')) {
        const terms = query.split(' ou ').map(t => t.trim()).filter(Boolean);
        matchedModels = sourceModels.filter(model => {
            const modelText = (model.name + ' ' + (model.content || '')).toLowerCase();
            return terms.some(term => modelText.includes(term));
        });
    } else if (query.includes(' e ')) {
        const terms = query.split(' e ').map(t => t.trim()).filter(Boolean);
        matchedModels = sourceModels.filter(model => {
            const modelText = (model.name + ' ' + (model.content || '')).toLowerCase();
            return terms.every(term => modelText.includes(term));
        });
    } else {
        matchedModels = sourceModels.filter(model =>
            model.name.toLowerCase().includes(query) || (model.content && model.content.toLowerCase().includes(query))
        );
    }

    const matchedFolderIds = new Set(matchedModels.map(m => m.folderId).filter(Boolean));
    const matchedFolders = sourceFolders.filter(f => matchedFolderIds.has(f.id) || f.name.toLowerCase().includes(query));

    const foldersWithType = matchedFolders.map(f => ({ ...f, type: 'folder', isExpanded: true }));
    const modelsWithType = matchedModels.map(m => ({ ...m, type: 'model' }));

    return [...foldersWithType, ...modelsWithType].sort((a, b) => a.name.localeCompare(b.name));
}

// --- MANIPULAÇÃO DE DADOS ---
function addNewTab() { 
    const name = prompt("Digite o nome da nova aba:"); 
    if (name && name.trim()) { 
        modifyDataState(() => { 
            const newTab = { id: `tab-${Date.now()}`, name: name.trim(), color: getNextColor() }; 
            appState.tabs.push(newTab); 
            appState.activeTabId = newTab.id; 
        }); 
    } 
}

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
                NotificationService.show("Seleção inválida. A exclusão foi cancelada.", "error"); return;
            }
            modifyDataState(() => {
                const destinationTabId = destinationOptions[choiceIndex].id;
                appState.models.forEach(model => { if (model.tabId === tabId) model.tabId = destinationTabId; });
                appState.tabs = appState.tabs.filter(t => t.id !== tabId);
                appState.activeTabId = destinationTabId;
            });
        }
    });
}

function renameTab(tab) {
    const newName = prompt('Digite o novo nome para a aba:', tab.name);
    if (newName && newName.trim()) {
        modifyDataState(() => {
            const tabToUpdate = appState.tabs.find(t => t.id === tab.id);
            if(tabToUpdate) tabToUpdate.name = newName.trim();
        });
    }
}

function changeTabColor(tab, color) {
    modifyDataState(() => {
        const tabToUpdate = appState.tabs.find(t => t.id === tab.id);
        if(tabToUpdate) tabToUpdate.color = color;
    });
}

function addNewFolder() {
    if (appState.activeTabId === FAVORITES_TAB_ID || appState.activeTabId === POWER_TAB_ID) {
        NotificationService.show('Não é possível criar pastas nas abas Favoritos ou Power.', 'error');
        return;
    }

    const name = prompt("Digite o nome da nova pasta:");

    if (name && name.trim()) {
        modifyDataState(() => {
            const newFolder = {
                id: `folder-${Date.now()}`,
                name: name.trim(),
                tabId: appState.activeTabId,
                isExpanded: true 
            };
            if (!appState.folders) {
                appState.folders = [];
            }
            appState.folders.push(newFolder);
        });
        NotificationService.show(`Pasta "${name.trim()}" criada com sucesso!`, 'success');
    } else if (name !== null) { 
        NotificationService.show('O nome da pasta não pode ser vazio.', 'error');
    }
}

function renameFolder(folderId) {
    const folder = appState.folders.find(f => f.id === folderId);
    if (!folder) return;

    const newName = prompt('Digite o novo nome para a pasta:', folder.name);

    if (newName && newName.trim() && newName.trim() !== folder.name) {
        modifyDataState(() => {
            folder.name = newName.trim();
        });
        NotificationService.show('Pasta renomeada com sucesso!', 'success');
    } else if (newName && newName.trim() === folder.name) {
        // Não faz nada se o nome for o mesmo
    } else if (newName !== null) {
        NotificationService.show('O nome não pode ser vazio.', 'error');
    }
}

function deleteFolder(folderId) {
    const folder = appState.folders.find(f => f.id === folderId);
    if (!folder) return;

    const modelsInFolder = appState.models.filter(m => m.folderId === folderId);

    if (modelsInFolder.length === 0) {
        NotificationService.showConfirm({
            message: `Tem certeza que deseja excluir a pasta vazia "${folder.name}"?`,
            onConfirm: () => {
                modifyDataState(() => {
                    appState.folders = appState.folders.filter(f => f.id !== folderId);
                });
                NotificationService.show('Pasta excluída com sucesso!', 'success');
            }
        });
    } else {
        const choice = prompt(
            `A pasta "${folder.name}" contém ${modelsInFolder.length} modelo(s).\n\nDigite '1' para MOVER os modelos para a raiz da aba.\nDigite '2' para EXCLUIR PERMANENTEMENTE a pasta e todos os seus modelos.`, '1'
        );

        if (choice === '1') {
            modifyDataState(() => {
                appState.models.forEach(m => { if (m.folderId === folderId) { m.folderId = null; } });
                appState.folders = appState.folders.filter(f => f.id !== folderId);
            });
            NotificationService.show('Pasta excluída e modelos movidos!', 'success');
        } else if (choice === '2') {
             NotificationService.showConfirm({
                message: `ATENÇÃO: Ação IRREVERSÍVEL. Confirma a exclusão da pasta "${folder.name}" E de todos os ${modelsInFolder.length} modelos dentro dela?`,
                onConfirm: () => {
                     modifyDataState(() => {
                        appState.models = appState.models.filter(m => m.folderId !== folderId);
                        appState.folders = appState.folders.filter(f => f.id !== folderId);
                    });
                    NotificationService.show('Pasta e modelos excluídos!', 'success');
                }
            });
        } else if (choice) {
            NotificationService.show('Ação cancelada.', 'info');
        }
    }
}

// --- NOVA LÓGICA DE CRIAÇÃO DE ITENS (CONTEXTUAL) ---

/**
 * Ponto de entrada para o botão "Adicionar". Decide qual fluxo de criação iniciar
 * com base na aba ativa.
 */
function handleAddNewItem() {
    if (appState.activeTabId === POWER_TAB_ID) {
        // Se estamos na aba Power, abre o assistente de criação de Power Variables
        openPowerVariableCreator();
    } else {
        // Se estamos em qualquer outra aba, usa o fluxo antigo de salvar do editor
        addNewModelFromEditor();
    }
}

/**
 * Abre o modal do assistente de criação de Power Variables.
 */
function openPowerVariableCreator() {
    ModalManager.show({
        type: 'powerVariableCreator', // O novo tipo implementado no ModalManager
        title: 'Criar Nova Ação Rápida',
        onSave: (data) => { // A função onSave receberá os dados do formulário final
            const blueprint = POWER_VARIABLE_BLUEPRINTS.find(b => b.type === data.type);
            if (!blueprint || !data.name) {
                NotificationService.show('O nome da ação é obrigatório.', 'error');
                return;
            }

            // Usa a função 'build' do blueprint para gerar o conteúdo do modelo
            const content = blueprint.build(data.name, data.options);
            
            modifyDataState(() => {
                const newModel = { 
                    id: `model-${Date.now()}`, 
                    name: data.name.trim(), 
                    content: content, 
                    tabId: POWER_TAB_ID, 
                    isFavorite: false, 
                    folderId: null 
                };
                appState.models.push(newModel);
            });
            NotificationService.show(`Ação "${data.name.trim()}" criada com sucesso!`, 'success');
        }
    });
}

/**
 * Lógica original para salvar o conteúdo do editor como um novo modelo.
 */
function addNewModelFromEditor() {
    const content = tinymce.activeEditor.getContent();
    if (!content) {
        NotificationService.show('O editor está vazio. Escreva algo para salvar como modelo.', 'error'); return;
    }
    let targetTabId = appState.activeTabId;
    if (targetTabId === FAVORITES_TAB_ID || targetTabId === POWER_TAB_ID) {
        targetTabId = appState.tabs.find(t => t.id !== FAVORITES_TAB_ID && t.id !== POWER_TAB_ID)?.id;
        if (!targetTabId) {
            NotificationService.show("Crie uma aba regular primeiro para poder adicionar modelos.", "error"); return;
        }
    }
    ModalManager.show({
        type: 'modelEditor',
        title: 'Salvar Novo Modelo',
        initialData: { name: '' },
        onSave: (data) => {
            if (!data.name) {
                NotificationService.show('O nome do modelo não pode ser vazio.', 'error'); return;
            }
            modifyDataState(() => {
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
                NotificationService.show('O nome do modelo não pode ser vazio.', 'error'); return;
            }
            modifyDataState(() => {
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
            modifyDataState(() => {
                appState.models = appState.models.filter(m => m.id !== modelId);
            });
            NotificationService.show('Modelo excluído com sucesso!', 'success');
        }
    });
}

function toggleFavorite(modelId) { 
    modifyDataState(() => {
        const model = appState.models.find(m => m.id === modelId);
        if (model) model.isFavorite = !model.isFavorite;
    });
}

function moveModelToAnotherTab(modelId) {
    const model = appState.models.find(m => m.id === modelId);
    const destinationOptions = appState.tabs.filter(t => t.id !== FAVORITES_TAB_ID && t.id !== model.tabId);
    if (destinationOptions.length === 0) {
        NotificationService.show("Não há outras abas para mover este modelo.", "info"); return;
    }
    const promptMessage = `Para qual aba deseja mover "${model.name}"?\n` + destinationOptions.map((t, i) => `${i + 1}: ${t.name}`).join('\n');
    const choice = prompt(promptMessage);
    const choiceIndex = parseInt(choice, 10) - 1;
    if (!isNaN(choiceIndex) && choiceIndex >= 0 && choiceIndex < destinationOptions.length) {
        modifyDataState(() => {
            model.tabId = destinationOptions[choiceIndex].id;
        });
        NotificationService.show(`Modelo movido para a aba "${destinationOptions[choiceIndex].name}".`, 'success');
    } else if(choice) {
        NotificationService.show("Seleção inválida.", "error");
    }
}

function moveModelToTab(modelId, newTabId) {
    modifyDataState(() => {
        const model = appState.models.find(m => m.id === modelId);
        if (model) {
            if (newTabId === FAVORITES_TAB_ID) {
                model.isFavorite = true;
                NotificationService.show(`"${model.name}" adicionado aos Favoritos.`, 'success');
            } else {
                model.tabId = newTabId;
                NotificationService.show(`Modelo movido para a nova aba.`, 'success');
            }
        }
    });
}

function moveModelToFolder(modelId, folderId) {
    modifyDataState(() => {
        const model = appState.models.find(m => m.id === modelId);
        if (model) {
            model.folderId = folderId;
        }
    });
}

function reorderModel(modelId, newIndex) {
    modifyDataState(() => {
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
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
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
                        let fileDate = null;
                        if (match) {
                            const [, year, month, day, hours, minutes] = match;
                            fileDate = new Date(year, parseInt(month, 10) - 1, day, hours, minutes);
                            if (!isNaN(fileDate)) { appState.lastBackupTimestamp = fileDate.toISOString(); }
                        }
                        saveStateToStorage();
                        render();
                        BackupManager.updateStatus(fileDate);
                        NotificationService.show('Modelos importados com sucesso!', 'success');
                    } else { throw new Error('Formato de arquivo inválido.'); }
                } catch (error) {
                    NotificationService.show('Erro ao importar o arquivo. Verifique se é um JSON válido.', 'error');
                } finally { importFileInput.value = ''; }
            },
            onCancel: () => { importFileInput.value = ''; }
        });
    };
    reader.readAsText(file);
}

// NOVA FUNÇÃO para expandir/recolher todas as pastas
function toggleAllFolders(shouldExpand) {
    modifyUIState(() => {
        const foldersInCurrentTab = appState.folders.filter(f => f.tabId === appState.activeTabId);
        if (foldersInCurrentTab.length > 0) {
            foldersInCurrentTab.forEach(folder => {
                folder.isExpanded = shouldExpand;
            });
        } else {
            NotificationService.show("Não há pastas nesta aba.", "info");
        }
    });
}


// --- INICIALIZAÇÃO DA APLICAÇÃO ---
window.addEventListener('DOMContentLoaded', () => { 
    const backupStatusEl = document.getElementById('backup-status-text');
    BackupManager.init({ statusElement: backupStatusEl });

    loadStateFromStorage(); 

    // MELHORIA DE UX (PRIORIDADE 2): Adicionar tooltip descritivo ao FAB
    const fab = document.getElementById('open-palette-fab');
    if (fab) {
        fab.title = 'Abrir Power Palette (Ctrl + .)';
    }

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
        onTabReorder: (oldIndex, newIndex) => modifyDataState(() => {
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
        onModelMoveToFolder: moveModelToFolder,
        onFolderDelete: deleteFolder,
        onFolderRename: renameFolder,
        onToggleAllFolders: toggleAllFolders // Callback para a nova funcionalidade
    });
    
    render();

    searchInTabCheckbox.addEventListener('change', debouncedFilter);
    searchBox.addEventListener('input', debouncedFilter);
    searchBox.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); render(); } });
    addNewTabBtn.addEventListener('click', addNewTab);
    addNewFolderBtn.addEventListener('click', addNewFolder);
    // MODIFICADO: O botão "Adicionar" agora usa o handler contextual
    addNewModelBtn.addEventListener('click', handleAddNewItem);
    searchBtn.addEventListener('click', render);
    clearSearchBtn.addEventListener('click', () => { searchBox.value = ''; render(); });
    exportBtn.addEventListener('click', exportModels);
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleImportFile);
});