const GeminiService = (() => {
    // Pega o modelo do config ou usa um fallback seguro
    const MODEL = (typeof CONFIG !== 'undefined' && CONFIG.model) ? CONFIG.model : 'gemini-1.5-flash-latest';
    const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

    /**
     * Envia o texto completo para correção.
     */
    async function correctText(textToCorrect, apiKey) {
        if (!textToCorrect || !textToCorrect.trim()) return textToCorrect;

        const prompt = `
            Atue como um editor de texto profissional.
            Sua tarefa é formatar e corrigir o texto cru de um ditado.
            
            Regras:
            1. Corrija pontuação, acentuação e gramática.
            2. Capitalize o início das frases.
            3. NÃO adicione introduções ou explicações. Retorne APENAS o texto.
            4. Se o texto for longo, mantenha a formatação de parágrafos.
            
            Entrada: "${textToCorrect}"
        `;

        try {
            // Monta a URL garantindo que o modelo esteja correto
            const url = `${BASE_URL}${MODEL}:generateContent?key=${apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 2000 // Aumentado para suportar textos maiores
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Detalhes do Erro Gemini:", errorData);
                throw new Error(`Erro API: ${errorData.error?.message || response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0]?.content?.parts[0]) {
                return data.candidates[0].content.parts[0].text.trim();
            } else {
                throw new Error("Formato de resposta inválido");
            }

        } catch (error) {
            console.error("Falha na correção IA:", error);
            alert("A IA não conseguiu processar. Inserindo texto original.");
            return textToCorrect; // Retorna o texto original em caso de erro
        }
    }

    return { correctText };
})();
