const EditorActions = (() => {
    /**
     * Aplica formatação customizada ao documento no editor CKEditor.
     * Regras:
     * - Justifica o texto e aplica recuo de primeiro nível (3cm) em parágrafos que não são de lista e não possuem recuo.
     * - Parágrafos com recuo significativo (nível 1+) são convertidos em citação (6cm).
     * @param {object} editor - A instância ativa do CKEditor.
     */
    function formatDocument(editor) {
        if (!editor) {
            alert('Editor não encontrado.');
            return;
        }

        const model = editor.model;
        const root = model.document.getRoot();

        model.change(writer => {
            // Percorre todos os nós de bloco (parágrafos, etc.) no documento
            for (const child of root.getChildren()) {
                // Aplica a regra apenas a parágrafos que não são parte de uma lista
                if (child.is('element', 'paragraph') && !child.hasAttribute('listItemId')) {
                    const currentIndent = child.getAttribute('indent');

                    // Se o parágrafo já tiver recuo (nível 1 ou maior), transforma em citação
                    if (currentIndent >= 1) {
                        writer.rename(child, 'blockQuote');
                        // Remove o atributo de indentação antigo, pois o blockquote já tem seu próprio estilo
                        writer.removeAttribute('indent', child);
                    } else {
                        // Se não tiver recuo, aplica alinhamento justificado e recuo de primeiro nível
                        writer.setAttribute('alignment', 'justify', child);
                        // A configuração padrão do CKEditor para indent=1 é de 40px, que é aproximadamente 1.05cm.
                        // Para um recuo visual de ~3cm, precisamos de um nível maior. Usamos 3 como um bom aproximado.
                        // Nota: O valor exato pode ser ajustado com CSS customizado se necessário.
                        writer.setAttribute('indent', 3, child);
                    }
                } else if (child.is('element', 'blockQuote')) {
                    // Garante que citações existentes também sejam justificadas
                    writer.setAttribute('alignment', 'justify', child);
                }
            }
        });

        editor.editing.view.focus();
        alert('Documento formatado com sucesso!');
    }

    // Expõe a função pública
    return {
        formatDocument
    };
})();
