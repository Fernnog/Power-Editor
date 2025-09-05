// js/ckeditor-config.js

// --- Plugin para Recuo de Primeira Linha (3cm) com Estado ---
function FirstLineIndentPlugin(editor) {
    // 1. Define o atributo no schema do modelo
    editor.model.schema.extend('$block', { allowAttributes: 'firstLineIndent' });

    // 2. Define a conversão para o HTML (a "view")
    editor.conversion.for('downcast').attributeToAttribute({
        model: 'firstLineIndent',
        view: {
            key: 'style',
            value: 'text-indent: 3cm;'
        }
    });
    
    // 3. Define o comando como um objeto simples (forma compatível)
    editor.commands.add('firstLineIndent', {
        // A função refresh é chamada sempre que a seleção muda
        refresh: function() {
            const model = editor.model;
            const selection = model.document.selection;
            const element = selection.getFirstPosition().parent;
            
            this.isEnabled = true;
            // 'value' será true se o bloco de texto atual tiver o atributo
            this.value = element.hasAttribute('firstLineIndent');
        },

        execute: function() {
            const model = editor.model;
            const block = model.document.selection.getFirstPosition().parent;

            model.change(writer => {
                const hasIndent = block.hasAttribute('firstLineIndent');
                // Alterna o atributo (aplica ou remove)
                writer.setAttribute('firstLineIndent', !hasIndent, block);
            });
        }
    });

    // 4. Cria o botão na UI
    editor.ui.componentFactory.add('firstLineIndent', locale => {
        const command = editor.commands.get('firstLineIndent');
        const button = new editor.ui.Button(locale);
        button.set({
            label: 'Recuar primeira linha (3cm)',
            icon: ICON_FIRST_LINE_INDENT,
            tooltip: true,
            isToggleable: true
        });
        // Vincula o estado 'isOn' do botão ao 'value' do comando
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
    editor.commands.add('customBlockquote', {
        refresh: function() {
            const element = editor.model.document.selection.getFirstPosition().parent;
            this.isEnabled = true;
            this.value = element.hasAttribute('customBlockquote');
        },
        execute: function() {
            const model = editor.model;
            const block = model.document.selection.getFirstPosition().parent;
            model.change(writer => {
                const hasIndent = block.hasAttribute('customBlockquote');
                writer.setAttribute('customBlockquote', !hasIndent, block);
            });
        }
    });
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
            'firstLineIndent', 'customBlockquote'
        ]
    },
    language: 'pt-br',
};
