// --- DADOS SIMULADOS ---
// No futuro, estes dados poderiam vir de um arquivo JSON ou de uma API.
let modelosDeDocumento = [
    {
        name: "IDPJ - Criação de Relatório de Sentença",
        content: "Este é o texto para a criação do relatório de sentença. Inclui seções sobre <b>fatos</b>, <i>fundamentos</i> e <u>dispositivo</u>."
    },
    {
        name: "IDPJ - Criar texto de ADMISSIBILIDADE",
        content: "Texto padrão para a análise de admissibilidade do Incidente de Desconsideração da Personalidade Jurídica."
    },
    {
        name: "IDPJ - RELATÓRIO de endereços",
        content: "Relatório gerado a partir da consulta de endereços nos sistemas conveniados. Segue abaixo a tabela:"
    }
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

// --- FUNÇÕES ---

/**
 * Executa um comando de formatação no texto selecionado no editor.
 * @param {string} command O comando a ser executado (ex: 'bold', 'justifyCenter').
 */
function execCmd(command) {
    document.execCommand(command, false, null);
    editor.focus(); // Devolve o foco ao editor após clicar no botão
}

/**
 * Insere o conteúdo de um modelo no editor de texto.
 * @param {string} content O texto do modelo a ser inserido.
 */
function insertModelContent(content) {
    editor.focus();
    // Usa insertHTML para preservar a formatação do modelo
    document.execCommand('insertHTML', false, `<p>${content}</p>`);
}

/**
 * Renderiza a lista de modelos na sidebar.
 * @param {Array} models A lista de modelos a ser exibida.
 */
function renderModels(models) {
    modelList.innerHTML = ''; // Limpa a lista atual

    models.forEach(model => {
        const li = document.createElement('li');
        li.className = 'model-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'model-name';
        nameSpan.textContent = model.name;
        
        li.appendChild(nameSpan);
        
        // Adiciona o evento de clique para inserir o conteúdo do modelo
        li.addEventListener('click', () => {
            insertModelContent(model.content);
        });
        
        modelList.appendChild(li);
    });
}

/**
 * Filtra os modelos com base no texto digitado na caixa de pesquisa.
 */
function filterModels() {
    const query = searchBox.value.toLowerCase();
    const filteredModels = modelosDeDocumento.filter(model => {
        return model.name.toLowerCase().includes(query);
    });
    renderModels(filteredModels);
}

/**
 * Altera o espaçamento da linha do parágrafo atual.
 * @param {string} lineHeight O valor do espaçamento (ex: '1.5').
 */
function setLineHeight(lineHeight) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const blockElement = container.nodeType === 1 ? container : container.parentElement;

    // Procura o elemento de bloco (P, DIV, etc.) mais próximo para aplicar o estilo
    let elementToStyle = blockElement;
    while (elementToStyle && !['P', 'DIV', 'H1', 'H2', 'H3'].includes(elementToStyle.tagName)) {
        elementToStyle = elementToStyle.parentElement;
    }

    if (elementToStyle) {
        elementToStyle.style.lineHeight = lineHeight;
        editor.focus();
    }
}

/**
 * Exporta a lista de modelos atual para um arquivo JSON.
 */
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

/**
 * Lida com o arquivo JSON importado para carregar modelos.
 * @param {Event} event O evento do input de arquivo.
 */
function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const userConfirmed = confirm("Você tem certeza? A importação substituirá todos os seus modelos atuais.");
    if (!userConfirmed) {
        importFileInput.value = ''; // Reseta o input para permitir nova seleção do mesmo arquivo
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedModels = JSON.parse(e.target.result);
            // Validação simples para garantir que é um array de modelos
            if (Array.isArray(importedModels) && importedModels.every(m => m.name && m.content)) {
                modelosDeDocumento = importedModels;
                renderModels(modelosDeDocumento);
                alert('Modelos importados com sucesso!');
            } else {
                throw new Error('Formato de arquivo inválido.');
            }
        } catch (error) {
            alert('Erro ao importar o arquivo. Verifique se é um JSON válido de modelos.');
            console.error(error);
        } finally {
            importFileInput.value = ''; // Reseta o input
        }
    };
    reader.readAsText(file);
}

// --- INICIALIZAÇÃO ---

// Adiciona "listeners"
searchBox.addEventListener('input', filterModels);
lineSpacingSelect.addEventListener('change', (e) => setLineHeight(e.target.value));
indentBtn.addEventListener('click', () => execCmd('indent'));
exportBtn.addEventListener('click', exportModels);
importBtn.addEventListener('click', () => importFileInput.click()); // Abre o seletor de arquivo
importFileInput.addEventListener('change', handleImportFile);

// Carrega todos os modelos na sidebar quando a página é aberta pela primeira vez
window.addEventListener('DOMContentLoaded', () => {
    renderModels(modelosDeDocumento);
    // Define o valor inicial do seletor
    lineSpacingSelect.value = "1.5";
});
