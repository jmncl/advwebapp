$(document).ready(() => {
  updateNavbar();
  const id = getProductIdFromUrl();
  if (!id) {
    $('#product-loading').html('No product selected. <a href="index.html">Return to shop</a>');
    return;
  }
  loadProduct(id);

  $('#gallery-prev').on('click', () => scrollThumbs(-1));
  $('#gallery-next').on('click', () => scrollThumbs(1));
  $('#photo-gallery').on('scroll', updateGalleryNav);
});

const setMainImage = (src, alt) => {
  if (src) {
    $('#main-image').html(`<img src="${src}" alt="${alt || 'Product image'}">`);
  } else {
    $('#main-image').html('<div class="placeholder-img gallery-placeholder"><i class="fas fa-shoe-prints"></i></div>');
  }
};

const setActiveThumb = (index) => {
  $('#photo-gallery .gallery-thumb').removeClass('active');
  $(`#photo-gallery .gallery-thumb[data-index="${index}"]`).addClass('active');
};

const selectGalleryImage = (index) => {
  const $thumb = $(`#photo-gallery .gallery-thumb[data-index="${index}"]`);
  if (!$thumb.length) return;

  const src = $thumb.data('src');
  const alt = $thumb.data('alt');
  setMainImage(src, alt);
  setActiveThumb(index);
  $thumb[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
};

const buildGalleryImages = (product) => {
  const images = [];
  const seen = new Set();

  const cover = productImage(product);
  if (cover) {
    images.push({ src: cover, alt: product.name });
    seen.add(cover);
  }

  (product.ProductPhotos || []).forEach((photo) => {
    const src = `${API_URL}/${photo.photo_path}`;
    if (!seen.has(src)) {
      images.push({ src, alt: product.name });
      seen.add(src);
    }
  });

  return images;
};

const renderGallery = (product) => {
  const images = buildGalleryImages(product);
  const $gallery = $('#photo-gallery').empty();

  if (!images.length) {
    setMainImage(null);
    $('.gallery-thumbs-wrap').hide();
    return;
  }

  $('.gallery-thumbs-wrap').show();
  setMainImage(images[0].src, images[0].alt);

  images.forEach((image, index) => {
    const $thumb = $(`
      <button type="button" class="gallery-thumb${index === 0 ? ' active' : ''}"
              data-index="${index}" data-src="${image.src}" data-alt="${image.alt}"
              aria-label="View image ${index + 1}">
        <img src="${image.src}" alt="${image.alt}">
      </button>
    `);

    $thumb.on('mouseenter click', (e) => {
      e.preventDefault();
      selectGalleryImage(index);
    });

    $gallery.append($thumb);
  });

  updateGalleryNav();
};

const scrollThumbs = (direction) => {
  const $track = $('#photo-gallery');
  $track[0].scrollBy({ left: direction * 220, behavior: 'smooth' });
};

const updateGalleryNav = () => {
  const $track = $('#photo-gallery')[0];
  if (!$track) return;

  const maxScroll = $track.scrollWidth - $track.clientWidth;
  $('#gallery-prev').prop('disabled', $track.scrollLeft <= 0);
  $('#gallery-next').prop('disabled', $track.scrollLeft >= maxScroll - 1);
};

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

    renderGallery(p);

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
