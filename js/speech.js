const SpeechDictation = (() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;
    let shouldKeepListening = false;
    const STORAGE_KEY = 'dictation_buffer_backup';

    let ui = {
        micIcon: null, langSelect: null, statusDisplay: null, dictationModal: null,
        toolbarMicButton: null, waveAnimation: null, textArea: null,
        interimDisplay: null, saveStatus: null, btnInsert: null, btnClear: null
    };

    let onInsertCallback = () => {};
    const isSupported = () => !!SpeechRecognition;

    const setupListeners = () => {
        // --- EVENTO: ENQUANTO VOCÊ FALA ---
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscriptChunk = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    // Apenas acumula o texto cru, SEM chamar a IA aqui
                    finalTranscriptChunk += transcript; 
                } else {
                    interimTranscript += transcript;
                }
            }

            // Atualiza o Buffer na tela (Texto Cru)
            if (finalTranscriptChunk && ui.textArea) {
                const currentVal = ui.textArea.value;
                const separator = (currentVal && !/[\s\n]$/.test(currentVal)) ? ' ' : '';
                
                // Formatação local mínima apenas para visualização (Maiúscula inicial básica)
                const formattedChunk = finalTranscriptChunk.charAt(0).toUpperCase() + finalTranscriptChunk.slice(1);
                
                ui.textArea.value += separator + formattedChunk;
                ui.textArea.scrollTop = ui.textArea.scrollHeight;
                saveBackup(ui.textArea.value);
            }

            // Texto cinza provisório
            if (ui.interimDisplay) {
                ui.interimDisplay.textContent = interimTranscript;
            }
        };

        // --- EVENTO: RECONEXÃO AUTOMÁTICA ---
        recognition.onend = () => {
            if (shouldKeepListening) {
                updateStatus('Microfone reiniciando...', 'reconnecting');
                try { recognition.start(); } catch (e) {}
            } else {
                isListening = false;
                toggleVisuals(false);
                updateStatus('Pausado. Clique para continuar.');
            }
        };

        recognition.onerror = (event) => {
            if (event.error === 'no-speech') return;
            if (event.error === 'network') {
                updateStatus('Reconectando...', 'error');
                setTimeout(() => { if (shouldKeepListening) recognition.start(); }, 1000);
                return;
            }
            shouldKeepListening = false;
            toggleVisuals(false);
            updateStatus('Erro: ' + event.error, 'error');
        };

        // --- AÇÃO: CLIQUE NO BOTÃO INSERIR (AQUI A IA ENTRA) ---
        if (ui.btnInsert) {
            ui.btnInsert.onclick = async () => {
                const rawText = ui.textArea ? ui.textArea.value.trim() : '';
                
                if (!rawText) return;

                // 1. Prepara a UI (Bloqueia botão e muda texto)
                const originalBtnText = ui.btnInsert.textContent;
                ui.btnInsert.textContent = "✨ Otimizando com IA...";
                ui.btnInsert.disabled = true;
                
                // Para o microfone para evitar conflitos
                stop(); 

                try {
                    let textToInsert = rawText;

                    // 2. Chama a IA para corrigir TUDO de uma vez
                    if (typeof CONFIG !== 'undefined' && CONFIG.apiKey) {
                        console.log("Enviando para Gemini...");
                        textToInsert = await GeminiService.correctText(rawText, CONFIG.apiKey);
                    }

                    // 3. Insere o texto corrigido no editor
                    onInsertCallback(textToInsert);
                    
                    // 4. Limpa tudo e fecha
                    clearBackup();
                    if (ui.dictationModal) ui.dictationModal.classList.remove('visible');

                } catch (error) {
                    console.error("Erro no processamento:", error);
                    alert("Houve um erro na correção. Inserindo texto original.");
                    onInsertCallback(rawText);
                } finally {
                    // Restaura o botão
                    ui.btnInsert.textContent = originalBtnText;
                    ui.btnInsert.disabled = false;
                }
            };
        }

        if (ui.btnClear) {
            ui.btnClear.onclick = () => {
                if (confirm('Limpar rascunho?')) {
                    if (ui.textArea) ui.textArea.value = '';
                    clearBackup();
                }
            };
        }
    };

    const init = (config) => {
        if (!isSupported()) return;
        ui = { ...ui, ...config };
        onInsertCallback = config.onInsert;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';
        setupListeners();
        restoreBackup();
    };

    const start = () => {
        if (isListening) return;
        shouldKeepListening = true;
        if (ui.langSelect) recognition.lang = ui.langSelect.value;
        recognition.start();
        isListening = true;
        toggleVisuals(true);
        updateStatus('Ouvindo...');
        if (ui.dictationModal) ui.dictationModal.classList.add('visible');
        if (ui.textArea) ui.textArea.focus();
    };

    const stop = () => {
        shouldKeepListening = false;
        if (recognition) recognition.stop();
    };

    const updateStatus = (text, type = '') => {
        if (ui.statusDisplay) {
            ui.statusDisplay.textContent = text;
            ui.statusDisplay.className = 'status-indicator ' + type;
        }
    };

    const toggleVisuals = (active) => {
        if (ui.micIcon) ui.micIcon.classList.toggle('listening', active);
        if (ui.toolbarMicButton) ui.toolbarMicButton.classList.toggle('listening', active);
        if (ui.waveAnimation) active ? ui.waveAnimation.classList.add('active') : ui.waveAnimation.classList.remove('active');
    };

    function saveBackup(text) { localStorage.setItem(STORAGE_KEY, text); }
    function restoreBackup() { const b = localStorage.getItem(STORAGE_KEY); if (b && ui.textArea) ui.textArea.value = b; }
    function clearBackup() { localStorage.removeItem(STORAGE_KEY); if (ui.textArea) ui.textArea.value = ''; }

    return { init, start, stop, isSupported };
})();
