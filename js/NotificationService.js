// js/NotificationService.js

const NotificationService = (() => {
    const container = document.getElementById('toast-container');

    /**
     * Exibe uma notificação toast informativa que desaparece automaticamente.
     * @param {string} message - A mensagem a ser exibida.
     * @param {string} [type='info'] - O tipo de notificação ('info', 'success', 'error').
     * @param {number} [duration=4000] - Duração em milissegundos antes do toast desaparecer.
     */
    function show(message, type = 'info', duration = 4000) {
        if (!container) {
            console.error('O container de notificações (#toast-container) não foi encontrado no DOM.');
            return;
        }
        
        const toast = _createToast(message, type);
        container.appendChild(toast);
        
        // Adiciona a classe 'show' após um pequeno delay para permitir a animação de entrada do CSS
        setTimeout(() => toast.classList.add('show'), 10);

        const timeoutId = setTimeout(() => _removeToast(toast), duration);

        // Permite que o usuário feche o toast manualmente
        toast.querySelector('.toast-close-btn').addEventListener('click', () => {
            clearTimeout(timeoutId);
            _removeToast(toast);
        });
    }

    /**
     * Exibe uma notificação de confirmação com botões de ação.
     * @param {object} options - Opções de configuração.
     * @param {string} options.message - A pergunta de confirmação.
     * @param {function} options.onConfirm - Callback executado ao clicar em "Confirmar".
     * @param {function} [options.onCancel] - Callback opcional executado ao clicar em "Cancelar" ou fechar.
     */
    function showConfirm({ message, onConfirm, onCancel }) {
        if (!container) {
            console.error('O container de notificações (#toast-container) não foi encontrado no DOM.');
            return;
        }

        const toast = _createToast(message, 'confirm');
        
        const buttons = document.createElement('div');
        buttons.className = 'toast-confirm-buttons';
        buttons.innerHTML = `
            <button class="toast-confirm-btn">Confirmar</button>
            <button class="toast-cancel-btn">Cancelar</button>
        `;

        toast.querySelector('.toast-message').appendChild(buttons);
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);

        const confirmAction = () => {
            if (onConfirm) onConfirm();
            _removeToast(toast);
        };
        
        const cancelAction = () => {
            if (onCancel) onCancel();
            _removeToast(toast);
        };

        toast.querySelector('.toast-confirm-btn').onclick = confirmAction;
        toast.querySelector('.toast-cancel-btn').onclick = cancelAction;
        toast.querySelector('.toast-close-btn').onclick = cancelAction;
    }
    
    /**
     * Função auxiliar para criar o elemento HTML do toast.
     * @private
     */
    function _createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-message">${message}</div>
            <button class="toast-close-btn">&times;</button>
        `;
        return toast;
    }

    /**
     * Função auxiliar para remover o toast com animação.
     * @private
     */
    function _removeToast(toast) {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, { once: true });
    }

    // Expõe as funções públicas do serviço
    return { 
        show, 
        showConfirm 
    };
})();
