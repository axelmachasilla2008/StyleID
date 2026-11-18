// =====================================================
// Datos del catálogo compartidos con la tienda de React.
// El archivo original vive en frontend/src/data/catalogo.js (módulo ES);
// Node 22.12+ permite cargarlo con require().
// =====================================================
const path = require('path');

module.exports = require(path.join(__dirname, '..', 'frontend', 'src', 'data', 'catalogo.js'));
