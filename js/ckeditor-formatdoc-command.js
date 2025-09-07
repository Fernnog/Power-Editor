// js/ckeditor-formatdoc-command.js

// Um "Comando" é a lógica da ação em si.
class FormatDocumentCommand extends DecoupledEditor.Command {
    execute() {
        const editor = this.editor;
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
                    for (const item of child.getChildren()) {
                        if (item.is('text')) {
                            textContent += item.data;
                        }
                    }

                    const largeIndentMatch = textContent.match(/^\s{6,}/);
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

        if (paragraphsAligned > 0 || quotesCreated > 0) {
            let feedbackMessage = "Formatação concluída!\n";
            if (paragraphsAligned > 0) feedbackMessage += `\n- ${paragraphsAligned} parágrafo(s) alinhado(s) à margem.`;
            if (quotesCreated > 0) feedbackMessage += `\n- ${quotesCreated} citação(ões) criada(s).`;
            alert(feedbackMessage);
        } else {
            alert('Nenhum parágrafo precisou de formatação.');
        }
    }
}

// Um "Plugin" é o que 'instala' o nosso comando no editor.
class FormatDocPlugin extends DecoupledEditor.Plugin {
    init() {
        this.editor.commands.add('formatDocument', new FormatDocumentCommand(this.editor));
    }
}
