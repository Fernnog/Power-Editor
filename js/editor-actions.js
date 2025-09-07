// js/editor-actions.js
const EditorActions = (() => {

    /**
     * Função auxiliar para obter o conteúdo de texto de um elemento do modelo CKEditor.
     * @param {object} element - O elemento do modelo.
     * @returns {string} O texto concatenado de todos os nós de texto dentro do elemento.
     */
    function getModelTextContent(element) {
        let text = '';
        for (const child of element.getChildren()) {
            if (child.is('text')) {
                text += child.data;
            } else if (child.is('element')) {
                text += getModelTextContent(child);
            }
        }
        return text;
    }

    /**
     * Aplica formatação customizada ao documento no editor CKEditor.
     * @param {object} editor - A instância ativa do CKEditor.
     */
    function formatDocument(editor) {
        if (!editor) {
            alert('Editor não está pronto. Tente novamente.');
            return;
        }

        const model = editor.model;
        const root = model.document.getRoot();

        let paragraphsAligned = 0;
        let quotesCreated = 0;

        model.change(writer => {
            const childrenToProcess = Array.from(root.getChildren());

            for (const child of childrenToProcess) {
                if (child.is('element', 'paragraph') && !child.hasAttribute('listItemId')) {
                    // Obtém o conteúdo de texto do parágrafo para verificar o recuo
                    const textContent = getModelTextContent(child);

                    // REGRA 1: Parágrafo com recuo grande (6+ espaços) -> Transformar em citação
                    const largeIndentMatch = textContent.match(/^\s{6,}/);
                    // REGRA 2: Parágrafo com recuo pequeno (1-5 espaços) -> Alinhar à margem
                    const smallIndentMatch = textContent.match(/^\s{1,5}/);

                    if (largeIndentMatch || smallIndentMatch) {
                        
                        const textNodes = Array.from(child.getChildren()).filter(node => node.is('text'));
                        if (textNodes.length > 0) {
                            const firstTextNode = textNodes[0];
                            const indentMatch = firstTextNode.data.match(/^\s+/);
                            
                            if (indentMatch) {
                                const rangeToRemove = writer.createRange(
                                    writer.createPositionAt(firstTextNode, 0),
                                    writer.createPositionAt(firstTextNode, indentMatch[0].length)
                                );
                                writer.remove(rangeToRemove);
                            }
                        }

                        if (largeIndentMatch) {
                            // Envolve o parágrafo em um blockQuote
                            const blockQuote = writer.createElement('blockQuote');
                            writer.wrap(writer.createRangeOn(child), blockQuote);
                            quotesCreated++;
                        } else {
                            paragraphsAligned++;
                        }
                    }
                }
            }
        });

        editor.editing.view.focus();

        if (paragraphsAligned > 0 || quotesCreated > 0) {
            let feedbackMessage = "Formatação concluída!\n";
            if (paragraphsAligned > 0) {
                feedbackMessage += `\n- ${paragraphsAligned} parágrafo(s) alinhado(s) à margem.`;
            }
            if (quotesCreated > 0) {
                feedbackMessage += `\n- ${quotesCreated} citação(ões) criada(s).`;
            }
            alert(feedbackMessage);
        } else {
            alert('Nenhum parágrafo precisou de formatação.');
        }
    }

    /**
     * Limpa todo o conteúdo do editor.
     * @param {object} editor - A instância ativa do CKEditor.
     */
    function clearDocument(editor) {
        if (editor) {
            editor.setData('');
        }
    }

    return {
        formatDocument,
        clearDocument
    };
})();
