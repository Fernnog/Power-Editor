// js/ckeditor-config.js

/**
 * Explicação da Correção Definitiva:
 * O erro '... is not a constructor' confirma que a build de CDN não expõe
 * as classes de View (como ButtonView) para instanciação manual.
 * A abordagem correta e mais robusta é usar o sistema de Comandos do CKEditor.
 * 1. Criamos um Comando para encapsular a lógica da ação.
 * 2. Na fábrica de UI, simplesmente vinculamos um novo botão a esse comando.
 * O CKEditor cuida da criação da View do botão para nós.
 */

// --- Plugin Completo para Ditado por Voz ---
function MicPlugin(editor) {
    // 1. Registrar o Comando (a lógica)
    editor.commands.add('executeMicDictation', {
        execute: () => {
            if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                SpeechDictation.start();
            } else {
                alert('O reconhecimento de voz não é suportado.');
            }
        }
    });

    // 2. Registrar o Botão na UI (a aparência)
    editor.ui.componentFactory.add('customMicButton', locale => {
        const button = new editor.ui.Button(locale); // CORREÇÃO: Usar o construtor genérico que a factory fornece
        button.set({
            label: 'Ditar texto',
            icon: ICON_MIC,
            tooltip: true
        });
        // Vincula o botão ao comando
        button.bind('isOn', 'isEnabled').to(editor.commands.get('executeMicDictation'));
        // Executa o comando ao clicar
        button.on('execute', () => editor.execute('executeMicDictation'));
        return button;
    });
}


// --- Plugin Completo para Correção com IA ---
function AiCorrectionPlugin(editor) {
    // 1. Registrar o Comando
    editor.commands.add('executeAiCorrection', {
        execute: async () => {
            const command = editor.commands.get('executeAiCorrection');
            const model = editor.model;
            const selection = model.document.selection;
            const text = editor.data.stringify(model.getSelectedContent(selection));

            if (!text) {
                alert("Por favor, selecione o texto que deseja corrigir.");
                return;
            }
            
            try {
                command.isEnabled = false;
                // A atualização do ícone precisa ser feita no próprio botão (ver abaixo)
                const correctedText = await GeminiService.correctText(text, CONFIG.apiKey);
                model.change(writer => {
                    model.insertContent(writer.createText(correctedText), selection);
                });
            } catch (error) {
                console.error("Erro na correção:", error);
                alert('Erro ao corrigir o texto.');
            } finally {
                command.isEnabled = true;
            }
        }
    });

    // 2. Registrar o Botão
    editor.ui.componentFactory.add('customAiButton', locale => {
        const button = new editor.ui.Button(locale);
        const command = editor.commands.get('executeAiCorrection');
        
        button.set({
            label: 'Corrigir Texto com IA',
            icon: ICON_AI_BRAIN,
            tooltip: true
        });
        
        button.bind('isEnabled').to(command);
        button.on('execute', () => editor.execute('executeAiCorrection'));

        // Lógica para trocar o ícone durante o processamento
        command.on('change:isEnabled', () => {
            if (!command.isEnabled) {
                button.icon = ICON_SPINNER;
            } else {
                button.icon = ICON_AI_BRAIN;
            }
        });

        return button;
    });
}

// --- Plugin Completo para Gerenciador de Substituições ---
function ReplacePlugin(editor) {
    // 1. Registrar o Comando
    editor.commands.add('openReplaceManager', {
        execute: () => {
            ModalManager.show({
                type: 'replacementManager',
                title: 'Gerenciador de Substituições',
                initialData: { replacements: appState.replacements || [] },
                onSave: (data) => {
                    modifyStateAndBackup(() => { appState.replacements = data.replacements; });
                }
            });
        }
    });
    
    // 2. Registrar o Botão
    editor.ui.componentFactory.add('customReplaceButton', locale => {
        const button = new editor.ui.Button(locale);
        button.set({
            label: 'Gerenciar Substituições',
            icon: ICON_REPLACE,
            tooltip: true
        });
        button.bind('isOn', 'isEnabled').to(editor.commands.get('openReplaceManager'));
        button.on('execute', () => editor.execute('openReplaceManager'));
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
