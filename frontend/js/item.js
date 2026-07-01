let productTable;
let viewingTrash = false;

const renderActions = (row) => {
  if (viewingTrash) {
    return `<button class="btn btn-primary btn-sm restore-btn" data-id="${row.id}"><i class="fas fa-undo"></i> Restore</button>`;
  }
  return `<button class="btn btn-secondary btn-sm edit-btn" data-id="${row.id}"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${row.id}"><i class="fas fa-trash"></i></button>`;
};

$(document).ready(() => {
  if (!requireAdmin()) return;
  initProductTable();

  $('#save-product-btn').on('click', saveProduct);
  $('#toggle-trash-btn').on('click', toggleTrashView);

  $('#productModal').on('hidden.bs.modal', () => {
    $('#product-form')[0].reset();
    $('#product-id').val('');
    $('#modal-title').text('Add Product');
  });
});

const toggleTrashView = () => {
  viewingTrash = !viewingTrash;
  $('#toggle-trash-btn').html(viewingTrash
    ? '<i class="fas fa-list"></i> View Active'
    : '<i class="fas fa-trash"></i> View Trash');
  $('#page-title').text(viewingTrash ? 'Trashed Products' : 'Product Management');
  $('#add-product-btn').toggle(!viewingTrash);
  productTable.destroy();
  initProductTable();
};

const getProductsUrl = () => `${API_URL}/api/v1/products/admin/all${viewingTrash ? '?trashed=1' : ''}`;

const initProductTable = () => {
  productTable = $('#products-table').DataTable({
    ajax: authAjax(getProductsUrl()),
    columns: [
      { data: 'id' },
      {
        data: 'image_url',
        render: (d) => d ? `<img src="${API_URL}/${d}" width="50" height="50" style="object-fit:cover;">` : '-'
      },
      { data: 'item_code' },
      { data: 'name' },
      { data: 'category' },
      { data: 'size', defaultContent: '-' },
      {
        data: 'unit_price',
        render: (d) => formatPrice(d)
      },
      { data: 'stock_quantity' },
      {
        data: 'is_active',
        render: (d) => d ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'
      },
      {
        data: null,
        orderable: false,
        render: (d, t, row) => renderActions(row)
      }
    ],
    order: [[0, 'desc']]
  });

  $('#products-table').on('click', '.edit-btn', function () {
    const id = $(this).data('id');
    $.ajax({
      url: `${API_URL}/api/v1/products/admin/${id}`,
      headers: { Authorization: `Bearer ${getToken()}` },
      success: (data) => {
        const p = data.result;
        $('#product-id').val(p.id);
        $('#item_code').val(p.item_code);
        $('#name').val(p.name);
        $('#category').val(p.category);
        $('#size').val(p.size);
        $('#unit_price').val(p.unit_price);
        $('#description').val(p.description);
        $('#stock_quantity').val(p.stock_quantity);
        $('#is_active').val(p.is_active);
        $('#modal-title').text('Edit Product');
        $('#productModal').modal('show');
      }
    });
  });

  $('#products-table').on('click', '.delete-btn', function () {
    const id = $(this).data('id');
    Swal.fire({
      title: 'Move to trash?',
      text: 'You can restore this product later.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ce1141'
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: `${API_URL}/api/v1/products/${id}`,
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` },
          success: () => { productTable.ajax.reload(); Swal.fire('Moved to trash', '', 'success'); }
        });
      }
    });
  });

  $('#products-table').on('click', '.restore-btn', function () {
    const id = $(this).data('id');
    $.ajax({
      url: `${API_URL}/api/v1/products/${id}/restore`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${getToken()}` },
      success: () => { productTable.ajax.reload(); Swal.fire('Restored!', 'Product is active again.', 'success'); }
    });
  });
};

const saveProduct = () => {
  const id = $('#product-id').val();
  const item_code = $('#item_code').val().trim();
  const name = $('#name').val().trim();
  const category = $('#category').val();
  const unit_price = $('#unit_price').val();

  if (!item_code || !name || !category || !unit_price) {
    Swal.fire({ icon: 'error', text: 'Please fill required fields.' });
    return;
  }

  const formData = new FormData();
  formData.append('item_code', item_code);
  formData.append('name', name);
  formData.append('category', category);
  formData.append('size', $('#size').val());
  formData.append('unit_price', unit_price);
  formData.append('description', $('#description').val());
  formData.append('stock_quantity', $('#stock_quantity').val() || 0);
  formData.append('is_active', $('#is_active').val());

  const imageFile = $('#image')[0].files[0];
  if (imageFile) formData.append('image', imageFile);

  $.ajax({
    url: id ? `${API_URL}/api/v1/products/${id}` : `${API_URL}/api/v1/products`,
    method: id ? 'PUT' : 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    data: formData,
    processData: false,
    contentType: false,
    success: () => {
      $('#productModal').modal('hide');
      productTable.ajax.reload();
      Swal.fire({ icon: 'success', title: 'Product saved!' });
    },
    error: (xhr) => Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Save failed' })
  });
};
