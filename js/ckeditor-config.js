// js/ckeditor-config.js

/**
 * Explicação da Correção Final:
 * O erro "Cannot read properties of undefined (reading 'ButtonView')" em 'ClassicEditor.ui'
 * confirma que as ferramentas de UI não estão no objeto global 'ClassicEditor'.
 * Elas estão na propriedade 'ui' da instância do editor que é passada para cada função de plugin.
 * A correção é trocar 'ClassicEditor.ui.ButtonView' por 'editor.ui.ButtonView'.
 */

// --- Plugin de Ditado por Voz (com o caminho do construtor corrigido) ---
function MicPlugin(editor) {
    editor.ui.componentFactory.add('customMicButton', locale => {
        // CORREÇÃO: Usar a instância 'editor', não a classe global 'ClassicEditor'
        const button = new editor.ui.ButtonView(locale);
        button.set({
            label: 'Ditar texto',
            icon: ICON_MIC,
            tooltip: true
        });
        button.on('execute', () => {
            if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                SpeechDictation.start();
            } else {
                alert('O reconhecimento de voz não é suportado.');
            }
        });
        return button;
    });
}

// --- Plugin de Correção com IA (com o caminho do construtor corrigido) ---
function AiCorrectionPlugin(editor) {
    editor.ui.componentFactory.add('customAiButton', locale => {
        // CORREÇÃO: Usar a instância 'editor', não a classe global 'ClassicEditor'
        const button = new editor.ui.ButtonView(locale);
        button.set({
            label: 'Corrigir Texto com IA',
            icon: ICON_AI_BRAIN,
            tooltip: true
        });
        
        button.on('execute', async () => {
            const model = editor.model;
            const selection = model.document.selection;
            const text = editor.data.stringify(model.getSelectedContent(selection));

            if (!text) {
                alert("Por favor, selecione o texto que deseja corrigir.");
                return;
            }
            
            try {
                button.isEnabled = false;
                button.icon = ICON_SPINNER;
                const correctedText = await GeminiService.correctText(text, CONFIG.apiKey);
                model.change(writer => {
                    model.insertContent(writer.createText(correctedText), selection);
                });
            } catch (error) {
                console.error("Erro na correção:", error);
                alert('Erro ao corrigir o texto.');
            } finally {
                button.isEnabled = true;
                button.icon = ICON_AI_BRAIN;
            }
        });
        return button;
    });
}

// --- Plugin de Gerenciador de Substituições (com o caminho do construtor corrigido) ---
function ReplacePlugin(editor) {
    editor.ui.componentFactory.add('customReplaceButton', locale => {
        // CORREÇÃO: Usar a instância 'editor', não a classe global 'ClassicEditor'
        const button = new editor.ui.ButtonView(locale);
        button.set({
            label: 'Gerenciar Substituições',
            icon: ICON_REPLACE,
            tooltip: true
        });
        button.on('execute', () => {
            ModalManager.show({
                type: 'replacementManager',
                title: 'Gerenciador de Substituições',
                initialData: { replacements: appState.replacements || [] },
                onSave: (data) => {
                    modifyStateAndBackup(() => {
                        appState.replacements = data.replacements;
                    });
                }
            });
        });
        return button;
    });
}

// CONFIGURAÇÃO PRINCIPAL DO CKEDITOR
const CKEDITOR_CONFIG = {
    extraPlugins: [MicPlugin, AiCorrectionPlugin, ReplacePlugin],
    toolbar: {
        items: [
            'undo', 'redo', '|',
            'heading', '|',
            'bold', 'italic', '|',
            'bulletedList', 'numberedList', 'blockQuote', '|',
            'customMicButton', 'customAiButton', 'customReplaceButton'
        ]
    },
    language: 'pt-br',
};
