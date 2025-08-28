// --- DADOS E ESTADO DA APLICAÇÃO ---
let appState = {};
const FAVORITES_TAB_ID = 'favorites-tab-id';

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

// --- REFERÊNCIAS DO MODAL ---
const modalContainer = document.getElementById('modal-container');
const modalTitle = document.getElementById('modal-title');
const modalInputName = document.getElementById('modal-input-name');
const modalInputContent = document.getElementById('modal-input-content');
const modalBtnSave = document.getElementById('modal-btn-save');
const modalBtnCancel = document.getElementById('modal-btn-cancel');
const modalContentLabel = document.querySelector('label[for="modal-input-content"]');
let currentOnSave = null;

// --- FUNÇÕES DE PERSISTÊNCIA (LocalStorage) ---
function saveStateToStorage() {
    localStorage.setItem('editorModelosApp', JSON.stringify(appState));
}

function loadStateFromStorage() {
    const savedState = localStorage.getItem('editorModelosApp');
    if (savedState) {
        appState = JSON.parse(savedState);
        // Garante que a aba de favoritos sempre exista
        if (!appState.tabs.find(t => t.id === FAVORITES_TAB_ID)) {
            appState.tabs.unshift({ id: FAVORITES_TAB_ID, name: 'Favoritos' });
        }
    } else {
        // Estado inicial com abas e modelos padrão
        const defaultTabId = `tab-${Date.now()}`;
        appState = {
            models: defaultModels.map((m, i) => ({
                id: `model-${Date.now() + i}`,
                name: m.name,
                content: m.content,
                tabId: defaultTabId,
                isFavorite: false
            })),
            tabs: [
                { id: FAVORITES_TAB_ID, name: 'Favoritos' },
                { id: defaultTabId, name: 'Geral' }
            ],
            activeTabId: defaultTabId
        };
    }
    // Garante que uma aba válida esteja sempre ativa
    if (!appState.tabs.find(t => t.id === appState.activeTabId)) {
        appState.activeTabId = appState.tabs[1]?.id || null; // Tenta a primeira aba não-favorita
    }
}

// --- FUNÇÕES DO EDITOR ---
function execCmd(command) {
    document.execCommand(command, false, null);
}

function insertModelContent(content) {
    editor.focus();
    document.execCommand('insertHTML', false, content);
}

function indentFirstLine() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    let node = selection.getRangeAt(0).startContainer;
    while (node && node.nodeName !== 'P' && node !== editor) {
        node = node.parentNode;
    }
    if (node && node.nodeName === 'P') {
        node.style.textIndent = node.style.textIndent ? '' : '2em';
    }
    editor.focus();
}

// --- FUNÇÕES DE RENDERIZAÇÃO ---
function render() {
    saveStateToStorage();
    renderTabs();
    renderModels(filterModels());
}

function renderTabs() {
    tabsContainer.innerHTML = '';
    appState.tabs.forEach(tab => {
        const tabEl = document.createElement('button');
        tabEl.className = 'tab-item';
        tabEl.dataset.tabId = tab.id;
        if (tab.id === appState.activeTabId) {
            tabEl.classList.add('active');
        }

        const tabName = document.createElement('span');
        tabName.textContent = tab.name + (tab.id === FAVORITES_TAB_ID ? ' ⭐' : '');
        tabEl.appendChild(tabName);

        tabEl.addEventListener('click', () => {
            appState.activeTabId = tab.id;
            searchBox.value = '';
            render();
        });

        // Adiciona botão de fechar, exceto para Favoritos
        if (tab.id !== FAVORITES_TAB_ID) {
            const closeBtn = document.createElement('span');
            closeBtn.className = 'close-tab-btn';
            closeBtn.innerHTML = '&times;';
            closeBtn.title = 'Excluir aba';
            closeBtn.onclick = (e) => {
                e.stopPropagation(); // Evita que o clique ative a aba
                deleteTab(tab.id);
            };
            tabEl.appendChild(closeBtn);
        }

        tabsContainer.appendChild(tabEl);
    });
}


function renderModels(modelsToRender) {
    modelList.innerHTML = '';
    modelsToRender.forEach(model => {
        const li = document.createElement('li');
        li.className = 'model-item';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'model-name';
        nameSpan.textContent = model.name;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'model-actions';
        
        const addButton = document.createElement('button');
        addButton.className = 'action-btn';
        addButton.innerHTML = '➕';
        addButton.title = 'Inserir modelo';
        addButton.onclick = () => insertModelContent(model.content);

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

        actionsDiv.appendChild(addButton);
        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(moveButton);
        actionsDiv.appendChild(deleteButton);
        actionsDiv.appendChild(favoriteButton);
        li.appendChild(nameSpan);
        li.appendChild(actionsDiv);
        modelList.appendChild(li);
    });
}

function filterModels() {
    const query = searchBox.value.toLowerCase();
    let modelsInScope;

    if (appState.activeTabId === FAVORITES_TAB_ID) {
        modelsInScope = appState.models.filter(m => m.isFavorite);
    } else {
        modelsInScope = appState.models.filter(m => m.tabId === appState.activeTabId);
    }
    
    if (!query) return modelsInScope;
    
    return modelsInScope.filter(model => model.name.toLowerCase().includes(query));
}

// --- FUNÇÕES DE GERENCIAMENTO DE ABAS E MODELOS ---
function addNewTab() {
    const name = prompt("Digite o nome da nova aba:");
    if (name && name.trim()) {
        const newTab = {
            id: `tab-${Date.now()}`,
            name: name.trim()
        };
        appState.tabs.push(newTab);
        appState.activeTabId = newTab.id;
        render();
    }
}

function deleteTab(tabId) {
    const regularTabs = appState.tabs.filter(t => t.id !== FAVORITES_TAB_ID);
    if (regularTabs.length <= 1) {
        alert("Não é possível excluir a última aba.");
        return;
    }
    
    const tabToDelete = appState.tabs.find(t => t.id === tabId);
    if (!confirm(`Tem certeza que deseja excluir a aba "${tabToDelete.name}"? Os modelos desta aba serão movidos.`)) {
        return;
    }

    const destinationOptions = regularTabs.filter(t => t.id !== tabId);
    const promptMessage = `Para qual aba deseja mover os modelos?\n` +
        destinationOptions.map((t, i) => `${i + 1}: ${t.name}`).join('\n');
    const choice = prompt(promptMessage);
    const choiceIndex = parseInt(choice, 10) - 1;

    if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= destinationOptions.length) {
        alert("Seleção inválida. A exclusão foi cancelada.");
        return;
    }
    
    const destinationTabId = destinationOptions[choiceIndex].id;
    appState.models.forEach(model => {
        if (model.tabId === tabId) {
            model.tabId = destinationTabId;
        }
    });

    appState.tabs = appState.tabs.filter(t => t.id !== tabId);
    appState.activeTabId = destinationTabId;
    render();
}

function addNewModelFromEditor() {
    const content = editor.innerHTML.trim();
    if (content === '' || content === '<p>Comece a escrever seu texto aqui...</p>' || content === '<p><br></p>') {
        alert('O editor está vazio. Escreva algo para salvar como modelo.');
        return;
    }

    // Não se pode adicionar um modelo diretamente à aba de favoritos.
    let targetTabId = appState.activeTabId;
    if (targetTabId === FAVORITES_TAB_ID) {
        targetTabId = appState.tabs[1]?.id; // Adiciona na primeira aba regular
        if (!targetTabId) {
            alert("Crie uma aba primeiro para adicionar modelos.");
            return;
        }
    }

    openModal({
        title: 'Salvar Novo Modelo',
        onSave: (name) => {
            if (!name) { alert('O nome do modelo não pode ser vazio.'); return; }
            const newModel = {
                id: `model-${Date.now()}`,
                name: name,
                content: content,
                tabId: targetTabId,
                isFavorite: false
            };
            appState.models.push(newModel);
            searchBox.value = '';
            closeModal();
            render();
        }
    });
}

function editModel(modelId) {
    const model = appState.models.find(m => m.id === modelId);
    openModal({
        title: 'Editar Modelo',
        initialName: model.name,
        initialContent: model.content,
        onSave: (name, content) => {
            if (!name) { alert('O nome do modelo não pode ser vazio.'); return; }
            model.name = name;
            model.content = content;
            closeModal();
            render();
        }
    });
}

function deleteModel(modelId) {
    const model = appState.models.find(m => m.id === modelId);
    if (confirm(`Tem certeza que deseja excluir o modelo "${model.name}"?`)) {
        appState.models = appState.models.filter(m => m.id !== modelId);
        render();
    }
}

function toggleFavorite(modelId) {
    const model = appState.models.find(m => m.id === modelId);
    if (model) {
        model.isFavorite = !model.isFavorite;
        render();
    }
}

function moveModelToAnotherTab(modelId) {
    const model = appState.models.find(m => m.id === modelId);
    const destinationOptions = appState.tabs.filter(t => t.id !== FAVORITES_TAB_ID && t.id !== model.tabId);
    
    if (destinationOptions.length === 0) {
        alert("Não há outras abas para mover este modelo.");
        return;
    }
    
    const promptMessage = `Para qual aba deseja mover "${model.name}"?\n` +
        destinationOptions.map((t, i) => `${i + 1}: ${t.name}`).join('\n');
    const choice = prompt(promptMessage);
    const choiceIndex = parseInt(choice, 10) - 1;

    if (!isNaN(choiceIndex) && choiceIndex >= 0 && choiceIndex < destinationOptions.length) {
        model.tabId = destinationOptions[choiceIndex].id;
        render();
    } else if(choice) {
        alert("Seleção inválida.");
    }
}

// --- FUNÇÕES DE IMPORTAÇÃO/EXPORTAÇÃO ---
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
            // Validação básica da estrutura
            if (importedState.models && importedState.tabs && importedState.activeTabId) {
                appState = importedState;
                render();
                alert('Modelos importados com sucesso!');
            } else { throw new Error('Formato de arquivo inválido.'); }
        } catch (error) {
            alert('Erro ao importar o arquivo. Verifique se é um JSON válido.');
        } finally {
            importFileInput.value = '';
        }
    };
    reader.readAsText(file);
}

// --- FUNÇÕES DO MODAL ---
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

// --- INICIALIZAÇÃO E LISTENERS ---
window.addEventListener('DOMContentLoaded', () => {
    loadStateFromStorage();
    render();
});

searchBox.addEventListener('input', () => renderModels(filterModels()));
addNewTabBtn.addEventListener('click', addNewTab);
addNewModelBtn.addEventListener('click', addNewModelFromEditor);
indentBtn.addEventListener('click', indentFirstLine);
exportBtn.addEventListener('click', exportModels);
importBtn.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', handleImportFile);
modalBtnSave.addEventListener('click', () => { if (currentOnSave) currentOnSave(); });
modalBtnCancel.addEventListener('click', closeModal);
modalContainer.addEventListener('click', (e) => { if (e.target === modalContainer) closeModal(); });