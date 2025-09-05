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
        const command = editor.commands.get('executeMicDictation');
        const buttonView = new editor.ui.ButtonView(locale); // CORREÇÃO: Usar ButtonView

        buttonView.set({
            label: 'Ditar texto',
            icon: ICON_MIC,
            tooltip: true
        });

        // Vincula o estado do botão (ativado/desativado) ao comando.
        buttonView.bind('isOn', 'isEnabled').to(command);

        // Executa o comando quando o botão é clicado.
        buttonView.on('execute', () => editor.execute('executeMicDictation'));

        return buttonView;
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
            
            // CKEditor 5 usa um método diferente para obter o texto selecionado como string
            const selectedContent = model.getSelectedContent(selection);
            const text = editor.data.stringify(selectedContent);

            if (!text) {
                alert("Por favor, selecione o texto que deseja corrigir.");
                return;
            }
            
            try {
                command.isEnabled = false;
                const correctedText = await GeminiService.correctText(text, CONFIG.apiKey);
                
                // Insere o conteúdo corrigido de forma segura
                model.change(writer => {
                    const textNode = writer.createText(correctedText);
                    model.insertContent(textNode, selection);
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
        const command = editor.commands.get('executeAiCorrection');
        const buttonView = new editor.ui.ButtonView(locale); // CORREÇÃO: Usar ButtonView

        buttonView.set({
            label: 'Corrigir Texto com IA',
            icon: ICON_AI_BRAIN,
            tooltip: true
        });
        
        buttonView.bind('isEnabled').to(command);
        buttonView.on('execute', () => editor.execute('executeAiCorrection'));

        // Lógica para trocar o ícone durante o processamento
        command.on('change:isEnabled', () => {
            buttonView.icon = command.isEnabled ? ICON_AI_BRAIN : ICON_SPINNER;
        });

        return buttonView;
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
        const command = editor.commands.get('openReplaceManager');
        const buttonView = new editor.ui.ButtonView(locale); // CORREÇÃO: Usar ButtonView
        
        buttonView.set({
            label: 'Gerenciar Substituições',
            icon: ICON_REPLACE,
            tooltip: true
        });

        buttonView.bind('isOn', 'isEnabled').to(command);
        buttonView.on('execute', () => editor.execute('openReplaceManager'));

        return buttonView;
    });
}

// CONFIGURAÇÃO PRINCIPAL DO CKEDITOR (permanece a mesma)
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
