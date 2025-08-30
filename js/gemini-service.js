// Crie este novo arquivo na pasta js/
const GeminiService = (() => {
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=';

    /**
     * Envia um texto para a API do Gemini para correção.
     * @param {string} text - O texto a ser corrigido.
     * @param {string} apiKey - A chave de API do usuário.
     * @returns {Promise<string>} O texto corrigido.
     */
    async function correctText(text, apiKey) {
        const fullApiUrl = `${API_URL}${apiKey}`;

        const prompt = `Corrija o seguinte texto, focando apenas em erros gramaticais, ortográficos e de pontuação. Retorne APENAS o texto corrigido, sem nenhuma introdução ou comentário adicional como "Aqui está o texto corrigido:". Texto original: "${text}"`;

        try {
            const response = await fetch(fullApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro da API: ${errorData.error.message}`);
            }

            const data = await response.json();
            // Navega na estrutura da resposta para obter o texto
            const correctedText = data.candidates[0].content.parts[0].text;
            return correctedText.trim();

        } catch (error) {
            console.error("Falha ao comunicar com a API do Gemini:", error);
            throw error; // Propaga o erro para ser tratado no local da chamada
        }
    }

    return {
        correctText
    };
})();