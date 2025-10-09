// js/tinymce-config.js

const CHANGELOG_DATA = {
    currentVersion: '1.0.3',
    history: [
        {
            version: '1.0.3',
            title: '🛠️ Manutenção e Correções',
            content: `
                <ul>
                    <li><strong>Correção Crítica:</strong> Corrigido um erro que impedia o salvamento de novas regras no "Gerenciador de Substituições". A funcionalidade agora está 100% operacional.</li>
                    <li><strong>Consistência de Código:</strong> Alinhada a chamada de função de salvamento de estado com a refatoração mais recente da aplicação.</li>
                </ul>
            `
        },
        {
            version: '1.0.2',
            title: '🚀 Supercharge: Novas Variáveis de Sistema',
            content: `
                <ul>
                    <li><strong>Novas Variáveis Automáticas:</strong> Adicionadas variáveis para <code>{{dia_da_semana}}</code>, <code>{{mes_por_extenso}}</code>, <code>{{ano_atual}}</code> e um <code>{{id_unico}}</code>.</li>
                    <li><strong>Variáveis de Contexto Jurídico:</strong> Pré-configuradas ações rápidas para inserir Número do Processo, Nomes das Partes e Status da Decisão.</li>
                    <li><strong>Posicionamento de Cursor:</strong> Introduzida a variável especial <code>{{cursor}}</code> para posicionar o cursor de digitação após inserir um modelo.</li>
                    <li><strong>Refatoração:</strong> A lógica de exibição de variáveis de sistema na Aba Power agora é dinâmica, facilitando futuras expansões.</li>
                </ul>
            `
        },
        {
            version: '1.0.1',
            title: '✨ Lançamento Inicial e Qualidade de Vida',
            content: `
                <ul>
                    <li><strong>Versão Inicial:</strong> Lançamento da plataforma base do Power Editor.</li>
                    <li><strong>Controle de Versão:</strong> Adicionado o indicador de versão e o changelog clicável no rodapé do editor.</li>
                    <li><strong>UX:</strong> Melhoria no tooltip do botão da Power Palette (FAB) para incluir o atalho de teclado (Ctrl + .).</li>
                </ul>
            `
        }
    ]
};

const TINYMCE_CONFIG = {
    selector: '#editor',
    
    plugins: 'lists pagebreak visualblocks wordcount',
    
    toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | alignjustify | customIndent customBlockquote | pagebreak visualblocks | customMicButton customAiButton customReplaceButton | customPasteMarkdown customCopyFormatted customOdtButton | customThemeButton customDeleteButton',
    
    menubar: false,
    statusbar: true,
    
    formats: {
        bold: { inline: 'strong' },
        italic: { inline: 'em' },
        underline: { inline: 'u', exact: true },
    },
    
    content_style: 'body { font-family:Arial,sans-serif; font-size:16px; line-height: 1.5; text-align: justify; color: var(--editor-text-color); } p { margin-bottom: 1em; } blockquote { margin-left: 7cm; margin-right: 0; padding-left: 15px; border-left: 3px solid #ccc; color: #333; font-style: italic; } blockquote p { text-indent: 0 !important; }',
    
    height: "100%",
    autoresize_bottom_margin: 30,

    setup: function(editor) {
        // --- Função Auxiliar para Gerenciar Temas ---
        const applyTheme = (themeName) => {
            const body = document.body;
            // Limpa temas antigos
            body.classList.remove('theme-dark', 'theme-custom-yellow');
            
            // Adiciona o novo tema, se não for o padrão 'claro'
            if (themeName && themeName !== 'light') {
                body.classList.add(themeName);
            }
            
            // Salva a escolha do usuário
            localStorage.setItem('editorTheme', themeName);
        };
        
        // --- Registro de Ícones Customizados ---
        editor.ui.registry.addIcon('custom-mic', ICON_MIC);
        editor.ui.registry.addIcon('custom-ai-brain', ICON_AI_BRAIN);
        editor.ui.registry.addIcon('custom-replace', ICON_REPLACE);
        editor.ui.registry.addIcon('custom-copy-formatted', ICON_COPY_FORMATTED);
        editor.ui.registry.addIcon('custom-download-doc', ICON_DOWNLOAD_DOC);
        editor.ui.registry.addIcon('custom-spinner', ICON_SPINNER);
        editor.ui.registry.addIcon('custom-delete-doc', ICON_DELETE_DOC);
        editor.ui.registry.addIcon('custom-paste-markdown', ICON_PASTE_MARKDOWN);
        editor.ui.registry.addIcon('custom-join-lines', ICON_JOIN_LINES);
        editor.ui.registry.addIcon('custom-paintbrush', ICON_PAINTBRUSH); // NOVO ÍCONE REGISTRADO

        // --- Definição dos Botões ---

        // Botão para recuo de primeira linha
        editor.ui.registry.addButton('customIndent', {
            icon: 'indent',
            tooltip: 'Recuo da Primeira Linha (3cm)',
            onAction: function() {
                const node = editor.selection.getNode();
                const blockElement = editor.dom.getParents(node, (e) => e.nodeName === 'P' || /^H[1-6]$/.test(e.nodeName), editor.getBody());
                
                if (blockElement.length > 0) {
                    const element = blockElement[0];
                    if (element.style.textIndent) {
                        element.style.textIndent = '';
                    } else {
                        element.style.textIndent = '3cm';
                    }
                }
            }
        });

        // Botão de citação
        editor.ui.registry.addButton('customBlockquote', {
            icon: 'quote',
            tooltip: 'Transformar em citação (7cm + itálico)',
            onAction: function() {
                editor.execCommand('mceBlockQuote');
            }
        });

        // Botão de Ditado por Voz
        editor.ui.registry.addButton('customMicButton', {
            icon: 'custom-mic',
            tooltip: 'Ditar texto',
            onAction: function() {
                if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                    SpeechDictation.start();
                } else {
                    NotificationService.show('O reconhecimento de voz não é suportado neste navegador.', 'error');
                }
            }
        });

        // Botão de Ajustar Texto Quebrado (substituindo o de IA)
        editor.ui.registry.addButton('customAiButton', {
            icon: 'custom-join-lines',
            tooltip: 'Ajustar Texto Quebrado (de PDF)',
            onAction: function(api) {
                ModalManager.show({
                    type: 'textFixer',
                    title: 'Ajustar Texto Quebrado',
                    saveButtonText: 'Ajustar e Inserir',
                    onSave: (data) => {
                        if (data.text) {
                            // Lógica principal: remove quebras de linha e espaços extras
                            const textoAjustado = data.text.replace(/\n/g, ' ').trim();
                            
                            // Insere o texto processado no editor
                            editor.execCommand('mceInsertContent', false, textoAjustado);
                            NotificationService.show('Texto ajustado e inserido com sucesso!', 'success');
                        } else {
                            NotificationService.show('Nenhum texto foi inserido na caixa.', 'info');
                        }
                    }
                });
            }
        });

        // Botão de Substituir Termos
        editor.ui.registry.addButton('customReplaceButton', {
            icon: 'custom-replace',
            tooltip: 'Gerenciar Substituições',
            onAction: function () {
                ModalManager.show({
                    type: 'replacementManager',
                    title: 'Gerenciador de Substituições',
                    initialData: { replacements: appState.replacements || [] },
                    onSave: (data) => {
                        modifyDataState(() => {
                            appState.replacements = data.replacements;
                        });
                        NotificationService.show('Regras de substituição salvas!', 'success');
                    }
                });
            }
        });

        // NOVO BOTÃO: Colar do Markdown
        editor.ui.registry.addButton('customPasteMarkdown', {
            icon: 'custom-paste-markdown',
            tooltip: 'Colar do Markdown',
            onAction: async function() {
                try {
                    const textFromClipboard = await navigator.clipboard.readText();
                    if (textFromClipboard) {
                        const htmlContent = MarkdownConverter.markdownToHtml(textFromClipboard);
                        editor.execCommand('mceInsertContent', false, htmlContent);
                        NotificationService.show('Conteúdo Markdown colado e formatado!', 'success');
                    } else {
                         NotificationService.show('A área de transferência está vazia.', 'info');
                    }
                } catch (error) {
                    console.error('Falha ao ler da área de transferência:', error);
                    NotificationService.show('Não foi possível ler o conteúdo. Verifique as permissões do navegador.', 'error');
                }
            }
        });

        // Botão de Copiar Formatado
        editor.ui.registry.addButton('customCopyFormatted', {
            icon: 'custom-copy-formatted',
            tooltip: 'Copiar como Markdown',
            onAction: async function() {
                try {
                    const htmlContent = editor.getContent();
                    const markdownContent = MarkdownConverter.htmlToMarkdown(htmlContent);
                    
                    await navigator.clipboard.writeText(markdownContent);
                    
                    NotificationService.show('Texto copiado para a área de transferência em formato Markdown!', 'success');
                    
                } catch (error) {
                    console.error('Erro ao copiar como Markdown:', error);
                    NotificationService.show('Ocorreu um erro ao tentar copiar o texto.', 'error');
                }
            }
        });

        // Botão de Download
        editor.ui.registry.addButton('customOdtButton', {
            icon: 'custom-download-doc',
            tooltip: 'Salvar como documento Markdown (.md)',
            onAction: function() {
                const editorContent = editor.getContent();
                try {
                    const markdownContent = MarkdownConverter.htmlToMarkdown(editorContent);
                    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'documento.md';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Erro ao gerar arquivo Markdown:', error);
                    NotificationService.show('Ocorreu um erro ao tentar salvar o documento.', 'error');
                }
            }
        });

        // NOVO BOTÃO: Seletor de Tema
        editor.ui.registry.addMenuButton('customThemeButton', {
            icon: 'custom-paintbrush',
            tooltip: 'Mudar Tema do Editor',
            fetch: function (callback) {
                const items = [
                    {
                        type: 'menuitem',
                        text: 'Modo Claro (Padrão)',
                        onAction: () => applyTheme('light')
                    },
                    {
                        type: 'menuitem',
                        text: 'Modo Escuro',
                        onAction: () => applyTheme('theme-dark')
                    },
                    {
                        type: 'menuitem',
                        text: 'Amarelo Suave',
                        onAction: () => applyTheme('theme-custom-yellow')
                    }
                ];
                callback(items);
            }
        });
        
        // BOTÃO DE APAGAR DOCUMENTO
        editor.ui.registry.addButton('customDeleteButton', {
            icon: 'custom-delete-doc',
            tooltip: 'Apagar todo o conteúdo',
            onAction: function() {
                NotificationService.showConfirm({
                    message: 'Tem certeza que deseja apagar todo o conteúdo do editor? Esta ação não pode ser desfeita.',
                    onConfirm: () => {
                        editor.setContent('');
                        NotificationService.show('Conteúdo do editor apagado.', 'info');
                    }
                });
            }
        });

        // ADICIONADO: Listener para o atalho da Paleta de Comandos dentro do editor
        editor.on('keydown', function(event) {
            // CORREÇÃO DE ATALHO: Mudado de Ctrl+Alt+P para Ctrl+. para consistência
            if (event.ctrlKey && event.key === '.') {
                event.preventDefault();
                event.stopPropagation();
                if (typeof CommandPalette !== 'undefined' && CommandPalette.open) {
                    CommandPalette.open();
                }
            }
        });

        editor.on('init', () => {
            // Carrega e aplica o tema salvo no LocalStorage
            const savedTheme = localStorage.getItem('editorTheme');
            if (savedTheme) {
                applyTheme(savedTheme);
            }

            // --- INÍCIO DA LÓGICA DO CHANGELOG ---
            try {
                const statusBar = editor.getContainer().querySelector('.tox-statusbar');
                const brandingLink = statusBar.querySelector('.tox-statusbar__branding');
                if (brandingLink) {
                    const versionEl = document.createElement('a');
                    versionEl.className = 'version-changelog-link';
                    versionEl.textContent = `| Versão ${CHANGELOG_DATA.currentVersion}`;
                    versionEl.title = 'Clique para ver o histórico de mudanças';

                    versionEl.onclick = () => {
                        ModalManager.show({
                            type: 'info',
                            title: 'Histórico de Versões',
                            initialData: {
                                title: `Novidades da Versão ${CHANGELOG_DATA.currentVersion}`,
                                cards: CHANGELOG_DATA.history.map(item => ({
                                    title: `Versão ${item.version} - ${item.title}`,
                                    content: item.content
                                }))
                            }
                        });
                    };
                    
                    // Insere o novo elemento logo após o link de branding do TinyMCE
                    brandingLink.parentNode.insertBefore(versionEl, brandingLink.nextSibling);
                }
            } catch (error) {
                console.error("Não foi possível adicionar o link de changelog:", error);
            }
            // --- FIM DA LÓGICA DO CHANGELOG ---
        
            if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                SpeechDictation.init({ 
                    micIcon: document.getElementById('dictation-mic-icon'), 
                    langSelect: document.getElementById('dictation-lang-select'), 
                    statusDisplay: document.getElementById('dictation-status'), 
                    dictationModal: document.getElementById('dictation-modal'),
                    toolbarMicButton: editor.getContainer().querySelector('[aria-label="Ditar texto"]'),
                    onResult: (transcript) => { editor.execCommand('mceInsertContent', false, transcript); } 
                });
                const closeBtn = document.getElementById('dictation-close-btn');
                if (closeBtn) closeBtn.addEventListener('click', () => { SpeechDictation.stop(); });
            }

            // --- INÍCIO DA NOVA LÓGICA DE DRAG & DROP ---
            const editorBody = editor.getBody();
            const editorContainer = editor.getContainer();

            // Adiciona feedback visual quando um item arrastável entra na área do editor
            editorContainer.addEventListener('dragenter', (event) => {
                if (Array.from(event.dataTransfer.types).includes('text/plain')) {
                    editorContainer.classList.add('editor-drag-over');
                }
            });

            // Remove o feedback visual quando o item sai
            editorContainer.addEventListener('dragleave', (event) => {
                if (!editorContainer.contains(event.relatedTarget)) {
                   editorContainer.classList.remove('editor-drag-over');
                }
            });

            // Permite que o editor seja uma zona de "drop"
            editorBody.addEventListener('dragover', (event) => {
                event.preventDefault();
            });

            // Lida com o evento de "soltar" o item no editor
            editorBody.addEventListener('drop', (event) => {
                event.preventDefault();
                editorContainer.classList.remove('editor-drag-over'); // Limpa o feedback visual

                const modelId = event.dataTransfer.getData('text/plain');
                if (!modelId || !modelId.startsWith('system-var-')) {
                    return; // Ignora se não for uma variável de sistema
                }

                const type = modelId.replace('system-var-', '');
                const blueprint = POWER_VARIABLE_BLUEPRINTS.find(bp => bp.type === type);
                
                if (blueprint && typeof _processSystemVariables === 'function') {
                    // Simula a criação de um modelo para usar a função de processamento
                    const tempModel = { content: blueprint.build(blueprint.label) };
                    const processedContent = _processSystemVariables(tempModel.content);
                    editor.execCommand('mceInsertContent', false, processedContent);
                } else {
                    console.error('Blueprint ou função _processSystemVariables não encontrada.');
                }
            });
            // --- FIM DA NOVA LÓGICA DE DRAG & DROP ---
        });
        
        // --- LÓGICA DE DETECÇÃO AUTOMÁTICA DE MARKDOWN (CORRIGIDA) ---
        editor.on('paste_preprocess', function (plugin, args) {
            // Para contornar a limpeza do TinyMCE, extraímos o texto puro
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = args.content;
            const plainText = tempDiv.textContent || "";

            // Critérios de detecção aplicados no texto puro
            const isLikelyMarkdown = (
                /[*_#`[\]()~-]/.test(plainText) && // Contém caracteres de Markdown
                plainText.length > 5 && // Não é muito curto
                // Evita converter trechos de código ou URLs que contenham os caracteres
                !/https?:\/\//.test(plainText)
            );

            if (isLikelyMarkdown) {
                // Convertemos o texto PURO, não o conteúdo já processado pelo TinyMCE
                const htmlContent = MarkdownConverter.markdownToHtml(plainText);
                
                // Substituímos o conteúdo a ser colado pelo nosso HTML convertido
                args.content = htmlContent;
                NotificationService.show('Conteúdo Markdown colado e formatado!', 'info', 2500);
            }
        });

        // --- LÓGICA DE SUBSTITUIÇÃO AUTOMÁTICA ---
        editor.on('keyup', function(e) {
            if (e.keyCode !== 32 && e.keyCode !== 13) return; // Só continua para Espaço ou Enter
            if (!appState.replacements || appState.replacements.length === 0) return;

            const rng = editor.selection.getRng();
            const startNode = rng.startContainer;
            const startOffset = rng.startOffset;

            if (startNode.nodeType !== Node.TEXT_NODE) return;
            
            const textBeforeCursor = startNode.nodeValue.substring(0, startOffset);
            
            const sortedRules = [...appState.replacements].sort((a, b) => b.find.length - a.find.length);

            for (const rule of sortedRules) {
                const triggerNormalSpace = rule.find + ' ';
                const triggerNbsp = rule.find + '\u00A0';

                let triggerFound = null;
                if (textBeforeCursor.endsWith(triggerNormalSpace)) {
                    triggerFound = triggerNormalSpace;
                } else if (textBeforeCursor.endsWith(triggerNbsp)) {
                    triggerFound = triggerNbsp;
                }
                
                if (triggerFound) {
                    const replaceRng = document.createRange();
                    replaceRng.setStart(startNode, startOffset - triggerFound.length);
                    replaceRng.setEnd(startNode, startOffset);

                    editor.selection.setRng(replaceRng);
                    editor.selection.setContent(rule.replace + '\u00A0'); 

                    return;
                }
            }
        });
    }
};
