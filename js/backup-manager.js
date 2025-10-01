const BackupManager = (() => {
    let debounceTimer = null;
    const DEBOUNCE_DELAY = 2500; // 2.5 segundos de inatividade antes de salvar
    let statusElement = null; // Referência ao elemento do DOM para o status

    /**
     * Inicializa o módulo, recebendo o elemento da UI para exibir o status.
     * @param {object} config - Objeto de configuração.
     * @param {HTMLElement} config.statusElement - O elemento onde o status do backup será exibido.
     */
    function init(config) {
        statusElement = config.statusElement;
    }

    /**
     * Atualiza o texto do status do backup na interface do usuário.
     * @param {Date | null} dateObject - O objeto Date do último backup ou null.
     */
    function updateStatus(dateObject) {
        if (!statusElement) return;
        
        if (dateObject instanceof Date && !isNaN(dateObject)) {
            const day = String(dateObject.getDate()).padStart(2, '0');
            const month = String(dateObject.getMonth() + 1).padStart(2, '0');
            const year = dateObject.getFullYear();
            const hours = String(dateObject.getHours()).padStart(2, '0');
            const minutes = String(dateObject.getMinutes()).padStart(2, '0');
            statusElement.textContent = `${day}/${month}/${year} às ${hours}:${minutes}`;
        } else {
            statusElement.textContent = 'Nenhum backup recente.';
        }
    }

    /**
     * Aciona o download do backup e atualiza o status na tela.
     * @param {object} state - O objeto de estado atual da aplicação (appState).
     */
    function triggerAutoBackup(state) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const timestamp = `${year}${month}${day}_${hours}${minutes}`;
        const filename = `${timestamp}_ModelosDosMeusDocumentos.json`;

        // Garante que o timestamp mais recente seja salvo DENTRO do arquivo de backup
        state.lastBackupTimestamp = now.toISOString();

        const dataStr = JSON.stringify(state, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Atualiza o status visual na tela
        updateStatus(now);
        console.log(`Backup automático realizado: ${filename}`);
    }

    /**
     * Agenda a execução do backup automático após um período de inatividade.
     * @param {object} state - O objeto de estado atual da aplicação (appState).
     */
    function schedule(state) {
        // Cancela qualquer backup agendado anteriormente
        clearTimeout(debounceTimer);

        // Agenda um novo backup
        debounceTimer = setTimeout(() => {
            // Passa uma cópia do estado para evitar problemas de referência
            triggerAutoBackup({ ...state });
        }, DEBOUNCE_DELAY);
    }

    // Expõe as funções públicas do módulo
    return {
        init,
        schedule,
        updateStatus
    };
})();
