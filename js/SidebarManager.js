// js/SidebarManager.js

const SidebarManager = (() => {
    // Referências ao DOM
    let tabsContainer, modelList, tabActionsContainer, activeContentArea;

    // Instâncias do SortableJS
    let sortableTabsInstance = null;
    let sortableModelsInstance = null;

    // Callbacks para o state manager
    let callbacks = {};

    function init(callbackFunctions) {
        callbacks = callbackFunctions;

        tabsContainer = document.getElementById('tabs-container');
        modelList = document.getElementById('model-list');
        tabActionsContainer = document.getElementById('tab-actions-container');
        activeContentArea = document.getElementById('active-content-area');

        if (!tabsContainer || !modelList || !tabActionsContainer || !activeContentArea) {
            console.error("Elementos da UI da Sidebar não encontrados. O módulo não funcionará.");
            return;
        }
    }

    function render(appState) {
        _renderTabs(appState);
        _renderModels(callbacks.filterModels(), appState);
        _renderTabActions(appState);
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO PRIVADAS ---

    function _renderTabs(appState) {
        if (sortableTabsInstance) {
            sortableTabsInstance.destroy();
        }

        tabsContainer.innerHTML = '';
        let activeTabColor = '#ccc';

        const createTabElement = (tab) => {
            const tabEl = document.createElement('button');
            tabEl.className = 'tab-item';
            tabEl.dataset.tabId = tab.id;
            
            const tabColor = tab.color || '#6c757d';
            tabEl.style.setProperty('--tab-color', tabColor);

            if (tab.id === appState.activeTabId) {
                tabEl.classList.add('active');
                activeTabColor = tabColor;
            }
            
            let modelCount = 0;
            if (tab.id === callbacks.getFavoritesTabId()) {
                modelCount = appState.models.filter(m => m.isFavorite).length;
            } else {
                modelCount = appState.models.filter(m => m.tabId === tab.id).length;
            }

            if (modelCount > 0) {
                const counter = document.createElement('span');
                counter.className = 'tab-item-counter';
                counter.textContent = modelCount;
                tabEl.appendChild(counter);
            }

            if (tab.id === callbacks.getFavoritesTabId()) {
                tabEl.innerHTML += ICON_STAR_FILLED;
                tabEl.title = tab.name;
                tabEl.classList.add('tab-item-icon-only');
            } else if (tab.id === callbacks.getPowerTabId()) {
                tabEl.innerHTML += ICON_LIGHTNING;
                tabEl.title = tab.name;
                tabEl.classList.add('tab-item-icon-only');
            } else {
                const textNode = document.createTextNode(tab.name);
                tabEl.appendChild(textNode);
            }
            
            tabEl.addEventListener('click', () => callbacks.onTabChange(tab.id));
            tabEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                _showTabContextMenu(e.clientX, e.clientY, tab, appState);
            });

            return tabEl;
        };

        appState.tabs.forEach(tab => tabsContainer.appendChild(createTabElement(tab)));
        activeContentArea.style.borderColor = activeTabColor;

        sortableTabsInstance = Sortable.create(tabsContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: (evt) => callbacks.onTabReorder(evt.oldIndex, evt.newIndex)
        });
    }

    function _renderModels(modelsToRender, appState) {
        if (sortableModelsInstance) {
            sortableModelsInstance.destroy();
        }
        modelList.innerHTML = '';

        modelsToRender.forEach(model => {
            const li = document.createElement('li');
            li.className = 'model-item';
            li.dataset.modelId = model.id;

            const headerDiv = document.createElement('div');
            headerDiv.className = 'model-header';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'model-name';
            
            const colorIndicator = document.createElement('span');
            colorIndicator.className = 'model-color-indicator';
            const parentTab = appState.tabs.find(t => t.id === model.tabId);
            colorIndicator.style.backgroundColor = parentTab ? parentTab.color : '#ccc';
            nameSpan.appendChild(colorIndicator);
            
            if (model.content && model.content.includes('{{')) {
                const variableIndicator = document.createElement('span');
                variableIndicator.className = 'model-variable-indicator';
                variableIndicator.title = 'Este modelo contém variáveis dinâmicas';
                variableIndicator.textContent = '🤖';
                nameSpan.appendChild(variableIndicator);
            }

            const textNode = document.createTextNode(" " + model.name);
            nameSpan.appendChild(textNode);
            headerDiv.appendChild(nameSpan);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'model-actions';
            
            const actionButtons = [
                { icon: ICON_PLUS, title: 'Inserir modelo', action: () => callbacks.onModelInsert(model) },
                { icon: ICON_PENCIL, title: 'Editar modelo', action: () => callbacks.onModelEdit(model.id) },
                { icon: ICON_MOVE, title: 'Mover para outra aba', action: () => callbacks.onModelMove(model.id) },
                { icon: ICON_TRASH, title: 'Excluir modelo', action: () => callbacks.onModelDelete(model.id) },
                { icon: model.isFavorite ? ICON_STAR_FILLED : ICON_STAR_OUTLINE, title: model.isFavorite ? 'Desfavoritar' : 'Favoritar', action: () => callbacks.onModelFavoriteToggle(model.id) }
            ];

            actionButtons.forEach(btnInfo => {
                const button = document.createElement('button');
                button.className = 'action-btn';
                button.innerHTML = btnInfo.icon;
                button.title = btnInfo.title;
                button.onclick = btnInfo.action;
                actionsDiv.appendChild(button);
            });

            li.appendChild(headerDiv);
            li.appendChild(actionsDiv);
            modelList.appendChild(li);
        });

        sortableModelsInstance = Sortable.create(modelList, {
            animation: 150,
            ghostClass: 'model-item-ghost',
            dragClass: 'model-item-drag',
            
            onMove: function (evt) {
                document.querySelectorAll('.tab-item.drop-target-active').forEach(tab => {
                    tab.classList.remove('drop-target-active');
                });

                const dropTarget = document.elementFromPoint(evt.originalEvent.clientX, evt.originalEvent.clientY);
                if (!dropTarget) return;

                const targetTab = dropTarget.closest('.tab-item');
                
                if (targetTab && targetTab.dataset.tabId !== appState.activeTabId) {
                    targetTab.classList.add('drop-target-active');
                }
            },

            onEnd: (evt) => {
                const modelId = evt.item.dataset.modelId;
                const activeDropTarget = document.querySelector('.tab-item.drop-target-active');
                
                if (activeDropTarget) {
                    const newTabId = activeDropTarget.dataset.tabId;
                    activeDropTarget.classList.remove('drop-target-active');
                    callbacks.onModelDropOnTab(modelId, newTabId);
                } else if (evt.oldIndex !== evt.newIndex) {
                    callbacks.onModelReorder(modelId, evt.newIndex);
                }

                document.querySelectorAll('.tab-item.drop-target-active').forEach(tab => {
                    tab.classList.remove('drop-target-active');
                });
            }
        });
    }

    function _renderTabActions(appState) {
        tabActionsContainer.innerHTML = '';
        const activeTab = appState.tabs.find(t => t.id === appState.activeTabId);

        if (!activeTab || activeTab.id === callbacks.getFavoritesTabId() || activeTab.id === callbacks.getPowerTabId()) {
            tabActionsContainer.classList.remove('visible');
            return;
        }

        const regularTabsCount = appState.tabs.filter(t => t.id !== callbacks.getFavoritesTabId() && t.id !== callbacks.getPowerTabId()).length;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'tab-action-btn';
        deleteBtn.innerHTML = ICON_TRASH;
        deleteBtn.title = 'Excluir esta aba';
        if (regularTabsCount <= 1) deleteBtn.disabled = true;
        deleteBtn.onclick = () => callbacks.onTabDelete(appState.activeTabId);
        
        const colorBtn = document.createElement('button');
        colorBtn.className = 'tab-action-btn';
        colorBtn.innerHTML = ICON_PALETTE;
        colorBtn.title = 'Alterar cor da aba';
        colorBtn.onclick = (e) => {
            e.stopPropagation();
            _toggleColorPalette(tabActionsContainer, activeTab);
        };
        
        const renameBtn = document.createElement('button');
        renameBtn.className = 'tab-action-btn';
        renameBtn.innerHTML = ICON_PENCIL;
        renameBtn.title = 'Renomear esta aba';
        renameBtn.onclick = () => callbacks.onTabRename(activeTab);

        tabActionsContainer.appendChild(deleteBtn);
        tabActionsContainer.appendChild(colorBtn);
        tabActionsContainer.appendChild(renameBtn);
        tabActionsContainer.classList.add('visible');
    }

    function _toggleColorPalette(anchorElement, tab) {
        _closeContextMenu();
        const existingPalette = document.querySelector('.color-palette-popup');
        if (existingPalette) {
            existingPalette.remove();
            return;
        }

        const palette = document.createElement('div');
        palette.className = 'color-palette-popup';
        
        callbacks.getTabColors().forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.onclick = () => {
                callbacks.onTabColorChange(tab, color);
                palette.remove();
            };
            palette.appendChild(swatch);
        });

        anchorElement.appendChild(palette);
        setTimeout(() => document.addEventListener('click', () => palette.remove(), { once: true }), 0);
    }
    
    function _closeContextMenu() {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) existingMenu.remove();
        document.removeEventListener('click', _closeContextMenu);
    }

    function _showTabContextMenu(x, y, tab, appState) {
        _closeContextMenu();
        if (tab.id === callbacks.getFavoritesTabId() || tab.id === callbacks.getPowerTabId()) return;

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        const regularTabsCount = appState.tabs.filter(t => t.id !== callbacks.getFavoritesTabId() && t.id !== callbacks.getPowerTabId()).length;
        
        const renameOpt = document.createElement('button');
        renameOpt.className = 'context-menu-item';
        renameOpt.innerHTML = `${ICON_PENCIL} Renomear`;
        renameOpt.onclick = () => callbacks.onTabRename(tab);

        const colorOpt = document.createElement('button');
        colorOpt.className = 'context-menu-item';
        colorOpt.innerHTML = `${ICON_PALETTE} Alterar Cor`;
        colorOpt.onclick = (e) => {
            e.stopPropagation();
            _toggleColorPalette(colorOpt, tab);
        };

        const deleteOpt = document.createElement('button');
        deleteOpt.className = 'context-menu-item delete';
        deleteOpt.innerHTML = `${ICON_TRASH} Excluir Aba`;
        deleteOpt.onclick = () => callbacks.onTabDelete(tab.id);
        if (regularTabsCount <= 1) deleteOpt.disabled = true;

        menu.appendChild(renameOpt);
        menu.appendChild(colorOpt);
        menu.appendChild(deleteOpt);
        
        document.body.appendChild(menu);
        setTimeout(() => document.addEventListener('click', _closeContextMenu), 0);
    }

    return {
        init,
        render
    };
})();
