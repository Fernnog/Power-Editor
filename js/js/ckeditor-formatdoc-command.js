/**
 * @name FormatDocPlugin
 * @description Um plugin autocontido para o CKEditor 5 que adiciona um comando 'formatDocument'.
 * Este comando aplica regras de formatação inteligentes ao documento:
 * 1. Parágrafos com recuo significativo são convertidos em citações (blockquote).
 * 2. Parágrafos com recuo leve têm seu recuo removido.
 * 3. Itens de lista (numerada ou com marcadores) são ignorados para preservar sua estrutura.
 * A abordagem utiliza a API do modelo de dados do CKEditor para garantir estabilidade e integração com o histórico (undo/redo).
 */
function FormatDocPlugin(editor) {
    // Registra o comando 'formatDocument' para que possa ser chamado via editor.execute('formatDocument').
    editor.commands.add('formatDocument', {
        
        /**
         * A lógica principal que será executada quando o comando for chamado.
         */
        execute: () => {
            const model = editor.model;
            const root = model.document.getRoot();

            // O método model.change() agrupa todas as modificações em uma única transação no histórico.
            // Isso garante que um único "Desfazer" (Ctrl+Z) reverta toda a formatação.
            model.change(writer => {
                const elementsToProcess = Array.from(root.getChildren());

                // --- PRIMEIRA PASSAGEM: Converter recuos grandes em citações ---
                for (const element of elementsToProcess) {
                    // REGRA 1: Ignora completamente os itens de lista para não quebrar a formatação.
                    // A verificação é feita no 'listItem', que é o elemento filho de 'bulletedList' ou 'numberedList'.
                    if (element.name === 'listItem' || element.is('element', 'bulletedList') || element.is('element', 'numberedList')) {
                        continue;
                    }

                    // REGRA 2: Processa apenas elementos que possuem o atributo 'indent'.
                    // O CKEditor aplica 'indent' a parágrafos e títulos.
                    if (element.hasAttribute('indent')) {
                        const indentLevel = element.getAttribute('indent');
                        
                        // O primeiro nível de recuo (1) já é visualmente significativo,
                        // correspondendo à regra de "a partir de 6 caracteres".
                        if (indentLevel >= 1) {
                            // Converte o elemento para 'paragraph' para garantir que o comando 'blockquote' funcione
                            // de forma consistente, mesmo que o elemento original seja um 'heading'.
                            writer.rename(element, 'paragraph');
                            
                            // Seleciona o elemento que acabamos de garantir que é um parágrafo.
                            writer.setSelection(element, 'on');

                            // Executa o comando nativo 'blockquote' do editor.
                            // Esta é a forma mais segura de aplicar o estilo de citação.
                            editor.execute('blockquote');

                            // O comando blockquote pode manter o atributo de recuo. Nós o removemos para garantir
                            // que a citação fique alinhada conforme o estilo CSS padrão, evitando recuo duplo.
                            writer.removeAttribute('indent', writer.selection.getFirstPosition().parent);
                        }
                    }
                }
                
                // --- SEGUNDA PASSAGEM: Limpar recuos pequenos remanescentes ---
                // Fazemos isso em uma segunda passagem para não interferir na lógica da primeira.
                const finalElements = Array.from(root.getChildren());
                for (const element of finalElements) {
                     // REGRA 3: Se um parágrafo (que não virou citação) ainda tiver recuo, removemos.
                     // Isso cobre o caso de "recuos de até 5 caracteres".
                    if (element.is('element', 'paragraph') && element.hasAttribute('indent')) {
                         writer.removeAttribute('indent', element);
                    }
                }
            });
        }
    });
}
