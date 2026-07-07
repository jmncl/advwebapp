let allOrders = [];
let loadedCount = 0;
const BATCH = 5;

$(document).ready(() => {
  updateNavbar();
  const token = requireCustomer();
  if (!token) return;
  loadOrders();

  $(window).on('scroll', () => {
    if ($(window).scrollTop() + $(window).height() >= $(document).height() - 100) {
      appendOrders();
    }
  });
});

const loadOrders = () => {
  $.ajax({
    url: `${API_URL}/api/v1/orders/my`,
    headers: { Authorization: `Bearer ${getToken()}` },
    success: (data) => {
      allOrders = data.rows || [];
      loadedCount = 0;
      $('#orders-list').empty();
      if (allOrders.length === 0) {
        $('#orders-list').html('<p class="loading-msg">No orders yet.</p>');
        return;
      }
      appendOrders();
    },
    error: (xhr) => {
      const message = xhr.responseJSON?.message || xhr.responseJSON?.error || 'Could not load your orders';
      $('#orders-list').html(`<p class="loading-msg">${message}</p>`);
      if (xhr.status === 401) {
        Swal.fire({ icon: 'warning', text: 'Please log in again.' })
          .then(() => { window.location.href = pageUrl('login.html'); });
      }
    }
  });
};

const appendOrders = () => {
  if (loadedCount >= allOrders.length) return;
  const batch = allOrders.slice(loadedCount, loadedCount + BATCH);
  loadedCount += batch.length;

  batch.forEach((order) => {
    const statusClass = {
      Pending: 'badge-warning',
      Processing: 'badge-warning',
      Shipped: 'badge-success',
      Delivered: 'badge-success',
      Cancelled: 'badge-danger'
    }[order.status] || 'badge-warning';

    let itemsHtml = '';
    (order.OrderItems || []).forEach((item) => {
      const subtotal = item.computed_subtotal ?? (parseFloat(item.Product?.unit_price || 0) * item.quantity);
      itemsHtml += `<li>${item.Product?.name || 'Product'} x${item.quantity} - ${formatPrice(subtotal)}</li>`;
    });

    $('#orders-list').append(`
      <div class="order-card" data-order-id="${order.id}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
          <strong>Order #${order.id}</strong>
          <span class="badge ${statusClass}">${order.status}</span>
        </div>
        <small>${new Date(order.createdAt).toLocaleString()}</small>
        <ul style="margin:0.5rem 0;padding-left:1.2rem;">${itemsHtml}</ul>
        <strong>Total: ${formatPrice(order.computed_total)}</strong>
        <div class="text-muted small mt-1">Click to view details</div>
      </div>
    `);
  });
};

const viewMyOrder = (id) => {
  $.ajax({
    url: `${API_URL}/api/v1/orders/${id}`,
    headers: { Authorization: `Bearer ${getToken()}` },
    success: (data) => {
      const order = data.order;
      let itemsHtml = '';
      (order.OrderItems || []).forEach((item) => {
        itemsHtml += `<li>${item.Product?.name || 'Product'} x${item.quantity} - ${formatPrice(item.computed_subtotal)}</li>`;
      });

      Swal.fire({
        title: `Order #${order.id}`,
        html: `
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Shipping:</strong> ${order.shipping_address || '-'}</p>
          <p><strong>Payment:</strong> ${order.payment_method || '-'}</p>
          <ul style="text-align:left;">${itemsHtml}</ul>
          <p><strong>Total:</strong> ${formatPrice(order.computed_total)}</p>
        `,
        width: 520
      });
    },
    error: (xhr) => Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Could not load order' })
  });
};

$(document).on('click', '.order-card', function () {
  const id = $(this).data('order-id');
  if (id) viewMyOrder(id);
});
