// Inicializar el generador
//const generator = new APIDocGenerator();

// Search functionality
let searchEndpoints = [];
let selectedIndex = -1;

// Initialize search modal
function initializeSearchModal() {
    const searchBox = document.getElementById('searchBox');
    const searchModal = document.getElementById('searchModal');
    const searchModalInput = document.getElementById('searchModalInput');
    const searchModalOverlay = document.getElementById('searchModalOverlay');
    const searchResults = document.getElementById('searchResults');

    // Open modal when clicking search box
    if (searchBox) {
        searchBox.addEventListener('focus', openSearchModal);
        searchBox.addEventListener('click', openSearchModal);
    }

    // Close modal when clicking overlay
    if (searchModalOverlay) {
        searchModalOverlay.addEventListener('click', closeSearchModal);
    }

    // Search input functionality
    if (searchModalInput) {
        searchModalInput.addEventListener('input', handleSearch);
        searchModalInput.addEventListener('keydown', handleKeyNavigation);
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Open search with Ctrl/Cmd + K
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearchModal();
        }
        
        // Close search with Escape
        if (e.key === 'Escape' && searchModal && searchModal.classList.contains('open')) {
            closeSearchModal();
        }
    });
    
    // Listen for documentation generation events
    document.addEventListener('documentationGenerated', function(e) {
        console.log('Documentation generated, reloading search endpoints...');
        setTimeout(() => {
            loadSearchEndpoints();
        }, 100);
    });
}

function openSearchModal() {
    const searchModal = document.getElementById('searchModal');
    const searchModalInput = document.getElementById('searchModalInput');
    
    if (searchModal && searchModalInput) {
        searchModal.classList.add('open');
        document.body.style.overflow = 'hidden';
        
        // Focus input after animation
        setTimeout(() => {
            searchModalInput.focus();
        }, 100);
        
        // Load endpoints if not already loaded
        if (searchEndpoints.length === 0) {
            loadSearchEndpoints();
        }
    }
}

function closeSearchModal() {
    const searchModal = document.getElementById('searchModal');
    const searchModalInput = document.getElementById('searchModalInput');
    const searchBox = document.getElementById('searchBox');
    
    if (searchModal) {
        searchModal.classList.remove('open');
        document.body.style.overflow = '';
        selectedIndex = -1;
        
        if (searchModalInput) {
            searchModalInput.value = '';
        }
        
        if (searchBox) {
            searchBox.blur();
        }
        
        showEmptyState();
    }
}

function loadSearchEndpoints() {
    // Get endpoints from the generator's config or from the global config
    let config = null;
    
    // Try to get from generator first
    if (typeof generator !== 'undefined' && generator.config && generator.config.paths) {
        config = generator.config;
    } 
    // Fallback: try to load from the current loaded config if available
    else if (window.currentConfig && window.currentConfig.paths) {
        config = window.currentConfig;
    }
    
    if (config && config.paths) {
        searchEndpoints = [];
        const paths = config.paths;
        
        Object.keys(paths).forEach(path => {
            const pathObj = paths[path];
            Object.keys(pathObj).forEach(method => {
                const endpoint = pathObj[method];
                searchEndpoints.push({
                    path: path,
                    method: method.toUpperCase(),
                    summary: endpoint.summary || 'Sin descripción',
                    description: endpoint.description || '',
                    tags: endpoint.tags || []
                });
            });
        });
        
        console.log('Loaded', searchEndpoints.length, 'endpoints for search');
    }
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (!query) {
        showEmptyState();
        return;
    }
    
    const filteredEndpoints = searchEndpoints.filter(endpoint => {
        return endpoint.path.toLowerCase().includes(query) ||
               endpoint.method.toLowerCase().includes(query) ||
               endpoint.summary.toLowerCase().includes(query) ||
               endpoint.description.toLowerCase().includes(query) ||
               endpoint.tags.some(tag => tag.toLowerCase().includes(query));
    });
    
    displaySearchResults(filteredEndpoints, query);
    selectedIndex = -1;
}

function displaySearchResults(endpoints, query = '') {
    const searchResults = document.getElementById('searchResults');
    
    if (!searchResults) return;
    
    if (endpoints.length === 0) {
        searchResults.innerHTML = `
            <div class="search-no-results">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <p>No se encontraron endpoints para "${query}"</p>
            </div>
        `;
        return;
    }
    
    const resultsHTML = endpoints.map((endpoint, index) => {
        const methodClass = endpoint.method.toLowerCase();
        const highlightedPath = highlightMatch(endpoint.path, query);
        const highlightedSummary = highlightMatch(endpoint.summary, query);
        
        return `
            <div class="search-result-item" data-index="${index}" data-path="${endpoint.path}" data-method="${endpoint.method}">
                <div class="search-result-header">
                    <span class="method-tag method-${methodClass}">${endpoint.method}</span>
                    <span class="search-result-path">${highlightedPath}</span>
                </div>
                <div class="search-result-summary">${highlightedSummary}</div>
                ${endpoint.tags.length > 0 ? `
                    <div class="search-result-tags">
                        ${endpoint.tags.map(tag => `<span class="search-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    searchResults.innerHTML = resultsHTML;
    
    // Add click listeners
    const resultItems = searchResults.querySelectorAll('.search-result-item');
    resultItems.forEach((item, index) => {
        item.addEventListener('click', () => selectResult(index));
        item.addEventListener('mouseenter', () => setSelectedIndex(index));
    });
}

function highlightMatch(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function showEmptyState() {
    const searchResults = document.getElementById('searchResults');
    
    if (searchResults) {
        searchResults.innerHTML = `
            <div class="search-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <p>Escribe para buscar endpoints</p>
            </div>
        `;
    }
}

function handleKeyNavigation(e) {
    const items = document.querySelectorAll('.search-result-item');
    
    if (items.length === 0) return;
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % items.length;
            updateSelection();
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
            updateSelection();
            break;
            
        case 'Enter':
            e.preventDefault();
            if (selectedIndex >= 0) {
                selectResult(selectedIndex);
            }
            break;
    }
}

function setSelectedIndex(index) {
    selectedIndex = index;
    updateSelection();
}

function updateSelection() {
    const items = document.querySelectorAll('.search-result-item');
    
    items.forEach((item, index) => {
        item.classList.toggle('selected', index === selectedIndex);
    });
    
    // Scroll selected item into view
    if (selectedIndex >= 0 && items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
        });
    }
}

function selectResult(index) {
    const items = document.querySelectorAll('.search-result-item');
    
    if (items[index]) {
        const path = items[index].dataset.path;
        const method = items[index].dataset.method;
        
        // Close modal
        closeSearchModal();
        
        // Navigate to the endpoint section
        navigateToEndpoint(path, method);
    }
}

function navigateToEndpoint(path, method) {
    // Generate section ID based on path and method
    const sectionId = path.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '-' + method.toLowerCase();
    
    // Try to find and scroll to the section
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        // Highlight the section briefly
        section.style.background = '#fffbf0';
        setTimeout(() => {
            section.style.background = '';
        }, 2000);
    } else {
        // Fallback: try to find by text content
        const elements = document.querySelectorAll('.content-title, .section-title');
        for (let element of elements) {
            if (element.textContent.includes(path) || element.textContent.includes(method)) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                break;
            }
        }
    }
}

// Función para cargar desde JSON
async function loadFromJSON(jsonFile) {
    try {
        const response = await fetch(jsonFile);
        const config = await response.json();
        
        // Store config globally for search functionality
        window.currentConfig = config;
        
        generator.generateFromJSON(config);
        
        // Reload search endpoints after documentation is generated
        setTimeout(() => {
            loadSearchEndpoints();
        }, 500);
    } catch (error) {
        console.error('Error loading JSON config:', error);
    }
}

// Función para cargar desde YAML
async function loadFromYAML(yamlFile) {
    try {
        const response = await fetch(yamlFile);
        const yamlText = await response.text();
        
        // Parse YAML and store globally for search
        const config = simpleYamlParser(yamlText);
        window.currentConfig = config;
        
        generator.generateFromYAML(yamlText);
        
        // Reload search endpoints after documentation is generated
        setTimeout(() => {
            loadSearchEndpoints();
        }, 500);
    } catch (error) {
        console.error('Error loading YAML config:', error);
    }
}



// Función para actualizar la documentación dinámicamente
function updateDocumentation(newConfig) {
    generator.generateFromJSON(newConfig);
}

// Ejemplo de cómo agregar un nuevo endpoint dinámicamente
function addNewEndpoint() {
    const currentConfig = generator.config;
    
    // Agregar nuevo endpoint
    currentConfig.paths['/new-endpoint'] = {
        "get": {
            "summary": "Nuevo Endpoint",
            "description": "Descripción del nuevo endpoint",
            "tags": ["Nuevo"],
            "responses": {
                "200": {
                    "description": "Éxito"
                }
            }
        }
    };

    // Regenerar documentación
    generator.generateFromJSON(currentConfig);
}

// Función para exportar la configuración actual
function exportCurrentConfig() {
    if (generator.config) {
        const configJson = JSON.stringify(generator.config, null, 2);
        const blob = new Blob([configJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'api-config.json';
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

// Función para importar configuración desde archivo
function importConfig() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.yaml,.yml';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                
                if (file.name.endsWith('.json')) {
                    try {
                        const config = JSON.parse(content);
                        generator.generateFromJSON(config);
                    } catch (error) {
                        alert('Error parsing JSON file: ' + error.message);
                    }
                } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
                    generator.generateFromYAML(content);
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

// Agregar controles de administración (opcional)
function addAdminControls() {
    const adminPanel = document.createElement('div');
    adminPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: white;
        border: 1px solid #ccc;
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
    `;
    
    adminPanel.innerHTML = `
        <h4>Admin Panel</h4>
        <button onclick="importConfig()">Importar Config</button>
        <button onclick="exportCurrentConfig()">Exportar Config</button>
        <button onclick="addNewEndpoint()">Agregar Endpoint</button>
        <button onclick="this.parentElement.style.display='none'">Cerrar</button>
    `;
    
    document.body.appendChild(adminPanel);
}

// Activar panel de administración con Ctrl+Alt+A
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.altKey && e.key === 'a') {
        e.preventDefault();
        addAdminControls();
    }
});

// Parser YAML simple para casos básicos
function simpleYamlParser(yamlString) {
    // Implementación básica - para uso completo recomiendo js-yaml
    const lines = yamlString.split('\n');
    const result = {};
    let currentPath = [];
    let currentObject = result;
    
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const indent = line.length - line.trimLeft().length;
            const colonIndex = trimmed.indexOf(':');
            
            if (colonIndex > -1) {
                const key = trimmed.substring(0, colonIndex).trim();
                const value = trimmed.substring(colonIndex + 1).trim();
                
                // Lógica simple de parsing
                if (value) {
                    currentObject[key] = value.startsWith('"') && value.endsWith('"') 
                        ? value.slice(1, -1) 
                        : value;
                } else {
                    currentObject[key] = {};
                }
            }
        }
    });
    
    return result;
}