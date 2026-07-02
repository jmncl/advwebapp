let productTable;
let viewingTrash = false;

const renderActions = (row) => {
  if (viewingTrash) {
    return `<button class="btn btn-primary btn-sm restore-btn" data-id="${row.id}"><i class="fas fa-undo"></i> Restore</button>`;
  }
  return `<button class="btn btn-secondary btn-sm edit-btn" data-id="${row.id}"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${row.id}"><i class="fas fa-trash"></i></button>`;
};

const resetProductForm = () => {
  const validator = $('#product-form').data('validator');
  if (validator) validator.resetForm();
  $('#product-form')[0].reset();
  $('#product-id').val('');
  $('#modal-title').text('Add Product');
  $('#photo-preview, #existing-photos').empty();
};

const renderExistingPhotos = (photos) => {
  const $wrap = $('#existing-photos').empty();
  if (!photos || !photos.length) return;

  $wrap.append('<small class="text-muted d-block mb-2">Existing gallery photos:</small>');
  photos.forEach((photo) => {
    $wrap.append(`<img src="${API_URL}/${photo.photo_path}" alt="Product photo" class="photo-thumb">`);
  });
};

const renderPhotoPreview = () => {
  const $preview = $('#photo-preview').empty();
  const files = $('#photos')[0].files;
  if (!files.length) return;

  $preview.append('<small class="text-muted d-block mb-2">New photos to upload:</small>');
  Array.from(files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      $preview.append(`<img src="${e.target.result}" alt="Preview" class="photo-thumb">`);
    };
    reader.readAsDataURL(file);
  });
};

const uploadGalleryPhotos = (productId) => {
  const files = $('#photos')[0].files;
  if (!files.length) return $.Deferred().resolve().promise();

  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append('photos', file));

  return $.ajax({
    url: `${API_URL}/api/v1/products/${productId}/photos`,
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    data: formData,
    processData: false,
    contentType: false
  });
};

const initProductValidation = () => {
  $.validator.addMethod('maxFileCount', (value, element, param) => {
    return !element.files || element.files.length <= param;
  }, 'You can upload at most {0} photos.');

  $('#product-form').validate({
    rules: {
      item_code: { required: true, minlength: 3, maxlength: 30 },
      name: { required: true, minlength: 2, maxlength: 120 },
      category: { required: true },
      unit_price: { required: true, number: true, min: 0.01 },
      stock_quantity: { number: true, min: 0 },
      image: { extension: 'jpg|jpeg|png|gif|webp' },
      photos: { extension: 'jpg|jpeg|png|gif|webp', maxFileCount: 10 }
    },
    messages: {
      item_code: { required: 'Item code is required', minlength: 'Item code must be at least 3 characters' },
      name: { required: 'Product name is required' },
      category: { required: 'Please select a category' },
      unit_price: { required: 'Price is required', min: 'Price must be greater than zero' }
    },
    errorElement: 'div',
    errorClass: 'text-danger small mt-1',
    submitHandler: () => saveProduct()
  });
};

$(document).ready(() => {
  if (!requireAdmin()) return;
  initProductValidation();
  initProductTable();

  $('#photos').on('change', renderPhotoPreview);
  $('#toggle-trash-btn').on('click', toggleTrashView);

  $('#productModal').on('hidden.bs.modal', resetProductForm);
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
        resetProductForm();
        $('#product-id').val(p.id);
        $('#item_code').val(p.item_code);
        $('#name').val(p.name);
        $('#category').val(p.category);
        $('#size').val(p.size);
        $('#unit_price').val(p.unit_price);
        $('#description').val(p.description);
        $('#stock_quantity').val(p.stock_quantity);
        $('#is_active').val(p.is_active);
        renderExistingPhotos(p.ProductPhotos);
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

  const formData = new FormData();
  formData.append('item_code', $('#item_code').val().trim());
  formData.append('name', $('#name').val().trim());
  formData.append('category', $('#category').val());
  formData.append('size', $('#size').val());
  formData.append('unit_price', $('#unit_price').val());
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
    success: (data) => {
      const productId = id || data.product?.id;
      uploadGalleryPhotos(productId)
        .always(() => {
          $('#productModal').modal('hide');
          productTable.ajax.reload();
          Swal.fire({ icon: 'success', title: 'Product saved!' });
        })
        .fail((xhr) => {
          $('#productModal').modal('hide');
          productTable.ajax.reload();
          Swal.fire({
            icon: 'warning',
            title: 'Product saved, but gallery upload failed',
            text: xhr.responseJSON?.error || 'Could not upload gallery photos'
          });
        });
    },
    error: (xhr) => Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Save failed' })
  });
};
