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
        _renderModelsAndFolders(callbacks.filterModels(), appState); // MODIFICADO
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

    // --- NOVA LÓGICA DE RENDERIZAÇÃO HIERÁRQUICA ---
    function _renderModelsAndFolders(itemsToRender, appState) {
        if (sortableModelsInstance) {
            sortableModelsInstance.destroy();
        }
        modelList.innerHTML = '';
        
        const foldersInView = itemsToRender.filter(item => item.tabId); // Filtra para pegar apenas pastas
        const modelsInView = itemsToRender.filter(item => !item.tabId || item.tabId); // Pega modelos

        // Separa itens raiz de itens filhos
        const rootItems = itemsToRender.filter(item => {
            const isFolder = !!item.isExpanded;
            const isRootModel = !item.folderId;
            return isFolder || isRootModel;
        });

        rootItems.forEach(item => {
            const isFolder = 'isExpanded' in item;
            if (isFolder) {
                modelList.appendChild(_createFolderElement(item, modelsInView, appState));
            } else {
                modelList.appendChild(_createModelElement(item, appState, false));
            }
        });

        // Configura o Drag and Drop
        _setupSortableForModels(appState);
    }
    
    function _createFolderElement(folder, allVisibleModels, appState) {
        const li = document.createElement('li');
        li.className = 'folder-item';
        li.dataset.folderId = folder.id;

        const modelCount = appState.models.filter(m => m.folderId === folder.id).length;
        
        li.innerHTML = `
            <span class="folder-toggle">${folder.isExpanded ? '▼' : '▶'}</span>
            <span class="folder-icon">📁</span>
            <span class="folder-name">${folder.name}</span>
            <span class="folder-counter">(${modelCount})</span>
        `;

        li.addEventListener('click', (e) => {
            if (e.target.closest('.folder-item')) {
                callbacks.onFolderToggleExpand(folder.id);
            }
        });

        li.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            _showFolderContextMenu(e.clientX, e.clientY, folder);
        });

        if (folder.isExpanded) {
            const childList = document.createElement('ul');
            childList.className = 'folder-child-list';
            const childModels = allVisibleModels.filter(m => m.folderId === folder.id);
            
            childModels.forEach(model => {
                childList.appendChild(_createModelElement(model, appState, true));
            });
            li.appendChild(childList);
        }
        
        return li;
    }

    function _createModelElement(model, appState, isChild) {
        const li = document.createElement('li');
        li.className = 'model-item';
        if (isChild) {
            li.classList.add('model-item-child');
        }
        li.dataset.modelId = model.id;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'model-header';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'model-name';
        
        nameSpan.title = `Clique para copiar o snippet: {{snippet:${model.name}}}`;
        nameSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            const snippetText = `{{snippet:${model.name}}}`;
            navigator.clipboard.writeText(snippetText).then(() => {
                NotificationService.show(`Snippet "${model.name}" copiado!`, 'success', 2500);
            });
        });

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
        return li;
    }

    function _setupSortableForModels(appState) {
        sortableModelsInstance = Sortable.create(modelList, {
            animation: 150,
            group: 'shared-models',
            ghostClass: 'model-item-ghost',
            dragClass: 'model-item-drag',
            
            onMove: function (evt) {
                document.querySelectorAll('.tab-item.drop-target-active, .folder-item.drop-target-active').forEach(el => {
                    el.classList.remove('drop-target-active');
                });

                const dropTargetEl = document.elementFromPoint(evt.originalEvent.clientX, evt.originalEvent.clientY);
                if (!dropTargetEl) return;

                const targetTab = dropTargetEl.closest('.tab-item');
                const targetFolder = dropTargetEl.closest('.folder-item');
                
                if (targetTab && targetTab.dataset.tabId !== appState.activeTabId) {
                    targetTab.classList.add('drop-target-active');
                } else if (targetFolder) {
                    targetFolder.classList.add('drop-target-active');
                }
            },

            onEnd: (evt) => {
                const modelId = evt.item.dataset.modelId;
                const activeTabTarget = document.querySelector('.tab-item.drop-target-active');
                const activeFolderTarget = document.querySelector('.folder-item.drop-target-active');

                document.querySelectorAll('.tab-item.drop-target-active, .folder-item.drop-target-active').forEach(el => {
                    el.classList.remove('drop-target-active');
                });
                
                if (activeTabTarget) {
                    const newTabId = activeTabTarget.dataset.tabId;
                    callbacks.onModelDropOnTab(modelId, newTabId);
                } else if (activeFolderTarget) {
                    const newFolderId = activeFolderTarget.dataset.folderId;
                    callbacks.onModelDropOnFolder(modelId, newFolderId);
                } else if (evt.from === evt.to && evt.oldIndex !== evt.newIndex) {
                    // Lógica para reordenar (pode ser aprimorada no futuro)
                    // Por enquanto, a mudança de pasta é a principal interação
                }
                 // Se um modelo for arrastado para a lista principal (fora de uma pasta)
                 if (!activeFolderTarget && evt.to === modelList) {
                    const model = appState.models.find(m => m.id === modelId);
                    if (model && model.folderId) {
                        callbacks.onModelDropOnFolder(modelId, null); // Move para a raiz
                    }
                }
            }
        });
    }

    // --- FIM DA NOVA LÓGICA DE RENDERIZAÇÃO ---
    
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

    // NOVO MENU DE CONTEXTO PARA PASTAS
    function _showFolderContextMenu(x, y, folder) {
        _closeContextMenu();
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        
        const renameOpt = document.createElement('button');
        renameOpt.className = 'context-menu-item';
        renameOpt.innerHTML = `${ICON_PENCIL} Renomear Pasta`;
        renameOpt.onclick = () => callbacks.onFolderRename(folder.id);

        const deleteOpt = document.createElement('button');
        deleteOpt.className = 'context-menu-item delete';
        deleteOpt.innerHTML = `${ICON_TRASH} Excluir Pasta...`;
        deleteOpt.onclick = () => callbacks.onFolderDelete(folder.id);

        menu.appendChild(renameOpt);
        menu.appendChild(deleteOpt);
        
        document.body.appendChild(menu);
        setTimeout(() => document.addEventListener('click', _closeContextMenu), 0);
    }


    return {
        init,
        render
    };
})();
