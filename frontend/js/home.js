const PER_PAGE = 8;
let allProducts = [];
let currentPage = 1;
let activeCategory = '';

$(document).ready(() => {
  updateNavbar();
  initAutocomplete();
  loadProducts();

  $(document).on('click', '.view-details-link, .view-details-btn', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const productId = $(this).attr('data-id');
    goToProduct(productId);
  });

  $(document).on('click', '.product-card .placeholder-img, .product-card img', function (e) {
    e.stopPropagation();
    const productId = $(this).closest('.product-card').attr('data-id');
    goToProduct(productId);
  });

  $(document).on('click', '.add-cart-btn', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const token = getToken();
    if (!token) { requireLogin(); return; }
    const productId = $(this).attr('data-id');
    $.ajax({
      url: `${API_URL}/api/v1/cart`,
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      contentType: 'application/json',
      data: JSON.stringify({ product_id: productId, quantity: 1 }),
      success: () => {
        Swal.fire({ icon: 'success', title: 'Added to cart!', timer: 1500, showConfirmButton: false });
        loadCartCount();
      },
      error: (xhr) => {
        if (xhr.status === 401) requireLogin();
        else Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Failed to add to cart' });
      }
    });
  });

  $('.filter-btn').on('click', function () {
    $('.filter-btn').removeClass('active');
    $(this).addClass('active');
    activeCategory = $(this).data('category') || '';
    currentPage = 1;
    loadProducts();
  });

  $('#search-btn').on('click', () => { currentPage = 1; loadProducts(); });
  $('#sort-select').on('change', () => { currentPage = 1; loadProducts(); });
  $('#min-price, #max-price').on('change', () => { currentPage = 1; loadProducts(); });
});

const initAutocomplete = () => {
  $('#search-input').autocomplete({
    source: (request, response) => {
      $.get(`${API_URL}/api/v1/products/search`, { q: request.term }, (data) => {
        response(data.rows.map((p) => ({
          label: `${p.name} (${p.item_code}) - ${formatPrice(p.unit_price)}`,
          value: p.name,
          id: p.id
        })));
      });
    },
    minLength: 2,
    select: (e, ui) => {
      if (ui.item.id) goToProduct(ui.item.id);
    }
  });
};

const loadProducts = () => {
  const params = {};
  const search = $('#search-input').val();
  const sort = $('#sort-select').val();
  const minPrice = $('#min-price').val();
  const maxPrice = $('#max-price').val();

  if (search) params.search = search;
  if (activeCategory) params.category = activeCategory;
  if (sort) params.sort = sort;
  if (minPrice) params.min_price = minPrice;
  if (maxPrice) params.max_price = maxPrice;

  $('#product-grid').html('<p class="loading-msg">Loading products...</p>');

  $.get(`${API_URL}/api/v1/products`, params, (data) => {
    allProducts = data.rows || [];
    renderPage();
  }).fail(() => {
    $('#product-grid').html('<p class="loading-msg">Could not load products. Is the backend running?</p>');
  });
};

const renderPage = () => {
  const start = (currentPage - 1) * PER_PAGE;
  const pageProducts = allProducts.slice(start, start + PER_PAGE);
  const $grid = $('#product-grid');
  $grid.empty();

  if (pageProducts.length === 0) {
    $grid.html('<p class="loading-msg">No products found.</p>');
    $('#pagination').empty();
    return;
  }

  const user = getUser();

  pageProducts.forEach((p) => {
    const imgHtml = productImage(p)
      ? `<img src="${productImage(p)}" alt="${p.name}">`
      : `<div class="placeholder-img"><i class="fas fa-shoe-prints"></i></div>`;

    const stockBadge = p.stock_quantity > 10
      ? '<span class="badge badge-success">In Stock</span>'
      : p.stock_quantity > 0
        ? '<span class="badge badge-warning">Low Stock</span>'
        : '<span class="badge badge-danger">Out of Stock</span>';

    const addCartBtn = user && p.stock_quantity > 0
      ? `<button class="btn btn-primary btn-sm add-cart-btn" data-id="${p.id}"><i class="fas fa-cart-plus"></i> Add to Cart</button>`
      : '';

    $grid.append(`
      <div class="product-card" data-id="${p.id}">
        ${imgHtml}
        <div class="card-body">
          <div class="product-name view-details-link" data-id="${p.id}" style="cursor:pointer;">${p.name}</div>
          <div class="product-category">${p.category} | Size: ${p.size || 'N/A'} | ${p.item_code}</div>
          <div class="product-price">${formatPrice(p.unit_price)}</div>
          ${stockBadge}
          <div class="product-actions">
            <a href="${pageUrl('product-detail.html')}?id=${p.id}#${p.id}" class="btn btn-outline btn-sm view-details-link" data-id="${p.id}">View Details</a>
            ${addCartBtn}
          </div>
        </div>
      </div>
    `);
  });

  renderPagination();
};

const renderPagination = () => {
  const totalPages = Math.ceil(allProducts.length / PER_PAGE);
  const $pag = $('#pagination');
  $pag.empty();
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    $pag.append(`<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`);
  }

  $('.page-btn').on('click', function () {
    currentPage = parseInt($(this).data('page'));
    renderPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
};
