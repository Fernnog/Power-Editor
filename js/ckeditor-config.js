const { Plugin } = CKEDITOR.core;
const { ButtonView } = CKEDITOR.ui;

/**
 * Helper para criar botões customizados na toolbar do CKEditor de forma padronizada.
 * @param {object} editor A instância do editor.
 * @param {string} commandName O nome do comando e do componente.
 * @param {string} label O texto de tooltip do botão.
 * @param {string} icon O conteúdo SVG do ícone.
 */
function createCustomButton(editor, commandName, label, icon) {
    editor.ui.componentFactory.add(commandName, locale => {
        const view = new ButtonView(locale);
        view.set({
            label: label,
            icon: icon,
            tooltip: true
        });
        view.on('execute', () => {
            // Dispara o comando correspondente quando o botão é clicado.
            editor.execute(commandName);
        });
        return view;
    });
}

// --- Plugin para o botão de Ditado por Voz ---
class MicPlugin extends Plugin {
    init() {
        createCustomButton(this.editor, 'customMicButton', 'Ditar texto', ICON_MIC);
        
        this.editor.commands.add('customMicButton', {
            execute: () => {
                if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                    SpeechDictation.start();
                } else {
                    const notification = this.editor.plugins.get('Notification');
                    notification.showWarning('O reconhecimento de voz não é suportado neste navegador.');
                }
            }
        });
    }
}

// --- Plugin para o botão de Correção com IA ---
class AiCorrectionPlugin extends Plugin {
    init() {
        const editor = this.editor;
        const notification = editor.plugins.get('Notification');

        createCustomButton(editor, 'customAiButton', 'Corrigir Texto com IA', ICON_AI_BRAIN);
        
        editor.commands.add('customAiButton', {
            execute: async () => {
                if (typeof CONFIG === 'undefined' || !CONFIG.apiKey || CONFIG.apiKey === "SUA_CHAVE_API_VAI_AQUI") {
                    notification.showWarning("Erro: A chave de API não foi configurada. Verifique js/config.js");
                    return;
                }

                // Obtém o conteúdo selecionado do modelo do editor
                const selectedContent = editor.model.getSelectedContent(editor.model.document.selection);
                const textToCorrect = editor.data.stringify(selectedContent);

                if (!textToCorrect) {
                    notification.showInfo("Por favor, selecione o texto que deseja corrigir.");
                    return;
                }
                
                const command = editor.commands.get('customAiButton');
                command.isEnabled = false; // Desabilita o botão durante o processamento

                try {
                    notification.showInfo('Corrigindo texto com IA...', {
                        title: 'Aguarde',
                        progress: 0,
                        id: 'ai-correction'
                    });

                    const correctedText = await GeminiService.correctText(textToCorrect, CONFIG.apiKey);

                    // Insere o texto corrigido, substituindo a seleção
                    editor.model.change(writer => {
                        editor.model.insertContent(writer.createText(correctedText), editor.model.document.selection);
                    });

                    notification.update({
                        id: 'ai-correction',
                        title: 'Sucesso',
                        message: 'Texto corrigido!',
                        type: 'success',
                        progress: 100
                    });

                } catch (error) {
                    console.error("Erro na correção de texto:", error);
                     notification.showWarning('Ocorreu um erro ao corrigir o texto.');
                } finally {
                    command.isEnabled = true; // Reabilita o botão
                }
            }
        });
    }
}

// --- Plugin para o Gerenciador de Substituições ---
class ReplacePlugin extends Plugin {
    init() {
        createCustomButton(this.editor, 'customReplaceButton', 'Gerenciar Substituições', ICON_REPLACE);
        
        this.editor.commands.add('customReplaceButton', {
            execute: () => {
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
            }
        });
    }
}

// --- CONFIGURAÇÃO PRINCIPAL DO CKEDITOR ---
const CKEDITOR_CONFIG = {
    // Adiciona nossos plugins customizados à build do editor.
    extraPlugins: [MicPlugin, AiCorrectionPlugin, ReplacePlugin],
    
    // Define a ordem e os itens da barra de ferramentas.
    toolbar: {
        items: [
            'undo', 'redo',
            '|',
            'bold', 'italic', 'underline',
            '|',
            'bulletedList', 'numberedList', 'blockQuote',
            '|',
            'alignment', // O botão 'justify' agora faz parte de 'alignment'
            '|',
            'customMicButton', 'customAiButton', 'customReplaceButton'
        ]
    },
    // Define o idioma da interface do editor.
    language: 'pt-br'
};
