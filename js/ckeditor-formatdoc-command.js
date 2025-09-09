// js/ckeditor-formatdoc-command.js

// Em vez de classes globais, definimos UMA função que atua como o plugin.
// O CKEditor chamará esta função e passará a instância do 'editor' para ela.
function FormatDocPlugin(editor) {
    
    // Agora definimos nossa classe de Comando DENTRO do plugin.
    // Isso garante que temos acesso às classes base do editor no momento certo.
    class FormatDocumentCommand extends editor.core.Command {
        execute() {
            const model = editor.model;
            const root = model.document.getRoot();

            let paragraphsAligned = 0;
            let quotesCreated = 0;

            model.change(writer => {
                // Iteramos de trás para frente para evitar erros de referência
                // ao modificar a estrutura do documento durante o loop.
                const childrenToProcess = Array.from(root.getChildren()).reverse();

                for (const child of childrenToProcess) {
                    if (child.is('element', 'paragraph') && !child.hasAttribute('listItemId')) {
                        let textContent = '';
                        // Helper para reconstruir o conteúdo de texto do parágrafo
                        for (const item of child.getChildren()) {
                            if (item.is('text')) {
                                textContent += item.data;
                            }
                        }

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

            // Feedback para o usuário
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
    }

    // O plugin registra o novo comando que acabamos de definir.
    editor.commands.add('formatDocument', new FormatDocumentCommand(editor));
}
