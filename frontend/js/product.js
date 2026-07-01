$(document).ready(() => {
  updateNavbar();
  const id = getProductIdFromUrl();
  if (!id) {
    $('#product-loading').html('No product selected. <a href="index.html">Return to shop</a>');
    return;
  }
  loadProduct(id);
});

const loadProduct = (id) => {
  $('#product-loading').text('Loading product...');

  $.get(`${API_URL}/api/v1/products/${id}`, (data) => {
    const p = data.result;
    document.title = `${p.name} - Jordan Brand Store`;

    $('#product-loading').hide();
    $('#product-content').show();
    $('#product-name').text(p.name);
    $('#product-code').text(p.item_code);
    $('#product-category').text(p.category);
    $('#product-size').text(p.size || 'N/A');
    $('#product-price').text(formatPrice(p.unit_price));
    $('#product-desc').text(p.description || 'No description available.');
    $('#product-stock').text(p.stock_quantity > 0 ? `${p.stock_quantity} available` : 'Out of stock');

    if (productImage(p)) {
      $('#main-image').html(`<img src="${productImage(p)}" alt="${p.name}" style="width:100%;max-height:400px;object-fit:cover;border-radius:8px;">`);
    } else {
      $('#main-image').html(`<div class="placeholder-img" style="height:400px;border-radius:8px;"><i class="fas fa-shoe-prints"></i></div>`);
    }

    $('#photo-gallery').empty();
    if (p.ProductPhotos && p.ProductPhotos.length) {
      p.ProductPhotos.forEach((photo) => {
        $('#photo-gallery').append(`<img src="${API_URL}/${photo.photo_path}" alt="${p.name}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;cursor:pointer;margin:4px;">`);
      });
    }

    if (p.stock_quantity <= 0) {
      $('#add-cart-form').hide();
    } else {
      $('#add-cart-form').show();
    }

    $('#add-cart-form').off('submit').on('submit', (e) => {
      e.preventDefault();
      const token = requireLogin();
      if (!token) return;
      const qty = parseInt($('#qty').val()) || 1;
      $.ajax({
        url: `${API_URL}/api/v1/cart`,
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        contentType: 'application/json',
        data: JSON.stringify({ product_id: p.id, quantity: qty, size: p.size }),
        success: () => Swal.fire({ icon: 'success', title: 'Added to cart!' }).then(() => loadCartCount()),
        error: (xhr) => Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Failed' })
      });
    });
  }).fail(() => {
    $('#product-loading').html('Product not found. <a href="index.html">Return to shop</a>');
  });
};
