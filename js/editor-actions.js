const EditorActions = (() => {
    /**
     * Aplica formatação padrão (recuo e espaçamento) ao documento no editor TinyMCE.
     */
    function formatDocument() {
        const editor = tinymce.activeEditor;
        if (!editor) {
            alert('Editor não encontrado.');
            return;
        }

        // Usa a API do TinyMCE para percorrer todos os nós de bloco (parágrafos, títulos, etc.)
        editor.selection.select(editor.getBody(), true); // Seleciona todo o conteúdo
        editor.execCommand('JustifyFull'); // Aplica justificação a tudo
        editor.selection.collapse(true); // Limpa a seleção

        const blocks = editor.dom.select('p,h1,h2,h3,h4,h5,h6,li');

        editor.undoManager.transact(() => { // Agrupa todas as alterações em um único "desfazer"
            blocks.forEach(block => {
                const blockName = block.nodeName.toLowerCase();
                
                // Aplica espaçamento 1.5 a todos os blocos
                editor.dom.setStyle(block, 'line-height', '1.5');

                // Aplica recuo de 3cm a parágrafos, removendo de outros elementos
                if (blockName === 'p') {
                    editor.dom.setStyle(block, 'text-indent', '3cm');
                } else {
                    editor.dom.setStyle(block, 'text-indent', '');
                }
            });
        });

        editor.focus();
        alert('Documento formatado com sucesso!');
    }

    // As funções indentFirstLine, formatAsBlockquote e clearDocument foram removidas
    // pois sua lógica foi absorvida pela configuração do TinyMCE ou implementada
    // diretamente nos event listeners em script.js, tornando este módulo mais limpo.

    // Expõe a função pública
    return {
        formatDocument
    };
})();