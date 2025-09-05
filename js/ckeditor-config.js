// js/ckeditor-config.js

/**
 * Explicação da Correção:
 * O erro "ClassicEditor.ButtonView is not a constructor" ocorre porque a referência correta
 * na build de CDN é através do namespace `ui`. A forma correta é `ClassicEditor.ui.ButtonView`.
 *
 * Adicionalmente, os erros "toolbarview-item-unavailable" para 'underline' e 'alignment'
 * indicam que a build padrão "Classic" não inclui esses plugins. Eles foram removidos
 * da configuração da barra de ferramentas para permitir que o editor seja inicializado.
 */

// --- Plugin de Ditado por Voz (com o caminho do construtor corrigido) ---
function MicPlugin(editor) {
    editor.ui.componentFactory.add('customMicButton', locale => {
        // CORREÇÃO: Usar ClassicEditor.ui.ButtonView
        const button = new ClassicEditor.ui.ButtonView(locale);
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
        // CORREÇÃO: Usar ClassicEditor.ui.ButtonView
        const button = new ClassicEditor.ui.ButtonView(locale);
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
        // CORREÇÃO: Usar ClassicEditor.ui.ButtonView
        const button = new ClassicEditor.ui.ButtonView(locale);
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
            'heading', '|', // 'heading' é uma boa alternativa que está na build
            'bold', 'italic', /* 'underline' removido */ '|',
            'bulletedList', 'numberedList', 'blockQuote', '|',
            // 'alignment' removido
            'customMicButton', 'customAiButton', 'customReplaceButton'
        ]
    },
    language: 'pt-br',
};
