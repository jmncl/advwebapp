let ordersTable;
let viewingTrash = false;

$(document).ready(() => {
  if (!requireAdmin()) return;

  $('#toggle-trash-btn').on('click', toggleTrashView);
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
          : `<select class="form-control form-control-sm status-select" data-id="${row.id}">
              ${['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((s) =>
                `<option value="${s}" ${s === d ? 'selected' : ''}>${s}</option>`
              ).join('')}
            </select>`
      },
      {
        data: 'createdAt',
        render: (d) => new Date(d).toLocaleString()
      },
      {
        data: null,
        render: (d) => viewingTrash
          ? `<button class="btn btn-primary btn-sm restore-btn" data-id="${d.id}"><i class="fas fa-undo"></i> Restore</button>`
          : `<button class="btn btn-danger btn-sm delete-btn" data-id="${d.id}"><i class="fas fa-trash"></i></button>`
      }
    ],
    order: [[0, 'desc']]
  });

  $('#orders-table').on('change', '.status-select', function () {
    const id = $(this).data('id');
    const status = $(this).val();
    $.ajax({
      url: `${API_URL}/api/v1/orders/${id}/status`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${getToken()}` },
      contentType: 'application/json',
      data: JSON.stringify({ status }),
      success: () => Swal.fire({ icon: 'success', title: 'Status updated & email sent', timer: 1500, showConfirmButton: false }),
      error: (xhr) => Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Update failed' })
    });
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
