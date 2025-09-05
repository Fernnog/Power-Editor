// js/ckeditor-config.js

// O CKEditor 5 não usa um objeto global `CKEDITOR`. Em vez disso,
// os plugins são criados como classes que estendem `Plugin` do objeto `ClassicEditor`.
// Como estamos usando a build clássica via CDN, essas classes já estão disponíveis no escopo global.

// --- Plugin para o botão de Ditado por Voz ---
class MicPlugin extends ClassicEditor.Plugin {
    init() {
        const editor = this.editor;
        editor.ui.componentFactory.add('customMicButton', locale => {
            const button = new ClassicEditor.ButtonView(locale);
            button.set({
                label: 'Ditar texto',
                icon: ICON_MIC, // Usa a variável global de ui-icons.js
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
}

// --- Plugin para o botão de Correção com IA ---
class AiCorrectionPlugin extends ClassicEditor.Plugin {
    init() {
        const editor = this.editor;
        editor.ui.componentFactory.add('customAiButton', locale => {
            const button = new ClassicEditor.ButtonView(locale);
            button.set({
                label: 'Corrigir Texto com IA',
                icon: ICON_AI_BRAIN,
                tooltip: true
            });
            
            this.listenTo(button, 'execute', async () => {
                const model = editor.model;
                const selection = model.document.selection;
                const selectedText = model.getSelectedContent(selection);
                const text = editor.data.stringify(selectedText);

                if (!text) {
                    alert("Por favor, selecione o texto que deseja corrigir.");
                    return;
                }
                
                try {
                    button.isEnabled = false;
                    button.icon = ICON_SPINNER; // Mostra o spinner

                    const correctedText = await GeminiService.correctText(text, CONFIG.apiKey);
                    
                    model.change(writer => {
                        model.insertContent(writer.createText(correctedText), selection);
                    });

                } catch (error) {
                    console.error("Erro na correção:", error);
                    editor.showNotification ? editor.showNotification('Erro ao corrigir o texto.', 'warning') : alert('Erro ao corrigir o texto.');
                } finally {
                    button.isEnabled = true;
                    button.icon = ICON_AI_BRAIN; // Restaura o ícone original
                }
            });
            return button;
        });
    }
}

// --- Plugin para o Gerenciador de Substituições ---
class ReplacePlugin extends ClassicEditor.Plugin {
    init() {
        const editor = this.editor;
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
}

// CONFIGURAÇÃO PRINCIPAL DO CKEDITOR
// Esta variável agora será encontrada corretamente por script.js
const CKEDITOR_CONFIG = {
    extraPlugins: [MicPlugin, AiCorrectionPlugin, ReplacePlugin],
    toolbar: {
        items: [
            'undo', 'redo', '|',
            'bold', 'italic', 'underline', '|',
            'bulletedList', 'numberedList', 'blockQuote', '|',
            'alignment', '|', // O botão 'justify' agora faz parte de 'alignment'
            'customMicButton', 'customAiButton', 'customReplaceButton'
        ]
    },
    language: 'pt-br',
    // Configuração para o alinhamento justificado ser o padrão
    alignment: {
        options: [ 'left', 'right', 'center', 'justify' ]
    }
};
