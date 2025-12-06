// --- START OF FILE js/gemini-service.js ---

const GeminiService = (() => {
    // ALTERAÇÃO: Fallback atualizado para 'gemini-1.5-flash' (versão estável sem sufixo -latest)
    // Isso previne erros 404 caso o config.js não seja carregado corretamente.
    const MODEL = (typeof CONFIG !== 'undefined' && CONFIG.model) ? CONFIG.model : 'gemini-2.0-flash-001';
    const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

    /**
     * Envia o texto completo para correção.
     */
    async function correctText(textToCorrect, apiKey) {
        if (!textToCorrect || !textToCorrect.trim()) return textToCorrect;

        // MELHORIA: Validação básica para evitar chamadas com chaves inválidas ou vazias
        if (!apiKey || apiKey.includes("SUA_CHAVE")) {
            console.warn("Chave de API inválida ou não configurada.");
            alert("Atenção: Configure sua chave de API válida no arquivo js/config.js para usar a IA.");
            return textToCorrect;
        }

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
                // MELHORIA: Lança um erro com a mensagem específica da API para facilitar o debug
                throw new Error(`Erro API (${response.status}): ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0]?.content?.parts[0]) {
                return data.candidates[0].content.parts[0].text.trim();
            } else {
                throw new Error("Formato de resposta da IA inválido ou vazio.");
            }

        } catch (error) {
            console.error("Falha na correção IA:", error);
            // MELHORIA: Alert mais informativo para o usuário saber o que aconteceu
            alert(`A IA não conseguiu processar o texto.\nDetalhe: ${error.message}\n\nO texto original será inserido.`);
            return textToCorrect; // Retorna o texto original em caso de erro para não perder dados
        }
    }

    return { correctText };
})();
