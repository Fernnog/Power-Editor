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
        interimDisplay: null, saveStatus: null, btnInsert: null, btnClear: null
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

        // --- AÇÃO: CLIQUE NO BOTÃO INSERIR (INTEGRAÇÃO COM IA) ---
        if (ui.btnInsert) {
            ui.btnInsert.onclick = async () => {
                const rawText = ui.textArea ? ui.textArea.value.trim() : '';
                
                if (!rawText) {
                    alert("O buffer está vazio. Fale algo antes de inserir.");
                    return;
                }

                // 1. Prepara a UI (Bloqueia botão e muda texto para feedback)
                const originalBtnText = ui.btnInsert.textContent;
                ui.btnInsert.textContent = "✨ Otimizando com IA...";
                ui.btnInsert.disabled = true;
                
                // Para o microfone para evitar conflitos de áudio
                stop(); 

                try {
                    // 2. Chama a IA para corrigir
                    // AQUI ESTAVA A MUDANÇA PRINCIPAL:
                    // Removemos a verificação do CONFIG.apiKey e chamamos direto.
                    // O GeminiService cuidará de pedir a chave se ela não existir.
                    const textToInsert = await GeminiService.correctText(rawText);

                    // 3. Insere o texto corrigido no editor principal
                    onInsertCallback(textToInsert);
                    
                    // 4. Limpa o rascunho e fecha o modal
                    clearBackup();
                    if (ui.dictationModal) ui.dictationModal.classList.remove('visible');

                } catch (error) {
                    console.error("Erro no fluxo de inserção:", error);
                    alert("Houve um erro técnico. Inserindo texto original.");
                    onInsertCallback(rawText);
                } finally {
                    // Restaura o botão para o estado original
                    ui.btnInsert.textContent = originalBtnText;
                    ui.btnInsert.disabled = false;
                }
            };
        }

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
