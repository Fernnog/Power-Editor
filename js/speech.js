const SpeechDictation = (() => {
    // Compatibilidade com diferentes navegadores
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    let recognition;
    let isListening = false;
    let shouldKeepListening = false; // Flag crucial para o "Ditado Infinito"
    const STORAGE_KEY = 'dictation_buffer_backup';

    // Referências aos elementos da interface
    let ui = {
        micIcon: null,
        langSelect: null,
        statusDisplay: null,
        dictationModal: null,
        toolbarMicButton: null,
        waveAnimation: null,
        textArea: null,
        interimDisplay: null,
        saveStatus: null,
        btnInsert: null,
        btnClear: null
    };

    // Callback executado ao clicar em "Inserir no Documento"
    let onInsertCallback = () => {};

    const isSupported = () => !!SpeechRecognition;

    /**
     * Função Ponte: Envia o texto para a IA se configurado, ou faz formatação básica.
     */
    async function processPhraseWithAI(text) {
        // Verifica se existe configuração de API Key válida
        if (typeof CONFIG !== 'undefined' && CONFIG.apiKey && CONFIG.apiKey.length > 10) {
            updateStatus('✨ Otimizando...', 'processing'); // Feedback visual de processamento
            const corrected = await GeminiService.correctText(text, CONFIG.apiKey);
            updateStatus('Ouvindo...', 'listening'); // Restaura status
            return corrected;
        } else {
            // Formatação local simples (Capitalização básica)
            if (text && text.length > 0) {
                return text.charAt(0).toUpperCase() + text.slice(1);
            }
            return text;
        }
    }

    const setupListeners = () => {
        recognition.onresult = async (event) => {
            let interimTranscript = '';
            
            // Itera sobre os resultados do reconhecimento
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    // --- CASO 1: Frase Finalizada (O usuário fez uma pausa) ---
                    
                    // Exibe feedback imediato na área provisória
                    if (ui.interimDisplay) ui.interimDisplay.textContent = "✨ Processando IA...";

                    try {
                        // 1. Envia para o Gemini corrigir
                        const finalText = await processPhraseWithAI(transcript);
                        
                        // 2. Insere no Buffer (TextArea)
                        if (ui.textArea) {
                            const currentVal = ui.textArea.value;
                            // Lógica inteligente de espaçamento: adiciona espaço se não houver no final
                            const separator = (currentVal && !/[\s\n]$/.test(currentVal)) ? ' ' : '';
                            
                            ui.textArea.value += separator + finalText;
                            
                            // Auto-scroll para o final
                            ui.textArea.scrollTop = ui.textArea.scrollHeight;
                            
                            // Persiste no LocalStorage (Segurança contra refresh)
                            saveBackup(ui.textArea.value);
                        }
                    } catch (e) {
                        console.error("Erro no fluxo de processamento:", e);
                        // Em caso de erro grave, salva o texto original
                        if (ui.textArea) ui.textArea.value += " " + transcript;
                    } finally {
                        // Limpa a área provisória
                        if (ui.interimDisplay) ui.interimDisplay.textContent = "";
                    }

                } else {
                    // --- CASO 2: Texto Provisório (O usuário ainda está falando) ---
                    interimTranscript += transcript;
                }
            }

            // Atualiza o texto provisório na tela (visualização em tempo real em cinza)
            if (ui.interimDisplay && !ui.interimDisplay.textContent.includes("✨")) {
                ui.interimDisplay.textContent = interimTranscript;
            }
        };

        // --- LÓGICA DE DITADO INFINITO (KEEP-ALIVE) ---
        recognition.onend = () => {
            if (shouldKeepListening) {
                // Se a flag estiver ativa, reinicia imediatamente
                updateStatus('Microfone reiniciando...', 'reconnecting');
                try {
                    recognition.start();
                } catch (e) {
                    console.warn("Tentativa de reinício rápido ignorada pelo navegador.");
                }
            } else {
                // Parada real solicitada pelo usuário
                isListening = false;
                toggleVisuals(false);
                updateStatus('Pausado. Clique para continuar.');
            }
        };

        recognition.onerror = (event) => {
            // Ignora erro de "sem fala" (comum em silêncio) e deixa o onend reiniciar
            if (event.error === 'no-speech') return;

            // Tratamento especial para erro de rede (comum em conexões instáveis)
            if (event.error === 'network') {
                updateStatus('Conexão instável. Reconectando...', 'error');
                setTimeout(() => {
                    if (shouldKeepListening) recognition.start();
                }, 1000); // Espera 1s antes de tentar de novo
                return;
            }

            console.error('Erro de Reconhecimento:', event.error);
            shouldKeepListening = false; // Para o loop em caso de erro fatal
            toggleVisuals(false);
            updateStatus('Erro: ' + event.error, 'error');
        };

        // Configuração dos Botões do Modal
        if (ui.btnInsert) {
            ui.btnInsert.onclick = () => {
                if (ui.textArea && ui.textArea.value.trim()) {
                    onInsertCallback(ui.textArea.value);
                    stop(); // Reseta a flag e para o reconhecimento
                    clearBackup(); // Limpa o cache
                    if (ui.dictationModal) ui.dictationModal.classList.remove('visible');
                }
            };
        }

        if (ui.btnClear) {
            ui.btnClear.onclick = () => {
                if (confirm('Limpar todo o rascunho?')) {
                    if (ui.textArea) ui.textArea.value = '';
                    clearBackup();
                }
            };
        }
    };

    // --- FUNÇÕES DE CONTROLE PÚBLICAS ---

    const init = (config) => {
        if (!isSupported()) {
            console.warn('API de Reconhecimento de Voz não suportada.');
            return;
        }

        // Mescla configuração recebida
        ui = { ...ui, ...config };
        onInsertCallback = config.onInsert;

        recognition = new SpeechRecognition();
        recognition.continuous = true;     // Tenta manter aberto o máximo possível
        recognition.interimResults = true; // Permite ver o texto enquanto fala
        recognition.lang = 'pt-BR';        // Padrão inicial

        setupListeners();
        restoreBackup();
    };

    const start = () => {
        if (isListening || !recognition) return;
        try {
            shouldKeepListening = true; // ATIVA O MODO INFINITO
            
            // Atualiza idioma se houver seletor
            if (ui.langSelect) recognition.lang = ui.langSelect.value;
            
            recognition.start();
            isListening = true;
            
            toggleVisuals(true);
            updateStatus('Ouvindo...');
            
            if (ui.dictationModal) ui.dictationModal.classList.add('visible');
            if (ui.textArea) ui.textArea.focus();

        } catch (error) {
            console.error("Erro ao iniciar:", error);
            updateStatus('Erro ao iniciar microfone.');
        }
    };

    const stop = () => {
        if (!recognition) return;
        shouldKeepListening = false; // DESATIVA O MODO INFINITO
        recognition.stop();
        // A limpeza visual ocorrerá no evento onend
    };

    // --- MÉTODOS AUXILIARES ---

    const updateStatus = (text, type = '') => {
        if (ui.statusDisplay) {
            ui.statusDisplay.textContent = text;
            // Mantém a classe base e adiciona o modificador (ex: error, reconnecting)
            ui.statusDisplay.className = 'status-indicator ' + type;
        }
    };

    const toggleVisuals = (active) => {
        if (ui.micIcon) ui.micIcon.classList.toggle('listening', active);
        if (ui.toolbarMicButton) ui.toolbarMicButton.classList.toggle('listening', active);
        
        if (ui.waveAnimation) {
            if (active) ui.waveAnimation.classList.add('active');
            else ui.waveAnimation.classList.remove('active');
        }
    };

    function saveBackup(text) {
        localStorage.setItem(STORAGE_KEY, text);
        if (ui.saveStatus) {
            ui.saveStatus.classList.add('visible');
            setTimeout(() => {
                if (ui.saveStatus) ui.saveStatus.classList.remove('visible');
            }, 1500);
        }
    }

    function restoreBackup() {
        const backup = localStorage.getItem(STORAGE_KEY);
        if (backup && ui.textArea) {
            ui.textArea.value = backup;
        }
    }

    function clearBackup() {
        localStorage.removeItem(STORAGE_KEY);
        if (ui.textArea) ui.textArea.value = '';
    }

    return {
        init,
        start,
        stop,
        isSupported
    };
})();
