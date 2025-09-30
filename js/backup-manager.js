// js/backup-manager.js

const BackupManager = (() => {
    let debounceTimer = null;
    const DEBOUNCE_DELAY = 3000;
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

    function schedule(state) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const now = new Date();
            state.lastBackupTimestamp = now.toISOString();
            updateStatus(now);
            saveStateToStorage(); // Função global de script.js
            console.log(`%c[BackupManager] Backup por inatividade salvo em: ${now.toLocaleString()}`, 'color: blue');
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
        const MAX_HISTORY_ITEMS = 10;
        const history = state.backupHistory || [];
        console.log(`[getHistory] Histórico recebido com ${history.length} itens. Retornando os últimos ${MAX_HISTORY_ITEMS}.`);
        return history.slice(-MAX_HISTORY_ITEMS).reverse();
    }

    function restoreFromHistory(timestamp, state) {
        console.log(`[restoreFromHistory] Tentando restaurar backup com timestamp: ${timestamp}`);
        const historyEntry = (state.backupHistory || []).find(entry => entry.timestamp === timestamp);
        if (!historyEntry) {
            NotificationService.show('Backup não encontrado no histórico.', 'error');
            return null;
        }
        try {
            if (historyEntry.state) {
                console.log("[restoreFromHistory] Backup restaurado com sucesso a partir de 'entry.state'.");
                return historyEntry.state;
            } else if (historyEntry.data) {
                return JSON.parse(historyEntry.data);
            }
            throw new Error("Formato de histórico inválido.");
        } catch (e) {
            NotificationService.show('Erro ao restaurar backup: dados corrompidos.', 'error');
            console.error("Erro ao restaurar:", e);
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
