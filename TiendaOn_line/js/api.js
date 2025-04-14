const API_URL = 'https://api.escuelajs.co/api/v1/products';

function obtenerProductos(offset = 0, limit = 8) {
  return $.get(`${API_URL}?offset=${offset}&limit=${limit}`);
}

function obtenerCategorias() {
  return $.get('https://api.escuelajs.co/api/v1/categories');
}

function obtenerProductosPorCategoria(categoriaId, offset = 0, limit = 8) {
  return $.get(`https://api.escuelajs.co/api/v1/categories/${categoriaId}/products?offset=${offset}&limit=${limit}`);
}

function obtenerProductoPorId(id) {
  return $.get(`https://api.escuelajs.co/api/v1/products/${id}`);
}

function obtenerUsuarios() {
  return $.get('https://api.escuelajs.co/api/v1/users');
}
