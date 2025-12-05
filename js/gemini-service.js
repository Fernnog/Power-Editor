const GeminiService = (() => {
    // Utiliza as configurações globais ou valores padrão de segurança
    const MODEL = (typeof CONFIG !== 'undefined' && CONFIG.model) ? CONFIG.model : 'gemini-1.5-flash';
    const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

    /**
     * Envia um texto para a API do Gemini e retorna a correção gramatical/ortográfica.
     * @param {string} textToCorrect O texto cru vindo do reconhecimento de voz.
     * @param {string} apiKey A chave de API do Google AI Studio.
     * @returns {Promise<string>} O texto corrigido.
     */
    async function correctText(textToCorrect, apiKey) {
        // Se o texto for vazio, retorna imediatamente
        if (!textToCorrect || !textToCorrect.trim()) return textToCorrect;

        // Prompt de Sistema: Instruções rígidas para a IA agir apenas como formatador
        const prompt = `
            Atue como um editor de texto silencioso e preciso para Português do Brasil.
            Sua única tarefa é formatar o texto recebido de um ditado por voz.
            
            Regras obrigatórias:
            1. Corrija pontuação, acentuação, ortografia e concordância.
            2. Aplique letras maiúsculas no início de frases e em nomes próprios.
            3. NÃO adicione introduções, explicações, aspas ou qualquer texto extra.
            4. Mantenha o estilo e o tom originais do usuário.
            5. Se o texto for um fragmento sem sentido claro, apenas corrija a ortografia básica.
            
            Entrada: "${textToCorrect}"
        `;

        try {
            const response = await fetch(`${BASE_URL}${MODEL}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1, // Baixa criatividade para garantir fidelidade ao ditado
                        maxOutputTokens: 1000, // Limite de segurança
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.warn('Erro API Gemini:', errorData);
                throw new Error(`Status ${response.status}`);
            }

            const data = await response.json();
            
            // Extração segura da resposta
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                const correctedText = data.candidates[0].content.parts[0].text;
                // Remove espaços extras ou quebras de linha acidentais no início/fim
                return correctedText.trim();
            } else {
                throw new Error("Formato de resposta da API inesperado.");
            }

        } catch (error) {
            console.error("Falha na correção IA (usando texto original):", error);
            // Fallback: Em caso de erro (ex: sem internet, chave inválida), retorna o texto original
            return textToCorrect; 
        }
    }

    return {
        correctText
    };
})();
