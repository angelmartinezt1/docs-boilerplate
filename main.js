// Inicializar el generador
//const generator = new APIDocGenerator();

// Función para cargar desde JSON
async function loadFromJSON(jsonFile) {
    try {
        const response = await fetch(jsonFile);
        const config = await response.json();
        generator.generateFromJSON(config);
    } catch (error) {
        console.error('Error loading JSON config:', error);
    }
}

// Función para cargar desde YAML
async function loadFromYAML(yamlFile) {
    try {
        const response = await fetch(yamlFile);
        const yamlText = await response.text();
        generator.generateFromYAML(yamlText);
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