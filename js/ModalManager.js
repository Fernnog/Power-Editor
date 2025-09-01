const ModalManager = (() => {
    // Referências aos elementos do DOM do modal principal
    const modalContainer = document.getElementById('modal-container');
    const modalContentContainer = document.querySelector('.modal-content');
    const modalTitleEl = document.getElementById('modal-title');
    const modalBtnSave = document.getElementById('modal-btn-save');
    const modalBtnCancel = document.getElementById('modal-btn-cancel');

    // Corpo dinâmico que será substituído
    const dynamicContentArea = document.createElement('div');
    dynamicContentArea.className = 'modal-dynamic-content';
    modalContentContainer.insertBefore(dynamicContentArea, modalBtnSave.parentElement);

    // Armazena a configuração atual, incluindo o callback onSave
    let currentConfig = null;

    /**
     * Constrói o HTML para o editor de modelos (Criar/Editar).
     * @param {object} data - Dados iniciais { name, content }.
     */
    function _buildModelEditorContent(data = {}) {
        dynamicContentArea.innerHTML = `
            <label for="modal-input-name">Nome do Modelo:</label>
            <input type="text" id="modal-input-name" placeholder="Digite o nome aqui..." value="${data.name || ''}">
            
            <label for="modal-input-content">Conteúdo do Modelo:</label>
            <div class="modal-toolbar">
                <button onclick="document.execCommand('bold')"><b>B</b></button>
                <button onclick="document.execCommand('italic')"><i>I</i></button>
                <button onclick="document.execCommand('underline')"><u>U</u></button>
            </div>
            <div id="modal-input-content" class="text-editor-modal" contenteditable="true">${data.content || ''}</div>
        `;
    }
    
    /**
     * Função principal para exibir o modal com uma configuração específica.
     * @param {object} config - Objeto de configuração do modal.
     */
    function show(config) {
        currentConfig = config;
        modalTitleEl.textContent = config.title;

        // Constrói o conteúdo com base no tipo
        // A lógica de 'replacementManager' foi removida, simplificando o módulo.
        if (config.type === 'modelEditor') {
            _buildModelEditorContent(config.initialData);
        } else {
            console.error('Tipo de modal desconhecido:', config.type);
            return;
        }

        modalContainer.classList.add('visible');
        const firstInput = dynamicContentArea.querySelector('input[type="text"]');
        if (firstInput) {
            firstInput.focus();
        }
    }

    /**
     * Oculta o modal e limpa o estado.
     */
    function hide() {
        modalContainer.classList.remove('visible');
        dynamicContentArea.innerHTML = ''; // Limpa o conteúdo para a próxima abertura
        currentConfig = null;
    }

    /**
     * Handler do botão Salvar. Coleta os dados e chama o callback.
     */
    function onSaveClick() {
        if (!currentConfig || typeof currentConfig.onSave !== 'function') return;

        let dataToSave;
        if (currentConfig.type === 'modelEditor') {
            dataToSave = {
                name: document.getElementById('modal-input-name').value,
                content: document.getElementById('modal-input-content').innerHTML
            };
        }
        
        currentConfig.onSave(dataToSave);
        hide();
    }

    // Adiciona os listeners de eventos uma única vez
    modalBtnSave.addEventListener('click', onSaveClick);
    modalBtnCancel.addEventListener('click', hide);
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) hide();
    });

    // Expõe a API pública
    return {
        show,
        hide
    };
})();
