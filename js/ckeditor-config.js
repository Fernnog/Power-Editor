// js/ckeditor-config.js
const { Command } = ClassicEditor.builtins;

// --- Plugin para Recuo de Primeira Linha (3cm) com Estado ---
function FirstLineIndentPlugin(editor) {
    // 1. Permite que o atributo seja aplicado em blocos de texto
    editor.model.schema.extend('$block', { allowAttributes: 'firstLineIndent' });

    // 2. Define como o atributo do modelo é convertido para o HTML (a "view")
    editor.conversion.for('downcast').attributeToAttribute({
        model: 'firstLineIndent',
        view: {
            key: 'style',
            value: 'text-indent: 3cm;'
        }
    });

    // 3. Define o comando, agora como uma classe para ter estado
    class FirstLineIndentCommand extends Command {
        refresh() {
            const model = this.editor.model;
            const selection = model.document.selection;
            const element = selection.getFirstPosition().parent;
            
            // O comando está sempre habilitado
            this.isEnabled = true;
            
            // O valor 'isOn' do botão será true se o bloco tiver o atributo
            this.value = element.hasAttribute('firstLineIndent');
        }

        execute() {
            const model = this.editor.model;
            const block = model.document.selection.getFirstPosition().parent;

            model.change(writer => {
                // Alterna o atributo: se tiver, remove; se não tiver, adiciona.
                const hasIndent = block.hasAttribute('firstLineIndent');
                writer.setAttribute('firstLineIndent', !hasIndent, block);
            });
        }
    }

    editor.commands.add('firstLineIndent', new FirstLineIndentCommand(editor));

    // 4. Cria o botão na UI
    editor.ui.componentFactory.add('firstLineIndent', locale => {
        const command = editor.commands.get('firstLineIndent');
        const button = new editor.ui.Button(locale);
        
        button.set({
            label: 'Recuar primeira linha (3cm)',
            icon: ICON_FIRST_LINE_INDENT,
            tooltip: true,
            isToggleable: true // Indica que é um botão de ligar/desligar
        });
        
        // Vincula o estado 'isOn' do botão ao valor do comando. A mágica acontece aqui!
        button.bind('isOn').to(command, 'value');
        button.on('execute', () => editor.execute('firstLineIndent'));
        
        return button;
    });
}

// --- Plugin para Recuo de Bloco/Citação (6cm) com Estado ---
function CustomBlockquotePlugin(editor) {
    editor.model.schema.extend('$block', { allowAttributes: 'customBlockquote' });

    editor.conversion.for('downcast').attributeToAttribute({
        model: 'customBlockquote',
        view: {
            key: 'style',
            value: 'margin-left: 6cm; font-style: italic;'
        }
    });

    class CustomBlockquoteCommand extends Command {
        refresh() {
            const element = this.editor.model.document.selection.getFirstPosition().parent;
            this.isEnabled = true;
            this.value = element.hasAttribute('customBlockquote');
        }

        execute() {
            const model = this.editor.model;
            const block = model.document.selection.getFirstPosition().parent;
            model.change(writer => {
                const hasIndent = block.hasAttribute('customBlockquote');
                writer.setAttribute('customBlockquote', !hasIndent, block);
            });
        }
    }

    editor.commands.add('customBlockquote', new CustomBlockquoteCommand(editor));

    editor.ui.componentFactory.add('customBlockquote', locale => {
        const command = editor.commands.get('customBlockquote');
        const button = new editor.ui.Button(locale);
        
        button.set({
            label: 'Recuar bloco/citação (6cm)',
            icon: ICON_BLOCK_INDENT,
            tooltip: true,
            isToggleable: true
        });

        button.bind('isOn').to(command, 'value');
        button.on('execute', () => editor.execute('customBlockquote'));
        
        return button;
    });
}

// --- CONFIGURAÇÃO PRINCIPAL DO CKEDITOR ---
const CKEDITOR_CONFIG = {
    extraPlugins: [FirstLineIndentPlugin, CustomBlockquotePlugin],
    toolbar: {
        items: [
            'undo', 'redo', '|',
            'heading', '|',
            'bold', 'italic', '|',
            'bulletedList', 'numberedList', '|',
            'firstLineIndent', 'customBlockquote' // Nossos novos botões!
        ]
    },
    language: 'pt-br',
};