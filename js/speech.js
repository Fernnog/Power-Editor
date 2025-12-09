// js/speech.js

/**
 * Classe responsável pelo Processamento de Sinal Digital (DSP) e Visualização
 * Baseada em Web Audio API e Canvas API.
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
 */
const SpeechDictation = (() => {
    // Verifica compatibilidade
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;
    let shouldKeepListening = false; 
    const STORAGE_KEY = 'dictation_buffer_backup'; 

    // Variáveis para o Visualizador e Stream de Hardware
    let visualizerInstance = null;
    let audioStream = null;

    // Mapeamento UI
    let ui = {
        micIcon: null, langSelect: null, statusDisplay: null, dictationModal: null,
        toolbarMicButton: null, 
        canvas: null, // Substitui waveAnimation
        textArea: null,
        interimDisplay: null, saveStatus: null, btnClear: null,
        btnInsertRaw: null, btnInsertFix: null, btnInsertLegal: null
    };

    let onInsertCallback = () => {};
    const isSupported = () => !!SpeechRecognition;

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
                // Se parou definitivamente, garante limpeza total
                stop(); 
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

            stop(); // Para o microfone imediatamente

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

    const init = (config) => {
        if (!isSupported()) {
            console.error("Web Speech API não suportada.");
            return;
        }

        // Mapeia configurações e captura o Canvas
        ui = { ...ui, ...config };
        
        // Elemento Canvas substitui o antigo waveAnimation na lógica
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
    };

    /**
     * Inicia o fluxo de captura de áudio:
     * 1. Pede permissão do hardware (getUserMedia)
     * 2. Inicia o Visualizador (Canvas)
     * 3. Inicia o Reconhecimento de Texto
     */
    const start = async () => {
        if (isListening) return;
        
        try {
            // Passo 1: Captura de Áudio do Hardware (Crucial para o visualizador)
            audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true, 
                    noiseSuppression: true 
                } 
            });

            // Passo 2: Inicia Visualização DSP
            if (visualizerInstance) {
                await visualizerInstance.start(audioStream);
                if (ui.canvas) ui.canvas.classList.add('active'); // Fade-in
            }

            // Passo 3: Configura e Inicia Reconhecimento
            shouldKeepListening = true;
            if (ui.langSelect) recognition.lang = ui.langSelect.value;
            recognition.start();

            // Atualiza Estado UI
            isListening = true;
            toggleUIVisuals(true);
            updateStatus('Ouvindo...');
            if (ui.dictationModal) ui.dictationModal.classList.add('visible');
            if (ui.textArea) ui.textArea.focus();

        } catch (err) {
            console.error("Erro ao acessar microfone:", err);
            updateStatus("Erro: Acesso ao microfone negado.", "error");
            stop();
        }
    };

    /**
     * Para todo o fluxo e libera o hardware
     */
    const stop = () => {
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
        if (ui.micIcon) ui.micIcon.classList.toggle('listening', active);
        if (ui.toolbarMicButton) ui.toolbarMicButton.classList.toggle('listening', active);
        // Nota: A onda antiga foi removida, o canvas é controlado via .active em start/stop
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
