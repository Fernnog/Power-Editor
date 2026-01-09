// js/speech.js

/**
 * Classe responsável pelo Processamento de Sinal Digital (DSP) e Visualização
 * Baseada em Web Audio API e Canvas API.
 * ATUALIZAÇÃO 1.2: Adicionado threshold visual.
 */
class AudioVisualizer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.animationId = null;
        this.isActive = false;
        
        // Ajuste inicial de resolução (DPI)
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        // Verifica se o canvas existe e tem dimensões no DOM
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                this.canvas.width = rect.width * dpr;
                this.canvas.height = rect.height * dpr;
                this.ctx.scale(dpr, dpr);
            }
        }
    }

    async start(stream) {
        if (this.isActive) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(stream);
            
            // --- CADEIA DSP (Tratamento de Áudio) ---
            
            // 1. Filtro Passa-Alta (Remove ruídos graves/hum elétrico abaixo de 85Hz)
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 85;

            // 2. Compressor (Nivela o volume da voz para visualização consistente)
            const compressor = this.audioContext.createDynamicsCompressor();
            compressor.threshold.value = -50;
            compressor.knee.value = 40;
            compressor.ratio.value = 12;

            // 3. Analisador (FFT para visualização)
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256; // Resolução das barras
            this.analyser.smoothingTimeConstant = 0.5; // Suavização do movimento

            // Conexões: Fonte -> Filtro -> Compressor -> Analisador
            source.connect(filter);
            filter.connect(compressor);
            compressor.connect(this.analyser);
            // Nota: Não conectamos ao destination (alto-falantes) para evitar eco.

            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.isActive = true;
            this.draw();
            
        } catch (e) {
            console.error("Erro ao iniciar AudioVisualizer:", e);
        }
    }

    draw() {
        if (!this.isActive) return;
        this.animationId = requestAnimationFrame(() => this.draw());

        // Pega dados de frequência
        this.analyser.getByteFrequencyData(this.dataArray);
        
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        this.ctx.clearRect(0, 0, width, height);

        // --- NOVO: Desenha Linha de Limiar (Threshold) ---
        // Feedback visual para o usuário saber o volume mínimo ideal
        const thresholdY = height * 0.3; // Linha a 30% do topo
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        this.ctx.setLineDash([5, 5]); // Linha pontilhada
        this.ctx.moveTo(0, thresholdY);
        this.ctx.lineTo(width, thresholdY);
        this.ctx.stroke();

        // Configuração das barras
        // Cortamos as frequências muito altas (acima do índice 80) onde a voz humana tem pouca energia
        const bufferLength = Math.floor(this.dataArray.length * 0.7); 
        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const value = this.dataArray[i];
            const percent = value / 255;
            
            // Altura da barra
            const barHeight = height * percent * 0.9; 
            
            // --- Lógica de Cor do Tema Power Editor ---
            // Base: #ce2a66 (Hue ~338). Variação para Roxo/Fúcsia conforme intensidade.
            const hue = 330 + (percent * 30); // Varia entre 330 (Rosa) e 360 (Vermelho/Fúcsia)
            const lightness = 50 + (percent * 10);
            
            this.ctx.fillStyle = `hsl(${hue}, 80%, ${lightness}%)`;

            // Desenha a barra
            if (barHeight > 1) {
                // Centralizada verticalmente
                const y = (height - barHeight) / 2;
                
                // Arredondamento simples
                this.ctx.beginPath();
                this.ctx.roundRect(x, y, barWidth - 1, barHeight, [3]);
                this.ctx.fill();
            }
            x += barWidth;
        }
    }

    stop() {
        this.isActive = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        // Limpa o canvas
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        this.ctx.clearRect(0, 0, width, height);
    }
}

/**
 * Módulo Principal de Ditado
 * ATUALIZAÇÃO 1.2: Integração de Hardware (Seleção de Mic) e Controle de Pausa.
 */
const SpeechDictation = (() => {
    // Verifica compatibilidade
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    
    // ESTADOS
    let isListening = false; // Estado técnico (se o motor está ativo)
    let isUserPaused = false; // Estado de intenção do usuário (se clicou para pausar)
    
    // Variáveis para o Visualizador e Stream de Hardware
    let visualizerInstance = null;
    let audioStream = null;
    let screenLock = null; // Wake Lock
    
    // Configuração de Hardware
    let selectedDeviceId = 'default';
    const STORAGE_KEY = 'dictation_buffer_backup'; 

    // Mapeamento UI
    let ui = {
        micIcon: null, langSelect: null, statusDisplay: null, dictationModal: null,
        toolbarMicButton: null, 
        canvas: null,
        textArea: null,
        interimDisplay: null, saveStatus: null, btnClear: null,
        btnInsertRaw: null, btnInsertFix: null, btnInsertLegal: null,
        // NOVO
        micSelect: null 
    };

    let onInsertCallback = () => {};
    const isSupported = () => !!SpeechRecognition;

    /**
     * LÓGICA DE HARDWARE (TRIGGER RELÂMPAGO)
     * Força o navegador a listar os nomes dos microfones pedindo permissão rápida.
     */
    const getAudioDevices = async () => {
        try {
            // 1. Tenta listar
            let devices = await navigator.mediaDevices.enumerateDevices();
            let audioDevices = devices.filter(d => d.kind === 'audioinput');

            // 2. Verifica se os labels estão ocultos (Privacidade do Browser)
            const hasLabels = audioDevices.some(d => d.label !== "");
            
            if (!hasLabels) {
                try {
                    // 3. Trigger: Abre stream por 1ms para forçar permissão e revelar nomes
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach(track => track.stop());
                    
                    // 4. Lista novamente com permissão
                    devices = await navigator.mediaDevices.enumerateDevices();
                    audioDevices = devices.filter(d => d.kind === 'audioinput');
                } catch (permErr) {
                    console.warn("Permissão para listar nomes negada.", permErr);
                }
            }
            return audioDevices;
        } catch (err) {
            console.error("Erro ao listar dispositivos:", err);
            return [];
        }
    };

    const populateDeviceList = async () => {
        if (!ui.micSelect) return;
        
        ui.micSelect.innerHTML = '<option value="loading">Carregando dispositivos...</option>';
        const devices = await getAudioDevices();
        
        ui.micSelect.innerHTML = ''; // Limpa
        
        // Opção Padrão
        const defaultOpt = document.createElement('option');
        defaultOpt.value = 'default';
        defaultOpt.text = 'Padrão do Sistema';
        ui.micSelect.appendChild(defaultOpt);

        // Preenche lista real
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Microfone ${ui.micSelect.length}`;
            ui.micSelect.appendChild(option);
        });

        // Restaura seleção anterior se houver
        if (selectedDeviceId) {
            ui.micSelect.value = selectedDeviceId;
        }

        // Listener: Se mudar o mic enquanto grava, reinicia
        ui.micSelect.onchange = () => {
            selectedDeviceId = ui.micSelect.value;
            if (isListening) {
                // Reinicia suavemente para aplicar o novo hardware
                stopInternal().then(() => startInternal());
            }
        };
    };

    /**
     * Gerenciamento de Energia (Wake Lock)
     */
    const toggleWakeLock = async (active) => {
        if ('wakeLock' in navigator) {
            try {
                if (active && !screenLock) {
                    screenLock = await navigator.wakeLock.request('screen');
                } else if (!active && screenLock) {
                    await screenLock.release();
                    screenLock = null;
                }
            } catch (err) {
                console.warn('Wake Lock API erro:', err);
            }
        }
    };

    /**
     * Configuração de Eventos do Reconhecimento
     */
    const setupListeners = () => {
        // --- EVENTO 1: RECONHECIMENTO (TEXTO) ---
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscriptChunk = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscriptChunk += transcript; 
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscriptChunk && ui.textArea) {
                const currentVal = ui.textArea.value;
                const separator = (currentVal && !/[\s\n]$/.test(currentVal)) ? ' ' : '';
                const formattedChunk = finalTranscriptChunk.charAt(0).toUpperCase() + finalTranscriptChunk.slice(1);
                
                ui.textArea.value += separator + formattedChunk;
                ui.textArea.scrollTop = ui.textArea.scrollHeight;
                saveBackup(ui.textArea.value);
            }

            if (ui.interimDisplay) {
                ui.interimDisplay.textContent = interimTranscript;
            }
        };

        // --- EVENTO 2: FIM DO CICLO / RECONEXÃO ---
        recognition.onend = () => {
            // Se o usuário NÃO pausou explicitamente, tentamos reconectar (loop contínuo)
            if (!isUserPaused && isListening) {
                updateStatus('Reiniciando serviço...', 'reconnecting');
                try { recognition.start(); } catch (e) {}
            } else {
                // Se o usuário pausou ou fechou
                updateStatus('Pausado.');
                setVisualState(false);
            }
        };

        // --- EVENTO 3: ERROS ---
        recognition.onerror = (event) => {
            if (event.error === 'no-speech') return;
            
            if (event.error === 'network') {
                updateStatus('Erro de rede. Reconectando...', 'error');
                setTimeout(() => { if (!isUserPaused) recognition.start(); }, 1000);
                return;
            }
            
            if (event.error === 'not-allowed') {
                updateStatus('Acesso ao microfone negado.', 'error');
                stopInternal();
                setVisualState(false);
                return;
            }
            
            // Outros erros
            updateStatus('Erro: ' + event.error, 'error');
        };

        // --- LÓGICA DE INSERÇÃO ---
        const handleInsert = async (mode) => {
            const rawText = ui.textArea ? ui.textArea.value.trim() : '';
            if (!rawText) {
                alert("O buffer está vazio. Fale algo antes de inserir.");
                return;
            }

            // PAUSA O DITADO AO INSERIR
            isUserPaused = true;
            await stopInternal(); 
            setVisualState(false);

            const footerGroup = document.querySelector('.footer-buttons-group');
            if (footerGroup) footerGroup.classList.add('disabled-all');

            const originalText = rawText;
            
            try {
                let textToInsert = rawText;

                if (mode !== 'raw') {
                    if (ui.textArea) {
                        ui.textArea.classList.add('processing-state');
                        ui.textArea.setAttribute('data-original-text', originalText);
                        const msg = mode === 'legal' 
                            ? "⚖️ O Assistente Jurídico está refinando seu texto. Aguarde..." 
                            : "✨ A IA está corrigindo a gramática. Aguarde...";
                        ui.textArea.value = msg;
                    }

                    if (mode === 'fix') {
                        textToInsert = await GeminiService.correctText(originalText);
                    } else if (mode === 'legal') {
                        textToInsert = await GeminiService.refineLegalText(originalText);
                    }
                }

                onInsertCallback(textToInsert);
                clearBackup();
                if (ui.dictationModal) ui.dictationModal.classList.remove('visible');

            } catch (error) {
                console.error("Erro no fluxo de inserção:", error);
                alert("Houve um erro técnico. Inserindo texto original.");
                onInsertCallback(originalText);
                if (ui.dictationModal) ui.dictationModal.classList.remove('visible');
            } finally {
                if (footerGroup) footerGroup.classList.remove('disabled-all');
                if (ui.textArea) {
                    ui.textArea.classList.remove('processing-state');
                    const savedOriginal = ui.textArea.getAttribute('data-original-text');
                    if (savedOriginal && ui.textArea.value !== savedOriginal) {
                        ui.textArea.value = savedOriginal;
                    }
                }
            }
        };

        if (ui.btnInsertRaw) ui.btnInsertRaw.onclick = () => handleInsert('raw');
        if (ui.btnInsertFix) ui.btnInsertFix.onclick = () => handleInsert('fix');
        if (ui.btnInsertLegal) ui.btnInsertLegal.onclick = () => handleInsert('legal');

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

    /**
     * Alterna entre Gravar e Pausar (Função pública para o botão)
     */
    const toggleDictation = async () => {
        if (isListening) {
            // AÇÃO: PAUSAR
            isUserPaused = true;
            await stopInternal();
            updateStatus('Pausado. Clique para continuar.');
            setVisualState(false);
        } else {
            // AÇÃO: GRAVAR
            isUserPaused = false;
            await startInternal();
        }
    };

    const init = (config) => {
        if (!isSupported()) {
            console.error("Web Speech API não suportada.");
            return;
        }

        // Mapeia configurações e captura elementos
        ui = { ...ui, ...config };
        
        // NOVO: Mapeia o Select de Microfone
        ui.micSelect = document.getElementById('dictation-mic-select');
        
        // Elemento Canvas
        ui.canvas = document.getElementById('audio-visualizer');
        if (ui.canvas) {
            visualizerInstance = new AudioVisualizer(ui.canvas);
        }

        onInsertCallback = config.onInsert;
        
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';
        
        setupListeners();
        restoreBackup();

        // Vínculo do Clique no Ícone Grande (PAUSAR/GRAVAR)
        if (ui.micIcon) {
            ui.micIcon.onclick = toggleDictation;
            // Remove comportamento antigo de apenas decorativo
            ui.micIcon.style.cursor = 'pointer'; 
        }
    };

    /**
     * Start Interno (Lógica técnica de iniciar streams)
     */
    const startInternal = async () => {
        if (isListening) return;
        
        try {
            // 1. Definição de Constraints com SELEÇÃO DE HARDWARE
            const constraints = { 
                audio: { 
                    // Se o usuário selecionou um mic específico, usa 'exact', senão undefined
                    deviceId: selectedDeviceId !== 'default' ? { exact: selectedDeviceId } : undefined,
                    echoCancellation: true, 
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: { ideal: 1 },
                    sampleRate: { ideal: 48000 }
                } 
            };

            // 2. Captura do Stream (com fallback automático se o mic específico falhar)
            try {
                audioStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (deviceErr) {
                console.warn("Microfone específico falhou. Tentando padrão.", deviceErr);
                audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            // 3. Ativa o Wake Lock (Modo Foco)
            await toggleWakeLock(true);

            // 4. Inicia Visualização DSP
            if (visualizerInstance) {
                await visualizerInstance.start(audioStream);
                if (ui.canvas) ui.canvas.classList.add('active'); 
            }

            // 5. Configura e Inicia Reconhecimento
            if (ui.langSelect) recognition.lang = ui.langSelect.value;
            
            try {
                recognition.start();
            } catch (recError) {
                if (recError.name !== 'InvalidStateError') throw recError;
            }

            // Atualiza Estado UI
            isListening = true;
            setVisualState(true);
            updateStatus('Ouvindo...');
            if (ui.textArea) ui.textArea.focus();

        } catch (err) {
            console.error("Erro crítico ao iniciar áudio:", err);
            updateStatus("Erro: Microfone inacessível.", "error");
            await stopInternal(); 
        }
    };

    /**
     * Stop Interno (Limpeza de recursos)
     */
    const stopInternal = async () => {
        isListening = false; // Importante: flag técnica

        // 1. Para o reconhecimento de texto
        if (recognition) {
            try { recognition.stop(); } catch(e) {}
        }

        // 2. Para o visualizador e fecha AudioContext
        if (visualizerInstance) {
            visualizerInstance.stop();
        }

        // 3. Libera a luz do microfone (Hardware)
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }

        // 4. Libera Wake Lock
        await toggleWakeLock(false);

        // Atualiza UI
        if (ui.canvas) ui.canvas.classList.remove('active');
    };

    // Atualiza classes CSS para feedback visual (Ícone Vermelho vs Cinza)
    const setVisualState = (isActive) => {
        if (ui.micIcon) {
            if (isActive) {
                ui.micIcon.classList.add('listening');
                ui.micIcon.classList.remove('paused');
            } else {
                ui.micIcon.classList.remove('listening');
                ui.micIcon.classList.add('paused');
            }
        }
        if (ui.toolbarMicButton) ui.toolbarMicButton.classList.toggle('listening', isActive);
    };

    const updateStatus = (text, type = '') => {
        if (ui.statusDisplay) {
            ui.statusDisplay.textContent = text;
            ui.statusDisplay.className = 'status-indicator ' + type;
        }
    };

    // --- Persistência (Cofre de Voz) ---
    function saveBackup(text) { localStorage.setItem(STORAGE_KEY, text); if (ui.saveStatus) ui.saveStatus.classList.add('visible'); setTimeout(() => { if (ui.saveStatus) ui.saveStatus.classList.remove('visible'); }, 2000); }
    function restoreBackup() { const b = localStorage.getItem(STORAGE_KEY); if (b && ui.textArea) ui.textArea.value = b; }
    function clearBackup() { localStorage.removeItem(STORAGE_KEY); if (ui.textArea) ui.textArea.value = ''; }

    /**
     * MÉTODO START PÚBLICO (Iniciado pelo Botão da Toolbar)
     */
    const start = async () => {
        // 1. Popula a lista de microfones (Trigger de Permissão)
        await populateDeviceList();

        // 2. Abre o Modal
        if (ui.dictationModal) ui.dictationModal.classList.add('visible');

        // 3. Inicia Gravação
        isUserPaused = false;
        await startInternal();
    };

    /**
     * MÉTODO STOP PÚBLICO (Fechar modal)
     */
    const stop = async () => {
        isUserPaused = true;
        await stopInternal();
        setVisualState(false);
        updateStatus('Pausado.');
    };

    return { init, start, stop, isSupported };
})();
