let ordersTable;
let viewingTrash = false;

const resetOrderForm = () => {
  const validator = $('#order-form').data('validator');
  if (validator) validator.resetForm();
  $('#order-form')[0].reset();
};

const initOrderValidation = () => {
  $('#order-form').validate({
    rules: {
      status: { required: true },
      admin_note: { required: true, minlength: 5, maxlength: 300 }
    },
    messages: {
      status: { required: 'Please select an order status' },
      admin_note: {
        required: 'Admin note is required',
        minlength: 'Admin note must be at least 5 characters'
      }
    },
    errorElement: 'div',
    errorClass: 'text-danger small mt-1',
    submitHandler: () => updateOrderStatus()
  });
};

const openOrderModal = (order) => {
  resetOrderForm();
  $('#order-id').val(order.id);
  $('#order-display-id').val(`#${order.id}`);
  $('#order-status').val(order.status);
  $('#order-note').val(order.admin_note || '');
  $('#orderModal').modal('show');
};

const viewOrder = (id) => {
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
          <p><strong>Customer:</strong> ${order.User?.name || '-'} (${order.User?.email || '-'})</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Shipping:</strong> ${order.shipping_address || '-'}</p>
          <p><strong>Payment:</strong> ${order.payment_method || '-'}</p>
          ${order.admin_note ? `<p><strong>Admin note:</strong> ${order.admin_note}</p>` : ''}
          <ul style="text-align:left;">${itemsHtml}</ul>
          <p><strong>Total:</strong> ${formatPrice(order.computed_total)}</p>
        `,
        width: 600
      });
    },
    error: (xhr) => Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Could not load order' })
  });
};

const updateOrderStatus = () => {
  const id = $('#order-id').val();
  const status = $('#order-status').val();
  const admin_note = $('#order-note').val().trim();

  $.ajax({
    url: `${API_URL}/api/v1/orders/${id}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${getToken()}` },
    contentType: 'application/json',
    data: JSON.stringify({ status, admin_note }),
    success: () => {
      $('#orderModal').modal('hide');
      ordersTable.ajax.reload();
      Swal.fire({ icon: 'success', title: 'Status updated & email sent', timer: 1500, showConfirmButton: false });
    },
    error: (xhr) => Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Update failed' })
  });
};

$(document).ready(() => {
  if (!requireAdmin()) return;

  initOrderValidation();
  $('#toggle-trash-btn').on('click', toggleTrashView);
  $('#orderModal').on('hidden.bs.modal', resetOrderForm);
  initOrdersTable();
});

const toggleTrashView = () => {
  viewingTrash = !viewingTrash;
  $('#toggle-trash-btn').html(viewingTrash
    ? '<i class="fas fa-list"></i> View Active'
    : '<i class="fas fa-trash"></i> View Trash');
  $('#page-title').text(viewingTrash ? 'Trashed Orders' : 'Order Management');
  ordersTable.ajax.url(getOrdersUrl()).load();
};

const getOrdersUrl = () => `${API_URL}/api/v1/orders${viewingTrash ? '?trashed=1' : ''}`;

const initOrdersTable = () => {
  ordersTable = $('#orders-table').DataTable({
    ajax: authAjax(getOrdersUrl()),
    columns: [
      { data: 'id' },
      {
        data: 'User',
        render: (d) => d ? `${d.name}<br><small>${d.email}</small>` : '-'
      },
      {
        data: null,
        render: (d) => formatPrice(d.computed_total)
      },
      {
        data: 'status',
        render: (d, t, row) => viewingTrash
          ? `<span class="badge badge-warning">${d}</span>`
          : `<span class="badge badge-warning mr-2">${d}</span>
             <button class="btn btn-secondary btn-sm edit-status-btn" data-id="${row.id}"><i class="fas fa-edit"></i> Update</button>`
      },
      {
        data: 'createdAt',
        render: (d) => new Date(d).toLocaleString()
      },
      {
        data: null,
        render: (d) => viewingTrash
          ? `<button class="btn btn-primary btn-sm restore-btn" data-id="${d.id}"><i class="fas fa-undo"></i> Restore</button>`
          : `<button class="btn btn-info btn-sm view-btn" data-id="${d.id}"><i class="fas fa-eye"></i></button>
             <button class="btn btn-danger btn-sm delete-btn" data-id="${d.id}"><i class="fas fa-trash"></i></button>`
      }
    ],
    order: [[0, 'desc']]
  });

  $('#orders-table').on('click', '.view-btn', function () {
    viewOrder($(this).data('id'));
  });

  $('#orders-table').on('click', '.edit-status-btn', function () {
    const id = $(this).data('id');
    const row = ordersTable.rows().data().toArray().find((o) => String(o.id) === String(id));
    if (row) openOrderModal(row);
  });

  $('#orders-table').on('click', '.delete-btn', function () {
    const id = $(this).data('id');
    Swal.fire({
      title: 'Move order to trash?',
      text: 'You can restore it later.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ce1141'
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: `${API_URL}/api/v1/orders/${id}`,
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` },
          success: () => { ordersTable.ajax.reload(); Swal.fire('Moved to trash', '', 'success'); }
        });
      }
    });
  });

  $('#orders-table').on('click', '.restore-btn', function () {
    const id = $(this).data('id');
    $.ajax({
      url: `${API_URL}/api/v1/orders/${id}/restore`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${getToken()}` },
      success: () => { ordersTable.ajax.reload(); Swal.fire('Restored!', '', 'success'); }
    });
  });
};
