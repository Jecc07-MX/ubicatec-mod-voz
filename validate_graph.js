const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\LuisS\\OneDrive\\Escritorio\\Ubicatec-accesibilidad\\js\\mapa-accesible.js';

try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract the object definition
    // It starts with "let grafoAccesible = {" and we can assume it ends before the next major section or function
    const startMarker = "let grafoAccesible = {";
    const endMarker = "// ============================================================================";
    // The file has multiple sections. The first one is variable declaration. The second is functions.
    // Looking at file content, the graph definition ends around line 1195, followed by:
    // // ============================================================================
    // // FUNCIONES DE UTILIDAD PARA EL GRAFO

    // There are multiple "======" separators. The one after the graph is the second one (first one is header).

    const startIndex = content.indexOf(startMarker);
    if (startIndex === -1) {
        throw new Error("Could not find start of grafoAccesible");
    }

    // Find limits
    const remaining = content.substring(startIndex);
    // Find the next function definition or utility section
    const endIndex = remaining.indexOf("function inicializarGrafoAccesible");

    let objectStr = remaining.substring(0, endIndex);
    // Trim back to the last semicolon or closing brace
    objectStr = objectStr.trim();
    // remove the "let grafoAccesible = " prefix
    objectStr = objectStr.substring("let grafoAccesible = ".length);

    // The string might end with comments or semicolons. 
    // We need to clean it up to be eval-able as an expression or statement.
    // It's safer to just eval the whole assignment: "global.grafo = { ... };"

    // Let's try to just eval the assignment
    eval("global.grafo = " + objectStr);

    const grafo = global.grafo;
    const errors = [];

    // 1. Build map of nodes
    const nodeMap = new Set();
    grafo.nodos.forEach(n => nodeMap.add(n.id));

    console.log(`Analyzing ${grafo.nodos.length} nodes...`);

    // 2. Check Edificios
    console.log("Checking Edificios...");
    for (const [id, nodeId] of Object.entries(grafo.edificios)) {
        if (!nodeMap.has(nodeId)) {
            errors.push(`[EDIFICIO] ID ${id} points to non-existent node '${nodeId}'`);
        }
    }

    // 3. Check Accesos
    console.log("Checking Accesos...");
    for (const [key, nodeId] of Object.entries(grafo.accesos)) {
        if (!nodeMap.has(nodeId)) {
            errors.push(`[ACCESO] '${key}' points to non-existent node '${nodeId}'`);
        }
    }

    // 4. Check Aristas
    console.log("Checking Aristas...");
    grafo.aristas.forEach((arista, idx) => {
        if (!nodeMap.has(arista.desde)) {
            errors.push(`[ARISTA ${idx}] 'desde' node '${arista.desde}' does not exist`);
        }
        if (!nodeMap.has(arista.hacia)) {
            errors.push(`[ARISTA ${idx}] 'hacia' node '${arista.hacia}' does not exist`);
        }

        // Check edificiosAccesibles
        if (arista.edificiosAccesibles) {
            // Check if these buildings exist in the buildings map? 
            // The buildings map keys are the IDs.
            // Arista.edificiosAccesibles contains numbers.
            arista.edificiosAccesibles.forEach(edId => {
                if (!grafo.edificios[edId]) {
                    // This is technically valid if the building isn't mapped to a node yet but exists in real life?
                    // But for our graph purposes, it probably should be in the map to be useful.
                    // Let's warn.
                    // Actually, checking references to building IDs is good.
                }
            });
        }
    });

    if (errors.length > 0) {
        console.log("\n❌ FOUND ERRORS:");
        errors.forEach(e => console.log(e));
    } else {
        console.log("\n✅ No errors found!");
    }

} catch (e) {
    console.error("Error executing script:", e);
}
