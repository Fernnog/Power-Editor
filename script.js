// --- DADOS SIMULADOS ---
// No futuro, estes dados poderiam vir de um arquivo JSON ou de uma API.
const modelosDeDocumento = [
    {
        name: "IDPJ - Criação de Relatório de Sentença",
        content: "Este é o texto para a criação do relatório de sentença. Inclui seções sobre fatos, fundamentos e dispositivo."
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
    // Cria um parágrafo para o novo conteúdo e o insere
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

// --- INICIALIZAÇÃO ---

// Adiciona o "listener" para a caixa de pesquisa
searchBox.addEventListener('input', filterModels);

// Carrega todos os modelos na sidebar quando a página é aberta pela primeira vez
window.addEventListener('DOMContentLoaded', () => {
    renderModels(modelosDeDocumento);
});
