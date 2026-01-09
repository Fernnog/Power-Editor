// js/speech.js

/**
 * Classe responsável pelo Processamento de Sinal Digital (DSP) e Visualização
 * Baseada em Web Audio API e Canvas API.
 * ATUALIZADO: Inclui linha de limiar (Threshold) e feedback visual de detecção.
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

        // --- 1. Desenha Linha de Limiar (Threshold) ---
        // Indica o volume mínimo recomendado para boa captura
        const centerY = height / 2;
        // Ajustamos uma posição visual para a linha de corte
        const thresholdY = height * 0.4; 

        this.ctx.beginPath();
        this.ctx.setLineDash([4, 4]); 
        this.ctx.strokeStyle = 'rgba(206, 42, 102, 0.3)'; // Cor primária suave
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(0, thresholdY);
        this.ctx.lineTo(width, thresholdY);
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reseta dash

        // --- 2. Desenha Barras de Frequência ---
        const bufferLength = Math.floor(this.dataArray.length * 0.7); 
        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;
        let maxAmplitude = 0;

        for (let i = 0; i < bufferLength; i++) {
            const value = this.dataArray[i];
            const percent = value / 255;
            
            if (value > maxAmplitude) maxAmplitude = value;

            // Altura da barra
            const barHeight = height * percent * 0.9; 
            
            // Lógica de Cor do Tema
            const hue = 330 + (percent * 30); // Varia entre 330 (Rosa) e 360 (Vermelho/Fúcsia)
            const lightness = 50 + (percent * 10);
            
            this.ctx.fillStyle = `hsl(${hue}, 80%, ${lightness}%)`;

            if (barHeight > 1) {
                const y = height - barHeight; // Barras vêm de baixo para cima agora
                this.ctx.beginPath();
                this.ctx.roundRect(x, y, barWidth - 1, barHeight, [3]);
                this.ctx.fill();
            }
            x += barWidth;
        }

        // --- 3. Feedback Visual de Detecção de Áudio (Glow Effect) ---
        const dictationContent = document.querySelector('.dictation-content');
        // Se a amplitude máxima passar de um certo ponto (~10% do volume), ativa o glow
        if (dictationContent) {
            if (maxAmplitude > 25) { // 25/255 ~= 10%
                dictationContent.classList.add('audio-detected');
            } else {
                dictationContent.classList.remove('audio-detected');
            }
        }
    }

    stop() {
        this.isActive = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        const dictationContent = document.querySelector('.dictation-content');
        if (dictationContent) dictationContent.classList.remove('audio-detected');

        // Limpa o canvas
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        this.ctx.clearRect(0, 0, width, height);
    }
}

/**
 * Módulo Principal de Ditado
 * ATUALIZADO: Gerenciamento de dispositivos, Undo Inteligente, Lógica de Stop/Start explícita.
 */
const SpeechDictation = (() => {
    // Verifica compatibilidade
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;
    let shouldKeepListening = false; 
    const STORAGE_KEY = 'dictation_buffer_backup'; 
    let selectedDeviceId = 'default';

    // Variáveis para o Visualizador e Stream de Hardware
    let visualizerInstance = null;
    let audioStream = null;
    
    // Variável para controle do Wake Lock (Modo Foco)
    let screenLock = null;

    // Undo Timer
    let undoTimer = null;

    // Mapeamento UI
    let ui = {
        micIcon: null, micSelect: null, langSelect: null, statusDisplay: null, dictationModal: null,
        toolbarMicButton: null, 
        canvas: null,
        textArea: null,
        interimDisplay: null, saveStatus: null, btnClear: null,
        btnInsertRaw: null, btnInsertFix: null, btnInsertLegal: null
    };

    let onInsertCallback = () => {};
    const isSupported = () => !!SpeechRecognition;

    /**
     * Função Auxiliar: Gerenciamento de Energia
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
                console.warn('Wake Lock API não disponível ou bloqueada pelo sistema:', err);
            }
        }
    };

    /**
     * Função Auxiliar: Lista Dispositivos de Áudio com Permissão
     */
    const loadAudioDevices = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;

        try {
            // 1. Tenta listar
            let devices = await navigator.mediaDevices.enumerateDevices();
            let audioInputDevices = devices.filter(d => d.kind === 'audioinput');

            // 2. Verifica se os labels estão vazios (Proteção de Privacidade)
            const hasLabels = audioInputDevices.some(d => d.label !== "");
            
            if (!hasLabels && audioInputDevices.length > 0) {
                try {
                    // Trigger rápido para permissão
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach(track => track.stop());
                    
                    // Lista novamente com permissão
                    devices = await navigator.mediaDevices.enumerateDevices();
                    audioInputDevices = devices.filter(d => d.kind === 'audioinput');
                } catch (permErr) {
                    console.warn("Permissão para listar nomes de microfone negada.", permErr);
                }
            }

            // 3. Popula o Select
            if (ui.micSelect) {
                ui.micSelect.innerHTML = '<option value="default">Padrão do Sistema</option>';
                audioInputDevices.forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.text = device.label || `Microfone ${device.deviceId.slice(0,5)}...`;
                    ui.micSelect.appendChild(option);
                });
                
                // Restaura seleção anterior se possível
                if (selectedDeviceId && selectedDeviceId !== 'default') {
                    ui.micSelect.value = selectedDeviceId;
                }
            }

        } catch (err) {
            console.error("Erro ao carregar dispositivos de áudio:", err);
        }
    };

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
            if (shouldKeepListening) {
                updateStatus('Reiniciando serviço de voz...', 'reconnecting');
                try { recognition.start(); } catch (e) {}
            } else {
                stop(); // Garante limpeza total se parou por erro ou ação externa
            }
        };

        // --- EVENTO 3: ERROS ---
        recognition.onerror = (event) => {
            if (event.error === 'no-speech') return;
            
            if (event.error === 'network') {
                updateStatus('Erro de rede. Reconectando...', 'error');
                setTimeout(() => { if (shouldKeepListening) recognition.start(); }, 1000);
                return;
            }
            
            // Outros erros param tudo
            stop();
            updateStatus('Erro: ' + event.error, 'error');
        };

        // --- LÓGICA DE INSERÇÃO ---
        const handleInsert = async (mode) => {
            const rawText = ui.textArea ? ui.textArea.value.trim() : '';
            if (!rawText) {
                alert("O buffer está vazio. Fale algo antes de inserir.");
                return;
            }

            // Para o reconhecimento antes de processar, mas não fecha a UI ainda
            await stop(); 

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

        // --- SMART UNDO (DESFAZER INTELIGENTE) ---
        if (ui.btnClear) {
            ui.btnClear.onclick = (e) => {
                if (!ui.textArea || !ui.textArea.value) return;

                const originalText = ui.textArea.value;
                ui.textArea.value = ''; // Limpa
                clearBackup();
                
                // Cria botão de desfazer
                const undoWrapper = e.target.parentElement; // div.undo-wrapper
                const undoBtn = document.createElement('button');
                undoBtn.className = 'btn-undo-float'; // Estilo definido no CSS
                undoBtn.innerHTML = '↩ Desfazer apagar';
                undoBtn.style.position = 'absolute';
                undoBtn.style.top = '-35px';
                undoBtn.style.left = '0';
                undoBtn.style.background = '#333';
                undoBtn.style.color = '#fff';
                undoBtn.style.padding = '5px 10px';
                undoBtn.style.borderRadius = '4px';
                undoBtn.style.fontSize = '12px';
                undoBtn.style.zIndex = '100';
                undoBtn.style.cursor = 'pointer';

                undoBtn.onclick = () => {
                    ui.textArea.value = originalText;
                    saveBackup(originalText);
                    undoBtn.remove();
                    if (undoTimer) clearTimeout(undoTimer);
                };

                undoWrapper.appendChild(undoBtn);

                // Auto-hide após 5 segundos
                if (undoTimer) clearTimeout(undoTimer);
                undoTimer = setTimeout(() => {
                    if (undoBtn.parentElement) undoBtn.remove();
                }, 5000);

                if (ui.textArea) ui.textArea.focus();
            };
        }
    };

    const init = (config) => {
        if (!isSupported()) {
            console.error("Web Speech API não suportada.");
            return;
        }

        // Mapeia configurações e captura o Canvas
        ui = { ...ui, ...config };
        
        ui.canvas = document.getElementById('audio-visualizer');
        if (ui.canvas) {
            visualizerInstance = new AudioVisualizer(ui.canvas);
        }

        onInsertCallback = config.onInsert;
        
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';
        
        // Listener para mudança de dispositivo
        if (ui.micSelect) {
            ui.micSelect.addEventListener('change', (e) => {
                selectedDeviceId = e.target.value;
                // Se estiver gravando, reinicia para aplicar mudança
                if (isListening) {
                    stop().then(() => start());
                }
            });
        }

        // Listener para Start/Stop no ícone do microfone
        if (ui.micIcon) {
            ui.micIcon.style.cursor = 'pointer';
            ui.micIcon.addEventListener('click', () => {
                if (isListening) {
                    stop();
                    updateStatus('Pausado. Clique no microfone para continuar.');
                } else {
                    start();
                }
            });
        }
        
        setupListeners();
        restoreBackup();

        // Carrega dispositivos na inicialização
        loadAudioDevices();
    };

    /**
     * MÉTODO START MODERNIZADO
     * Suporta seleção de dispositivo e alta fidelidade
     */
    const start = async () => {
        if (isListening) return;
        
        try {
            // 1. Definição de Constraints com Dispositivo Selecionado
            const audioConstraints = {
                echoCancellation: true, 
                noiseSuppression: true,
                autoGainControl: true,
                channelCount: { ideal: 1 }, // Mono
                sampleRate: { ideal: 48000 } // HD
            };

            // Se tiver um ID específico selecionado
            if (selectedDeviceId && selectedDeviceId !== 'default') {
                audioConstraints.deviceId = { exact: selectedDeviceId };
            }

            // 2. Captura do Stream
            try {
                audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
            } catch (e) {
                console.warn("Hardware específico falhou. Usando padrão.", e);
                // Fallback para padrão
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
            shouldKeepListening = true;
            if (ui.langSelect) recognition.lang = ui.langSelect.value;
            
            try {
                recognition.start();
            } catch (recError) {
                if (recError.name !== 'InvalidStateError') throw recError;
            }

            // Atualiza Estado UI
            isListening = true;
            toggleUIVisuals(true);
            updateStatus('Ouvindo...');
            if (ui.dictationModal) ui.dictationModal.classList.add('visible');
            if (ui.textArea) ui.textArea.focus();

        } catch (err) {
            console.error("Erro crítico ao iniciar áudio:", err);
            updateStatus("Erro: Microfone inacessível.", "error");
            await stop();
        }
    };

    /**
     * MÉTODO STOP ATUALIZADO
     */
    const stop = async () => {
        shouldKeepListening = false;
        isListening = false;

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
        toggleUIVisuals(false);
        updateStatus('Pausado.');
    };

    const updateStatus = (text, type = '') => {
        if (ui.statusDisplay) {
            ui.statusDisplay.textContent = text;
            ui.statusDisplay.className = 'status-indicator ' + type;
        }
    };

    const toggleUIVisuals = (active) => {
        if (ui.micIcon) {
            ui.micIcon.classList.toggle('listening', active);
            // Efeito visual de toggle
            ui.micIcon.style.opacity = active ? "1" : "0.6";
        }
        if (ui.toolbarMicButton) ui.toolbarMicButton.classList.toggle('listening', active);
    };

    // --- Persistência (Cofre de Voz) ---
    function saveBackup(text) { 
        localStorage.setItem(STORAGE_KEY, text); 
        if (ui.saveStatus) ui.saveStatus.classList.add('visible');
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
