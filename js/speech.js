const SpeechDictation = (() => {
    // Verifica compatibilidade com navegadores (Chrome/Edge/Safari/Firefox)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;
    let shouldKeepListening = false; // Controle para reinício automático
    const STORAGE_KEY = 'dictation_buffer_backup'; // Chave para o "Rascunho Seguro"

    // Mapeamento dos elementos da interface
    let ui = {
        micIcon: null, langSelect: null, statusDisplay: null, dictationModal: null,
        toolbarMicButton: null, waveAnimation: null, textArea: null,
        interimDisplay: null, saveStatus: null, btnClear: null,
        // NOVOS BOTÕES
        btnInsertRaw: null,
        btnInsertFix: null,
        btnInsertLegal: null
    };

    let onInsertCallback = () => {};
    const isSupported = () => !!SpeechRecognition;

    const setupListeners = () => {
        // --- EVENTO 1: ENQUANTO VOCÊ FALA (Reconhecimento) ---
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscriptChunk = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    // Texto confirmado pelo navegador
                    finalTranscriptChunk += transcript; 
                } else {
                    // Texto provisório (cinza)
                    interimTranscript += transcript;
                }
            }

            // Atualiza o Buffer na tela (Texto Cru)
            if (finalTranscriptChunk && ui.textArea) {
                const currentVal = ui.textArea.value;
                // Adiciona espaço se necessário
                const separator = (currentVal && !/[\s\n]$/.test(currentVal)) ? ' ' : '';
                
                // Formatação mínima apenas para visualização (Maiúscula inicial)
                const formattedChunk = finalTranscriptChunk.charAt(0).toUpperCase() + finalTranscriptChunk.slice(1);
                
                ui.textArea.value += separator + formattedChunk;
                
                // Rola para o final
                ui.textArea.scrollTop = ui.textArea.scrollHeight;
                
                // Salva backup no navegador
                saveBackup(ui.textArea.value);
            }

            // Exibe resultados provisórios
            if (ui.interimDisplay) {
                ui.interimDisplay.textContent = interimTranscript;
            }
        };

        // --- EVENTO 2: RECONEXÃO AUTOMÁTICA ---
        recognition.onend = () => {
            if (shouldKeepListening) {
                // Se o usuário não mandou parar, reinicia o microfone
                updateStatus('Microfone reiniciando...', 'reconnecting');
                try { recognition.start(); } catch (e) {}
            } else {
                isListening = false;
                toggleVisuals(false);
                updateStatus('Pronto para ouvir.');
            }
        };

        // --- EVENTO 3: TRATAMENTO DE ERROS ---
        recognition.onerror = (event) => {
            if (event.error === 'no-speech') return; // Ignora silêncio
            
            if (event.error === 'network') {
                updateStatus('Erro de rede. Reconectando...', 'error');
                setTimeout(() => { if (shouldKeepListening) recognition.start(); }, 1000);
                return;
            }
            
            // Outros erros param o reconhecimento
            shouldKeepListening = false;
            toggleVisuals(false);
            updateStatus('Erro: ' + event.error, 'error');
        };

        // --- AÇÃO: LÓGICA UNIFICADA DE INSERÇÃO (RAW / FIX / LEGAL) ---
        const handleInsert = async (mode) => {
            const rawText = ui.textArea ? ui.textArea.value.trim() : '';
            if (!rawText) {
                alert("O buffer está vazio. Fale algo antes de inserir.");
                return;
            }

            // Para o microfone para evitar conflitos de áudio
            stop();

            // 1. GESTÃO DE UX: BLOQUEIO DE BOTÕES
            const footerGroup = document.querySelector('.footer-buttons-group');
            if (footerGroup) {
                footerGroup.classList.add('disabled-all'); // Classe que aplica opacidade e pointer-events: none via CSS
            }

            // Armazena texto original para caso de erro ou para envio à API
            const originalText = rawText;
            
            try {
                let textToInsert = rawText;

                // Se não for inserção crua, prepara o feedback visual e processa com IA
                if (mode !== 'raw') {
                    // Feedback visual na área de texto
                    if (ui.textArea) {
                        ui.textArea.classList.add('processing-state'); // Classe para pulso amarelo via CSS
                        ui.textArea.setAttribute('data-original-text', originalText);
                        // Mensagem de feedback contextual
                        const msg = mode === 'legal' 
                            ? "⚖️ O Assistente Jurídico está refinando seu texto. Aguarde..." 
                            : "✨ A IA está corrigindo a gramática. Aguarde...";
                        ui.textArea.value = msg;
                    }

                    if (mode === 'fix') {
                        // Correção Padrão (Gramática/Pontuação)
                        textToInsert = await GeminiService.correctText(originalText);
                    } else if (mode === 'legal') {
                        // Refinamento Jurídico (Prompt Sênior)
                        textToInsert = await GeminiService.refineLegalText(originalText);
                    }
                }

                // Insere o texto (cru ou processado) no editor principal
                onInsertCallback(textToInsert);
                
                // Limpa o rascunho e fecha o modal
                clearBackup();
                if (ui.dictationModal) ui.dictationModal.classList.remove('visible');

            } catch (error) {
                console.error("Erro no fluxo de inserção:", error);
                alert("Houve um erro técnico. Inserindo texto original.");
                // Recupera o texto original para garantir que o usuário não perca o trabalho
                onInsertCallback(originalText);
                if (ui.dictationModal) ui.dictationModal.classList.remove('visible');
            } finally {
                // 2. RESTAURAÇÃO DE UX: DESBLOQUEIO E LIMPEZA
                if (footerGroup) {
                    footerGroup.classList.remove('disabled-all');
                }
                
                if (ui.textArea) {
                    ui.textArea.classList.remove('processing-state');
                    // Se o modal não fechou (ex: erro silencioso ou lógica de manter aberto), restaura o texto
                    const savedOriginal = ui.textArea.getAttribute('data-original-text');
                    if (savedOriginal && ui.textArea.value !== savedOriginal) {
                        ui.textArea.value = savedOriginal;
                    }
                }
            }
        };

        // Atribui os listeners aos novos botões
        if (ui.btnInsertRaw) ui.btnInsertRaw.onclick = () => handleInsert('raw');
        if (ui.btnInsertFix) ui.btnInsertFix.onclick = () => handleInsert('fix');
        if (ui.btnInsertLegal) ui.btnInsertLegal.onclick = () => handleInsert('legal');

        // --- AÇÃO: CLIQUE NO BOTÃO LIMPAR ---
        if (ui.btnClear) {
            ui.btnClear.onclick = () => {
                if (confirm('Tem certeza que deseja limpar o rascunho atual?')) {
                    if (ui.textArea) ui.textArea.value = '';
                    clearBackup();
                    if (ui.textArea) ui.textArea.focus();
                }
            };
        }
    };

    const init = (config) => {
        if (!isSupported()) {
            console.error("Web Speech API não suportada neste navegador.");
            return;
        }

        ui = { ...ui, ...config };
        onInsertCallback = config.onInsert;
        
        recognition = new SpeechRecognition();
        recognition.continuous = true; // Continua ouvindo mesmo após pausas
        recognition.interimResults = true; // Mostra o texto enquanto fala
        recognition.lang = 'pt-BR'; // Idioma padrão
        
        setupListeners();
        restoreBackup(); // Recupera texto salvo caso a página tenha sido recarregada
    };

    const start = () => {
        if (isListening) return;
        shouldKeepListening = true;
        if (ui.langSelect) recognition.lang = ui.langSelect.value;
        
        try {
            recognition.start();
            isListening = true;
            toggleVisuals(true);
            updateStatus('Ouvindo...');
            if (ui.dictationModal) ui.dictationModal.classList.add('visible');
            if (ui.textArea) ui.textArea.focus();
        } catch (e) {
            console.error("Erro ao iniciar reconhecimento:", e);
        }
    };

    const stop = () => {
        shouldKeepListening = false;
        if (recognition) recognition.stop();
        isListening = false;
        toggleVisuals(false);
        updateStatus('Pausado.');
    };

    const updateStatus = (text, type = '') => {
        if (ui.statusDisplay) {
            ui.statusDisplay.textContent = text;
            // Mantém a classe base e adiciona o tipo (ex: error, reconnecting)
            ui.statusDisplay.className = 'status-indicator ' + type;
        }
    };

    const toggleVisuals = (active) => {
        if (ui.micIcon) ui.micIcon.classList.toggle('listening', active);
        if (ui.toolbarMicButton) ui.toolbarMicButton.classList.toggle('listening', active);
        if (ui.waveAnimation) active ? ui.waveAnimation.classList.add('active') : ui.waveAnimation.classList.remove('active');
    };

    // Funções de Persistência (Cofre de Voz)
    function saveBackup(text) { 
        localStorage.setItem(STORAGE_KEY, text); 
        if (ui.saveStatus) ui.saveStatus.classList.add('visible');
        // Esconde o indicador de "Salvo" após 2 segundos
        setTimeout(() => { if (ui.saveStatus) ui.saveStatus.classList.remove('visible'); }, 2000);
    }
    
    function restoreBackup() { 
        const b = localStorage.getItem(STORAGE_KEY); 
        if (b && ui.textArea) ui.textArea.value = b; 
    }
    
    function clearBackup() { 
        localStorage.removeItem(STORAGE_KEY); 
        if (ui.textArea) ui.textArea.value = ''; 
    }

    return { init, start, stop, isSupported };
})();
