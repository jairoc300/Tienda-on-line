$(document).ready(function () {
  let pagina = 0;
  const limite = 8;
  let cargando = false;
  let finDeProductos = false;
  let categoriaSeleccionada = null;
  let orden = 'asc';
  let carrito = cargarCarritoLocal();

  function guardarCarritoLocal() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
  }

  function cargarCarritoLocal() {
    const guardado = localStorage.getItem('carrito');
    return guardado ? JSON.parse(guardado) : [];
  }

  function actualizarCarritoUI() {
    $('#cantidad-carrito').text(carrito.reduce((acc, item) => acc + item.cantidad, 0));
    guardarCarritoLocal();
  }

  function mostrarCarrito() {
    $('#contenedor-productos').empty();
    $('#preload').hide();

    if (carrito.length === 0) {
      $('#contenedor-productos').html('<p>El carrito está vacío.</p>');
      return;
    }

    let total = 0;
    let html = `
      <div id="carrito">
        <h2>Carrito de compras</h2>
        <button id="vaciar-carrito" style="margin-bottom: 1em; background-color: crimson; color: white; border: none; padding: 0.5em 1em; cursor: pointer;">Vaciar carrito</button>
        <button id="finalizar-pedido" style="margin-left: 1em; background-color: green; color: white; border: none; padding: 0.5em 1em; cursor: pointer;">Finalizar pedido</button>
    `;

    carrito.forEach((item, index) => {
      const subtotal = item.price * item.cantidad;
      total += subtotal;

      html += `
        <div class="carrito-item">
          <span>${item.title} - ${item.price}$ × </span>
          <input type="number" min="1" value="${item.cantidad}" data-index="${index}" class="cantidad-input"/>
          <span>= ${subtotal.toFixed(2)}$</span>
          <button class="eliminar-item" data-index="${index}">🗑️</button>
        </div>
      `;
    });

    html += `<h3>Total: ${total.toFixed(2)} $</h3></div>`;

    $('#contenedor-productos').html(html);
  }

  function agregarAlCarrito(producto) {
    const existente = carrito.find(p => p.id === producto.id);
    if (existente) {
      existente.cantidad++;
    } else {
      carrito.push({ ...producto, cantidad: 1 });
    }
    actualizarCarritoUI();
  }

  function mostrarDetalleProducto(id) {
    $('#contenedor-productos').empty();
    $('#preload').show();

    obtenerProductoPorId(id)
      .done(producto => {
        $('#preload').hide();

        const imagen = (producto.images && producto.images[0] && producto.images[0].startsWith('http'))
          ? producto.images[0]
          : 'https://placehold.co/300x300?text=No+Image';

        const html = `
          <div class="detalle-producto" style="text-align: center;">
            <img src="${imagen}" alt="${producto.title}" style="width: 300px; height: auto;"/>
            <h2>${producto.title}</h2>
            <p><strong>Precio:</strong> ${producto.price} $</p>
            <p><strong>Categoría:</strong> ${producto.category.name}</p>
            <p><strong>Descripción:</strong><br>${producto.description}</p>
            <p><strong>Creado:</strong> ${new Date(producto.creationAt).toLocaleDateString()}</p>
            <button class="btn-agregar" data-id="${producto.id}" data-title="${producto.title}" data-price="${producto.price}" style="margin-top: 1em;">Agregar al carrito</button>
          </div>
        `;

        $('#contenedor-productos').html(html);
      })
      .fail(() => {
        $('#contenedor-productos').html('<p>Error al cargar el producto.</p>');
      });
  }

  function cargarProductos() {
    if (cargando || finDeProductos) return;

    cargando = true;
    $('#preload').show();

    const offset = pagina * limite;
    const peticion = categoriaSeleccionada
      ? obtenerProductosPorCategoria(categoriaSeleccionada, offset, limite)
      : obtenerProductos(offset, limite);

    peticion
      .done(data => {
        if (data.length === 0) {
          finDeProductos = true;
          $('#preload').text('No hay más productos para mostrar.');
          return;
        }

        data.sort((a, b) => orden === 'asc' ? a.price - b.price : b.price - a.price);

        data.forEach(producto => {
          let imagenValida = 'https://placehold.co/100x100?text=No+Image';

          if (producto.images && producto.images.length > 0) {
            const url = producto.images[0];
            if (typeof url === 'string' && url.startsWith('http')) {
              imagenValida = url;
            }
          }

          const item = `
            <div class="producto">
              <div style="display: flex; align-items: center;">
                <img src="${imagenValida}" alt="${producto.title}"
                     onerror="this.onerror=null; this.src='https://placehold.co/100x100?text=No+Image';">
                <div>
                  <h3 class="ver-detalle" data-id="${producto.id}" style="cursor: pointer; color: blue; text-decoration: underline;">
                    ${producto.title}
                  </h3>
                  <p>${producto.description}</p>
                  <strong>${producto.price} $</strong>
                </div>
              </div>
              <button class="btn-agregar" data-id="${producto.id}" data-title="${producto.title}" data-price="${producto.price}">Agregar</button>
            </div>
          `;
          $('#contenedor-productos').append(item);
        });

        pagina++;
      })
      .fail(() => {
        $('#preload').text('Error al cargar productos.');
      })
      .always(() => {
        cargando = false;
        if (!finDeProductos) $('#preload').hide();
      });
  }

  function cargarCategorias() {
    obtenerCategorias()
      .done(categorias => {
        categorias.forEach(cat => {
          const option = $(`<option value="${cat.id}">${cat.name}</option>`);
          $('#select-categorias').append(option);
        });
      });
  }

  function guardarUsuarioLocal(usuario) {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }
  
  function cargarUsuarioLocal() {
    const data = localStorage.getItem('usuario');
    return data ? JSON.parse(data) : null;
  }
  
  function eliminarUsuarioLocal() {
    localStorage.removeItem('usuario');
  }

  function actualizarUIUsuario() {
    const usuario = cargarUsuarioLocal();
    if (usuario) {
      $('#usuario-logueado').text(`👤 ${usuario.name}`);
      $('#btn-login').hide();
      $('#btn-logout').show();
    } else {
      $('#usuario-logueado').text('');
      $('#btn-login').show();
      $('#btn-logout').hide();
    }
  }
  
  function mostrarLogin() {
    $('#contenedor-productos').empty();
    $('#preload').hide();
  
    const html = `
      <div style="max-width: 400px; margin: 0 auto;">
        <h2>Iniciar sesión</h2>
        <input type="email" id="login-email" placeholder="Email" style="width: 100%; padding: 0.5em;" /><br><br>
        <button id="btn-submit-login" style="width: 100%;">Ingresar</button>
        <p style="margin-top: 1em;">¿No tienes cuenta? <a href="#" id="link-registro">Regístrate</a></p>
      </div>
    `;
    $('#contenedor-productos').html(html);
  }

  function mostrarRegistro() {
    const html = `
      <div style="max-width: 400px; margin: 0 auto;">
        <h2>Registro</h2>
        <input type="text" id="registro-nombre" placeholder="Nombre" style="width: 100%; padding: 0.5em;" /><br><br>
        <input type="email" id="registro-email" placeholder="Email" style="width: 100%; padding: 0.5em;" /><br><br>
        <button id="btn-submit-registro" style="width: 100%;">Registrarme</button>
        <p style="margin-top: 1em;">¿Ya tienes cuenta? <a href="#" id="link-login">Iniciar sesión</a></p>
      </div>
    `;
    $('#contenedor-productos').html(html);
  }

  function mostrarMensaje(texto, tipo = 'info') {
    const colores = {
      info: '#2196F3',
      success: '#4CAF50',
      error: '#F44336'
    };
  
    $('#mensaje')
      .css('background-color', colores[tipo])
      .css('color', '#fff')
      .text(texto)
      .fadeIn();
  
    setTimeout(() => {
      $('#mensaje').fadeOut();
    }, 3000);
  }  

  // Scroll infinito
  $(window).on('scroll', function () {
    const bottomOffset = 300;
    if ($(window).scrollTop() + $(window).height() > $(document).height() - bottomOffset) {
      cargarProductos();
    }
  });

  // Eventos
  $('#ver-productos').on('click', function (e) {
    e.preventDefault();
    categoriaSeleccionada = null;
    pagina = 0;
    finDeProductos = false;
    $('#contenedor-productos').empty();
    cargarProductos();
  });

  $('#select-categorias').on('change', function () {
    categoriaSeleccionada = $(this).val() || null;
    pagina = 0;
    finDeProductos = false;
    $('#contenedor-productos').empty();
    cargarProductos();
  });

  $('#orden-precio').on('change', function () {
    orden = $(this).val();
    pagina = 0;
    finDeProductos = false;
    $('#contenedor-productos').empty();
    cargarProductos();
  });

  $('#ver-carrito').on('click', function (e) {
    e.preventDefault();
    mostrarCarrito();
  });

  $(document).on('click', '.btn-agregar', function () {
    const producto = {
      id: $(this).data('id'),
      title: $(this).data('title'),
      price: parseFloat($(this).data('price'))
    };
    agregarAlCarrito(producto);
  });

  $(document).on('click', '.cantidad-input', function () {
    const index = $(this).data('index');
    const nuevaCantidad = parseInt($(this).val());
    if (nuevaCantidad > 0) {
      carrito[index].cantidad = nuevaCantidad;
      actualizarCarritoUI();
      mostrarCarrito();
    }
  });

  $(document).on('click', '.eliminar-item', function () {
    const index = $(this).data('index');
    carrito.splice(index, 1);
    actualizarCarritoUI();
    mostrarCarrito();
  });

  $(document).on('click', '#vaciar-carrito', function () {
    carrito = [];
    actualizarCarritoUI();
    mostrarCarrito();
  });

  // Clic en el nombre del producto para ver detalle
  $(document).on('click', '.ver-detalle', function () {
    const id = $(this).data('id');
    mostrarDetalleProducto(id);
  });

  // Abrir login
  $('#btn-login').on('click', function (e) {
    e.preventDefault();
    mostrarLogin();
  });

  // Cerrar sesión
  $('#btn-logout').on('click', function (e) {
    e.preventDefault();
    eliminarUsuarioLocal();
    actualizarUIUsuario();
    $('#contenedor-productos').empty();
    cargarProductos();
  });

  // Link a registro
  $(document).on('click', '#link-registro', function (e) {
    e.preventDefault();
    mostrarRegistro();
  });

  // Link a login desde registro
  $(document).on('click', '#link-login', function (e) {
    e.preventDefault();
    mostrarLogin();
  });
  // Login usando usuarios reales
  $(document).on('click', '#btn-submit-login', function () {
    const email = $('#login-email').val().trim().toLowerCase();
  
    obtenerUsuarios().done(usuarios => {
      const encontrado = usuarios.find(u => u.email.toLowerCase() === email);
  
      if (encontrado) {
        guardarUsuarioLocal(encontrado);
        actualizarUIUsuario();
        mostrarMensaje('Sesión iniciada correctamente.', 'success');
        $('#contenedor-productos').html('');
      } else {
        mostrarMensaje('Usuario no encontrado.', 'error');
      }
    }).fail(() => {
      alert('Error al verificar usuarios.');
    });
  });

  // Registro simulado
  $(document).on('click', '#btn-submit-registro', function () {
    const nombre = $('#registro-nombre').val().trim();
    const email = $('#registro-email').val().trim().toLowerCase();
  
    if (!nombre || !email) {
      mostrarMensaje('Rellena todos los campos.', 'error');
      return;
    }
  
    const nuevoUsuario = {
      name: nombre,
      email: email
    };
  
    // Simulo el guardado y redirije al login
    mostrarMensaje('Usuario registrado (simulado). Ahora puedes iniciar sesión.', 'success');
    mostrarLogin();
  });

  // Finalizar pedido
  $(document).on('click', '#finalizar-pedido', function () {
    if (carrito.length === 0) {
      mostrarMensaje('Tu carrito está vacío.', 'info');
      return;
    }

    let total = 0;
    let resumen = `
      <div style="text-align: center;">
        <h2>Resumen de compra</h2>
        <ul style="list-style: none; padding: 0;">
    `;

    carrito.forEach(item => {
      const subtotal = item.price * item.cantidad;
      total += subtotal;
      resumen += `<li>${item.title} × ${item.cantidad} = ${subtotal.toFixed(2)} $</li>`;
    });

    resumen += `</ul><h3>Total pagado: ${total.toFixed(2)} $</h3></div>`;

    carrito = [];
    actualizarCarritoUI();
    $('#contenedor-productos').html(resumen);
  });

  // Inicializar
  cargarCategorias();
  cargarProductos();
  actualizarCarritoUI();
  actualizarUIUsuario();
});
