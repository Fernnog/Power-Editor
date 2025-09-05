// js/ckeditor-config.js

/**
 * Explicação da Mudança:
 * O erro "Class extends value undefined" ocorre porque a versão CDN do ClassicEditor
 * não expõe a classe `Plugin` no escopo global da mesma forma que um ambiente de build (com imports).
 * A abordagem correta para builds de CDN é criar plugins como funções simples. O CKEditor
 * irá executar cada função listada em `extraPlugins`, passando a instância do editor como argumento.
 */

// --- Plugin de Ditado por Voz (como uma função) ---
function MicPlugin(editor) {
    editor.ui.componentFactory.add('customMicButton', locale => {
        const button = new ClassicEditor.ButtonView(locale);
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

// --- Plugin de Correção com IA (como uma função) ---
function AiCorrectionPlugin(editor) {
    editor.ui.componentFactory.add('customAiButton', locale => {
        const button = new ClassicEditor.ButtonView(locale);
        button.set({
            label: 'Corrigir Texto com IA',
            icon: ICON_AI_BRAIN,
            tooltip: true
        });
        
        button.on('execute', async () => {
            const model = editor.model;
            const selection = model.document.selection;
            const selectedText = model.getSelectedContent(selection);
            // CKEditor 5 usa um 'data processor' para converter o modelo para texto puro.
            const text = editor.data.stringify(selectedText);

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

// --- Plugin de Gerenciador de Substituições (como uma função) ---
function ReplacePlugin(editor) {
    editor.ui.componentFactory.add('customReplaceButton', locale => {
        const button = new ClassicEditor.ButtonView(locale);
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
// A variável agora será definida corretamente antes de ser usada por script.js
const CKEDITOR_CONFIG = {
    // Agora passamos as próprias funções, não as classes
    extraPlugins: [MicPlugin, AiCorrectionPlugin, ReplacePlugin],
    toolbar: {
        items: [
            'undo', 'redo', '|',
            'bold', 'italic', 'underline', '|',
            'bulletedList', 'numberedList', 'blockQuote', '|',
            'alignment', '|',
            'customMicButton', 'customAiButton', 'customReplaceButton'
        ]
    },
    language: 'pt-br',
    alignment: {
        options: [ 'left', 'right', 'center', 'justify' ]
    }
};
