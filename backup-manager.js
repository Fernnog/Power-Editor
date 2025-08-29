const BackupManager = (() => {
    let debounceTimer = null;
    const DEBOUNCE_DELAY = 2500; // 2.5 segundos de inatividade antes de salvar

    /**
     * Aciona o download do backup e atualiza o status na tela.
     * @param {object} state O objeto de estado atual da aplicação (appState).
     */
    function triggerAutoBackup(state) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const timestamp = `${year}${month}${day}_${hours}${minutes}`;
        const filename = `${timestamp}_Modelos dos meus documentos.JSON`;

        // Atualiza o timestamp no estado antes de salvar
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
        const backupStatusEl = document.getElementById('backup-status');
        if (backupStatusEl) {
            backupStatusEl.textContent = `Último Backup: ${day}/${month}/${year} ${hours}:${minutes}`;
        }
        console.log(`Backup automático realizado: ${filename}`);
    }

    /**
     * Agenda a execução do backup automático após um período de inatividade.
     * @param {object} state O objeto de estado atual da aplicação (appState).
     */
    function schedule(state) {
        // Cancela qualquer backup agendado anteriormente
        clearTimeout(debounceTimer);

        // Agenda um novo backup
        debounceTimer = setTimeout(() => {
            triggerAutoBackup(state);
        }, DEBOUNCE_DELAY);
    }

    // Expõe publicamente apenas a função de agendamento
    return {
        schedule
    };
})();
