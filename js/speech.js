// js/speech.js

const SpeechDictation = (() => {
    // Verifica compatibilidade com a API de reconhecimento de voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    
    // Estado interno
    let isListening = false;
    let shouldKeepListening = false; // Flag crucial para o "Ditado Infinito"
    const STORAGE_KEY = 'dictation_buffer_backup';

    // Elementos da UI Mapeados
    let ui = {
        // Elementos básicos e de controle
        micIcon: null,
        langSelect: null,
        statusDisplay: null,
        dictationModal: null,
        toolbarMicButton: null,
        
        // Elementos da Interface Avançada (Buffer e Onda Sonora)
        waveAnimation: null, // Referência para a div .sound-wave
        textArea: null,      // O buffer principal de texto
        interimDisplay: null,// Div para texto provisório (enquanto fala)
        saveStatus: null,    // Feedback de salvamento automático
        btnInsert: null,     // Botão Inserir no editor
        btnClear: null       // Botão Limpar rascunho
    };

    // Callback para inserir o texto no editor principal (TinyMCE)
    let onInsertCallback = () => {};

    const isSupported = () => !!SpeechRecognition;

    /**
     * LÓGICA DE FORMATAÇÃO AVANÇADA
     * Processa o texto recebido aplicando pontuação, capitalização inteligente
     * baseada no contexto anterior e espaçamento correto.
     * 
     * @param {string} text - O novo trecho de texto ditado.
     * @param {string} currentBuffer - O texto que já existe na caixa (contexto).
     */
    function advancedFormatText(text, currentBuffer) {
        let formatted = text;

        // 1. Mapa de Pontuação Expandido (Comandos de Voz)
        const punctuationMap = {
            " vírgula": ",", " virgula": ",",
            " ponto final": ".", " ponto": ".",
            " ponto de interrogação": "?", " interrogação": "?",
            " ponto de exclamação": "!", " exclamação": "!",
            " dois pontos": ":", " dois-pontos": ":",
            " ponto e vírgula": ";", " ponto-e-vírgula": ";",
            " nova linha": "\n", " novo parágrafo": "\n\n", " parágrafo": "\n\n",
            " reticências": "...", " três pontos": "..."
        };

        // Aplica a substituição de pontuação (case insensitive)
        Object.keys(punctuationMap).forEach(key => {
            // Regex procura a palavra inteira para evitar substituições parciais incorretas
            const regex = new RegExp(key, 'gi');
            formatted = formatted.replace(regex, punctuationMap[key]);
        });

        // 2. Capitalização Inteligente (Início de Frase)
        // Analisa o final do buffer atual para decidir se a nova frase deve começar maiúscula.
        const bufferTrimmed = currentBuffer.trim();
        const lastChar = bufferTrimmed.slice(-1);
        
        // Critérios para capitalizar: Buffer vazio, ou termina em pontuação finalizadora ou quebra de linha
        const needsCap = !bufferTrimmed || ['.', '!', '?', '\n'].includes(lastChar);

        if (needsCap && formatted.length > 0) {
            // Remove espaços iniciais que possam ter vindo da API antes de capitalizar
            const tempText = formatted.trimStart();
            if (tempText.length > 0) {
                formatted = tempText.charAt(0).toUpperCase() + tempText.slice(1);
                // Se havia espaço antes (ex: após um ponto), reinserimos um espaço apenas se não for quebra de linha
                if (formatted !== text && !text.startsWith('\n')) {
                     formatted = ' ' + formatted;
                }
            }
        }

        // 3. Limpeza de Espaçamento
        // Remove espaços antes de pontuação (ex: "palavra ." -> "palavra.")
        formatted = formatted.replace(/\s+([.,!?:;])/g, '$1');
        
        // Garante espaço após pontuação se já não houver (exceto quebras de linha)
        // Nota: O navegador geralmente já envia um espaço no início do transcript, 
        // mas isso reforça a consistência.
        
        return formatted;
    }

    // --- GERENCIAMENTO DE STORAGE (COFRE DE VOZ) ---
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
        if (ui.textArea) {
            ui.textArea.value = '';
        }
    }

    // --- CONTROLE VISUAL ---
    function toggleVisuals(active) {
        if (ui.micIcon) ui.micIcon.classList.toggle('listening', active);
        if (ui.toolbarMicButton) ui.toolbarMicButton.classList.toggle('listening', active);
        
        if (ui.waveAnimation) {
            if (active) {
                ui.waveAnimation.classList.add('active');
            } else {
                ui.waveAnimation.classList.remove('active');
            }
        }
    }

    function updateStatus(text, type = '') {
        if (ui.statusDisplay) {
            ui.statusDisplay.textContent = text;
            // Remove classes antigas e adiciona a nova (se houver)
            ui.statusDisplay.className = 'status-indicator ' + type;
        }
    }

    // --- CONFIGURAÇÃO DOS LISTENERS DA API ---
    const setupListeners = () => {
        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    // Passa o contexto atual do textarea para a formatação inteligente
                    const currentContext = ui.textArea ? ui.textArea.value : '';
                    finalTranscript += advancedFormatText(transcript, currentContext);
                } else {
                    interimTranscript += transcript;
                }
            }

            // Atualiza o Buffer Principal
            if (finalTranscript && ui.textArea) {
                const currentText = ui.textArea.value;
                
                // Verifica se precisa adicionar um espaço separador (se não for início ou quebra de linha)
                const separator = (currentText && !/[\s\n]$/.test(currentText)) ? ' ' : '';
                
                ui.textArea.value += separator + finalTranscript;
                ui.textArea.scrollTop = ui.textArea.scrollHeight; // Auto-scroll
                
                saveBackup(ui.textArea.value);
            }

            // Atualiza o Display Provisório
            if (ui.interimDisplay) {
                ui.interimDisplay.textContent = interimTranscript;
            }
        };

        // --- LÓGICA DE KEEP-ALIVE (INFINITO) ---
        recognition.onend = () => {
            if (shouldKeepListening) {
                // O usuário NÃO pediu para parar, então foi o navegador que cortou.
                // Reiniciamos imediatamente.
                updateStatus('Reconectando...', 'reconnecting');
                
                // Pequena pausa técnica para evitar loops muito rápidos se houver erro
                setTimeout(() => {
                    if (shouldKeepListening) {
                        try {
                            recognition.start();
                            updateStatus('Ouvindo...', 'listening');
                        } catch (e) {
                            console.warn("Tentativa de reinício falhou, tentando novamente em breve...", e);
                        }
                    }
                }, 100); 
            } else {
                // Parada legítima solicitada pelo usuário
                isListening = false;
                toggleVisuals(false);
                if (ui.interimDisplay) ui.interimDisplay.textContent = '';
                updateStatus('Pausado.', 'idle');
            }
        };

        recognition.onerror = (event) => {
            console.error('Erro Speech API:', event.error);
            
            if (event.error === 'no-speech') {
                // Silêncio detectado: Ignora e deixa o onend reiniciar
                return; 
            }
            
            if (event.error === 'network') {
                updateStatus('Erro de conexão. Tentando reconectar...', 'error');
                // Tenta reiniciar após 1 segundo em caso de falha de rede
                setTimeout(() => {
                    if (shouldKeepListening) {
                        try {
                            recognition.start();
                        } catch(e) { /* ignora erro de start se já estiver rodando */ }
                    }
                }, 1500);
                return;
            }

            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                // Erros fatais de permissão: Devemos parar o loop infinito
                shouldKeepListening = false;
                toggleVisuals(false);
                updateStatus('Acesso ao microfone negado.', 'error');
                return;
            }

            // Para outros erros desconhecidos, apenas logamos e tentamos continuar se possível
            // O onend cuidará do reinício
            updateStatus('Erro momentâneo: ' + event.error, 'error');
        };

        // Listeners dos Botões da Interface
        if (ui.btnInsert) {
            ui.btnInsert.onclick = () => {
                if (ui.textArea && ui.textArea.value.trim()) {
                    onInsertCallback(ui.textArea.value);
                    clearBackup();
                    stop(); // Encerra o ditado e fecha
                    if (ui.dictationModal) ui.dictationModal.classList.remove('visible');
                } else {
                    alert("O rascunho está vazio. Dite algo primeiro.");
                }
            };
        }

        if (ui.btnClear) {
            ui.btnClear.onclick = () => {
                if (ui.textArea.value.length > 0) {
                    if (confirm('Tem certeza que deseja limpar todo o rascunho?')) {
                        clearBackup();
                        ui.textArea.focus();
                    }
                }
            };
        }
    };

    // --- MÉTODOS PÚBLICOS ---

    const init = (config) => {
        if (!isSupported()) {
            console.warn('API de Reconhecimento de Voz não suportada neste navegador.');
            return;
        }
        
        // Mescla config recebida com estado da UI
        ui = { ...ui, ...config };
        onInsertCallback = config.onInsert || (() => {});

        recognition = new SpeechRecognition();
        recognition.continuous = true;     // Permite ditar frases longas
        recognition.interimResults = true; // Permite ver o que está sendo falado em tempo real

        setupListeners();
        restoreBackup(); // Tenta recuperar texto anterior ao carregar
    };

    const start = () => {
        if (isListening || !recognition) return;
        try {
            shouldKeepListening = true; // ATIVA O MODO INFINITO
            
            recognition.lang = ui.langSelect ? ui.langSelect.value : 'pt-BR';
            recognition.start();
            
            isListening = true;
            toggleVisuals(true);
            updateStatus('Ouvindo...', 'listening');
            
            if (ui.dictationModal) ui.dictationModal.classList.add('visible');
            if (ui.textArea) ui.textArea.focus();
            
        } catch (error) {
            console.error("Erro ao iniciar:", error);
            updateStatus('Não foi possível iniciar.', 'error');
            shouldKeepListening = false;
        }
    };

    const stop = () => {
        if (!recognition) return;
        
        shouldKeepListening = false; // DESATIVA O MODO INFINITO
        
        try {
            recognition.stop();
        } catch(e) {
            console.warn("Erro ao tentar parar reconhecimento:", e);
        }
        // A limpeza visual final ocorre em onend
    };

    return {
        init,
        start,
        stop,
        isSupported
    };

})();
