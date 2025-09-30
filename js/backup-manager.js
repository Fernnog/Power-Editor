const BackupManager = (() => {
    let debounceTimer = null;
    const DEBOUNCE_DELAY = 3000; // Aumentado para 3s
    const MAX_HISTORY_ITEMS = 5;
    let statusElement = null;

    function init(config) {
        statusElement = config.statusElement;
    }

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

    function saveBackupToHistory(state) {
        const now = new Date();
        // Criamos uma cópia profunda para garantir um snapshot real do estado
        const stateSnapshot = JSON.parse(JSON.stringify(state));
        stateSnapshot.lastBackupTimestamp = now.toISOString();

        if (!state.backupHistory) {
            state.backupHistory = [];
        }

        state.backupHistory.unshift({
            timestamp: now.toISOString(),
            data: JSON.stringify(stateSnapshot)
        });

        if (state.backupHistory.length > MAX_HISTORY_ITEMS) {
            state.backupHistory.pop();
        }
        
        updateStatus(now);
        console.log(`Backup salvo no histórico em: ${now.toLocaleString()}`);
    }

    function schedule(state) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            saveBackupToHistory(state);
            // A função `modifyStateAndBackup` agora é responsável por salvar no LocalStorage
            // Este agendamento apenas atualiza o histórico.
            saveStateToStorage();
        }, DEBOUNCE_DELAY);
    }

    function exportData(state) {
        const dataStr = JSON.stringify(state, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        a.href = url;
        a.download = `${timestamp}_modelos_backup.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function getHistory(state) {
        return state.backupHistory || [];
    }

    function restoreFromHistory(timestamp, state) {
        const historyEntry = (state.backupHistory || []).find(entry => entry.timestamp === timestamp);
        if (!historyEntry) {
            NotificationService.show('Backup não encontrado no histórico.', 'error');
            return null;
        }
        try {
            return JSON.parse(historyEntry.data);
        } catch (e) {
            NotificationService.show('Erro ao restaurar backup: dados corrompidos.', 'error');
            return null;
        }
    }

    return {
        init,
        schedule,
        updateStatus,
        exportData,
        getHistory,
        restoreFromHistory
    };
})();
