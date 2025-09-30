// js/backup-manager.js

const BackupManager = (() => {
    let debounceTimer = null;
    const DEBOUNCE_DELAY = 5000; // 5 segundos de inatividade
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
            // CORREÇÃO CRÍTICA: O backup automático agora também usa a função central
            // para garantir que um ponto de restauração seja criado no histórico.
            console.log(`%c[BackupManager] Inatividade detectada. Criando ponto de restauração automático...`, 'color: blue');
            modifyStateAndBackup(() => {
                // A função `modifyStateAndBackup` já atualiza o timestamp,
                // então nenhuma modificação de estado é necessária aqui.
                // Apenas chamamos para que o log no histórico seja feito.
            }, { scheduleBackup: false, logToHistory: true }); // Agendamento falso para evitar loop
            
            NotificationService.show('Backup automático salvo por inatividade.', 'info', 2000);
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
        // Retorna os N mais recentes, com o último backup no topo da lista.
        return history.slice(-MAX_HISTORY_ITEMS).reverse();
    }

    function restoreFromHistory(timestamp, state) {
        const historyEntry = (state.backupHistory || []).find(entry => entry.timestamp === timestamp);
        if (!historyEntry) {
            NotificationService.show('Backup não encontrado no histórico.', 'error');
            return null;
        }
        try {
            if (historyEntry.state) {
                return historyEntry.state;
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
