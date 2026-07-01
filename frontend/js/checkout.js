$(document).ready(() => {
  updateNavbar();
  const token = requireLogin();
  if (!token) return;
  loadCheckoutSummary();

  $('#checkout-form').on('submit', (e) => {
    e.preventDefault();
    const address = $('#shipping-address').val().trim();
    const payment = $('#payment-method').val();

    if (!address) { $('#address-error').show(); return; }
    $('#address-error').hide();

    $.ajax({
      url: `${API_URL}/api/v1/cart`,
      headers: { Authorization: `Bearer ${token}` },
      success: (cartData) => {
        const cart = (cartData.rows || []).map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size
        }));

        if (cart.length === 0) {
          Swal.fire({ icon: 'warning', text: 'Your cart is empty.' });
          return;
        }

        $.ajax({
          url: `${API_URL}/api/v1/orders`,
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          contentType: 'application/json',
          data: JSON.stringify({ cart, shipping_address: address, payment_method: payment }),
          success: () => {
            $.ajax({
              url: `${API_URL}/api/v1/cart`,
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
              complete: () => {
                Swal.fire({ icon: 'success', title: 'Order placed!' }).then(() => {
                  window.location.href = 'orders.html';
                });
              }
            });
          },
          error: (xhr) => Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Checkout failed' })
        });
      }
    });
  });
});

const loadCheckoutSummary = () => {
  $.ajax({
    url: `${API_URL}/api/v1/cart`,
    headers: { Authorization: `Bearer ${getToken()}` },
    success: (data) => {
      const items = data.rows || [];
      let total = 0;
      const $list = $('#summary-list');
      $list.empty();

      items.forEach((item) => {
        const subtotal = parseFloat(item.Product.unit_price) * item.quantity;
        total += subtotal;
        $list.append(`<li>${item.Product.name} x${item.quantity} - ${formatPrice(subtotal)}</li>`);
      });

      $('#summary-total').text(formatPrice(total));
    }
  });
};
