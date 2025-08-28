// --- DADOS E ESTADO DA APLICAÇÃO ---
let modelosDeDocumento = []; // Começa vazio, será populado pelo LocalStorage ou por padrão

const defaultModels = [
    { name: "IDPJ - Criação de Relatório de Sentença", content: "Este é o texto para a criação do relatório de sentença. Inclui seções sobre <b>fatos</b>, <i>fundamentos</i> e <u>dispositivo</u>." },
    { name: "IDPJ - Criar texto de ADMISSIBILIDADE", content: "Texto padrão para a análise de admissibilidade do Incidente de Desconsideração da Personalidade Jurídica." },
    { name: "IDPJ - RELATÓRIO de endereços", content: "Relatório gerado a partir da consulta de endereços nos sistemas conveniados. Segue abaixo a tabela:" }
];

// --- REFERÊNCIAS AOS ELEMENTOS DO HTML ---
const editor = document.getElementById('editor');
const modelList = document.getElementById('model-list');
const searchBox = document.getElementById('search-box');
const lineSpacingSelect = document.getElementById('line-spacing-select');
const indentBtn = document.getElementById('indent-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file-input');
const addNewModelBtn = document.getElementById('add-new-model-btn');

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
function saveModelsToStorage() {
    localStorage.setItem('editorModelosApp', JSON.stringify(modelosDeDocumento));
}

function loadModelsFromStorage() {
    const savedModels = localStorage.getItem('editorModelosApp');
    if (savedModels) {
        try {
            modelosDeDocumento = JSON.parse(savedModels);
        } catch (e) {
            console.error("Erro ao carregar modelos do LocalStorage:", e);
            modelosDeDocumento = defaultModels; // Carrega padrão em caso de erro
        }
    } else {
        modelosDeDocumento = defaultModels; // Carrega padrão se não houver nada salvo
    }
}

// --- FUNÇÕES DO EDITOR ---
function execCmd(command) {
    document.execCommand(command, false, null);
    editor.focus();
}

function insertModelContent(content) {
    editor.focus();
    document.execCommand('insertHTML', false, `<p>${content}</p>`);
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

// --- FUNÇÕES DE GERENCIAMENTO DE MODELOS (CRUD) ---
function renderModels(models) {
    modelList.innerHTML = '';
    models.forEach((model, index) => {
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
        addButton.addEventListener('click', () => insertModelContent(model.content));
        
        const editButton = document.createElement('button');
        editButton.className = 'action-btn';
        editButton.innerHTML = '✏️';
        editButton.title = 'Editar modelo';
        editButton.addEventListener('click', () => editModel(index));

        const deleteButton = document.createElement('button');
        deleteButton.className = 'action-btn';
        deleteButton.innerHTML = '🗑️';
        deleteButton.title = 'Excluir modelo';
        deleteButton.addEventListener('click', () => deleteModel(index));
        
        actionsDiv.appendChild(addButton);
        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);
        
        li.appendChild(nameSpan);
        li.appendChild(actionsDiv);
        modelList.appendChild(li);
    });
}

function filterModels() {
    const query = searchBox.value.toLowerCase();
    const filteredModels = modelosDeDocumento.filter(model => model.name.toLowerCase().includes(query));
    renderModels(filteredModels);
}

function addNewModelFromEditor() {
    const content = editor.innerHTML.trim();
    if (content === '' || content === '<p>Comece a escrever seu texto aqui...</p>' || content === '<p><br></p>') {
        alert('O editor está vazio. Escreva algo para salvar como modelo.');
        return;
    }
    openModal({
        title: 'Salvar Novo Modelo',
        onSave: (name) => {
            if (!name) { alert('O nome do modelo não pode ser vazio.'); return; }
            modelosDeDocumento.push({ name: name, content: content });
            saveModelsToStorage(); // Salva no LocalStorage
            searchBox.value = '';
            filterModels();
            closeModal();
        }
    });
}

function editModel(index) {
    const model = modelosDeDocumento[index];
    openModal({
        title: 'Editar Modelo',
        initialName: model.name,
        initialContent: model.content,
        onSave: (name, content) => {
            if (!name) { alert('O nome do modelo não pode ser vazio.'); return; }
            modelosDeDocumento[index] = { name: name, content: content };
            saveModelsToStorage(); // Salva no LocalStorage
            filterModels();
            closeModal();
        }
    });
}

function deleteModel(index) {
    const modelName = modelosDeDocumento[index].name;
    if (confirm(`Tem certeza que deseja excluir o modelo "${modelName}"?`)) {
        modelosDeDocumento.splice(index, 1);
        saveModelsToStorage(); // Salva no LocalStorage
        filterModels();
    }
}

// --- FUNÇÕES DE IMPORTAÇÃO/EXPORTAÇÃO ---
function exportModels() {
    const dataStr = JSON.stringify(modelosDeDocumento, null, 2);
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
        if (!confirm("Atenção: A importação substituirá todos os seus modelos atuais. Deseja continuar?")) {
            importFileInput.value = '';
            return;
        }
        try {
            const importedModels = JSON.parse(e.target.result);
            if (Array.isArray(importedModels) && importedModels.every(m => m.name && m.content)) {
                modelosDeDocumento = importedModels;
                saveModelsToStorage(); // Salva os modelos importados
                renderModels(modelosDeDocumento);
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
    modalInputContent.value = config.initialContent || '';
    
    const isContentVisible = config.initialContent !== undefined;
    modalInputContent.style.display = isContentVisible ? 'block' : 'none';
    modalContentLabel.style.display = isContentVisible ? 'block' : 'none';

    currentOnSave = () => config.onSave(modalInputName.value, modalInputContent.value);
    
    modalContainer.classList.add('visible');
    modalInputName.focus();
}

function closeModal() {
    modalContainer.classList.remove('visible');
    currentOnSave = null;
}

// --- INICIALIZAÇÃO E LISTENERS ---
window.addEventListener('DOMContentLoaded', () => {
    loadModelsFromStorage(); // Carrega os modelos salvos
    renderModels(modelosDeDocumento);
    lineSpacingSelect.value = "1.5";
});

searchBox.addEventListener('input', filterModels);
indentBtn.addEventListener('click', indentFirstLine);
exportBtn.addEventListener('click', exportModels);
importBtn.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', handleImportFile);
addNewModelBtn.addEventListener('click', addNewModelFromEditor);

modalBtnSave.addEventListener('click', () => { if (currentOnSave) currentOnSave(); });
modalBtnCancel.addEventListener('click', closeModal);
modalContainer.addEventListener('click', (e) => { if (e.target === modalContainer) closeModal(); });