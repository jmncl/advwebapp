$(document).ready(() => {
  updateNavbar();
  const token = requireLogin();
  if (!token) return;
  loadCart();
});

const loadCart = () => {
  const token = getToken();
  $.ajax({
    url: `${API_URL}/api/v1/cart`,
    headers: { Authorization: `Bearer ${token}` },
    success: (data) => {
      const items = data.rows || [];
      const $tbody = $('#cart-body');
      $tbody.empty();
      let total = 0;

      if (items.length === 0) {
        $tbody.html('<tr><td colspan="6" class="text-center">Your cart is empty.</td></tr>');
        $('#cart-total').text('₱0.00');
        $('#checkout-btn').hide();
        return;
      }

      items.forEach((item) => {
        const p = item.Product;
        const subtotal = parseFloat(p.unit_price) * item.quantity;
        total += subtotal;
        const img = productImage(p)
          ? `<img src="${productImage(p)}" width="60" height="60" style="object-fit:cover;border-radius:4px;">`
          : '<i class="fas fa-shoe-prints fa-2x"></i>';

        $tbody.append(`
          <tr data-id="${item.id}">
            <td>${img}</td>
            <td>${p.name}<br><small>${p.item_code}</small></td>
            <td>${formatPrice(p.unit_price)}</td>
            <td><input type="number" class="form-control qty-input" value="${item.quantity}" min="1" style="width:70px;"></td>
            <td>${formatPrice(subtotal)}</td>
            <td><button class="btn btn-danger btn-sm remove-btn"><i class="fas fa-trash"></i></button></td>
          </tr>
        `);
      });

      $('#cart-total').text(formatPrice(total));
      $('#checkout-btn').show();

      $('.qty-input').on('change', function () {
        const id = $(this).closest('tr').data('id');
        const qty = parseInt($(this).val());
        if (qty < 1) return;
        $.ajax({
          url: `${API_URL}/api/v1/cart/${id}`,
          method: 'PUT',
          headers: { Authorization: `Bearer ${getToken()}` },
          contentType: 'application/json',
          data: JSON.stringify({ quantity: qty }),
          success: () => loadCart()
        });
      });

      $('.remove-btn').on('click', function () {
        const id = $(this).closest('tr').data('id');
        $.ajax({
          url: `${API_URL}/api/v1/cart/${id}`,
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` },
          success: () => { loadCart(); loadCartCount(); }
        });
      });
    }
  });
};
