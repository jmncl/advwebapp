let usersTable;
let viewingTrash = false;
let editingUserId = null;

const resetUserForm = () => {
  const validator = $('#user-form').data('validator');
  if (validator) validator.resetForm();
  $('#user-form')[0].reset();
  $('#user-name, #user-email').prop('readonly', false);
  editingUserId = null;
  $('#user-id').val('');
  $('#user-modal-title').text('Add User');
  $('.user-password-field').show();
};

const initUserValidation = () => {
  $('#user-form').validate({
    rules: {
      name: { required: true, minlength: 2, maxlength: 80 },
      email: { required: true, email: true },
      password: {
        required: () => !editingUserId,
        minlength: 6
      },
      confirm_password: {
        required: () => !editingUserId,
        equalTo: '#user-password'
      },
      role: { required: true }
    },
    messages: {
      name: { required: 'Name is required' },
      email: { required: 'Email is required', email: 'Enter a valid email address' },
      password: { required: 'Password is required', minlength: 'Password must be at least 6 characters' },
      confirm_password: { required: 'Please confirm the password', equalTo: 'Passwords do not match' },
      role: { required: 'Please select a role' }
    },
    errorElement: 'div',
    errorClass: 'text-danger small mt-1',
    submitHandler: () => saveUser()
  });
};

$(document).ready(() => {
  if (!requireAdmin()) return;

  initUserValidation();
  $('#toggle-trash-btn').on('click', toggleTrashView);
  $('#userModal').on('hidden.bs.modal', resetUserForm);
  initUsersTable();
});

const toggleTrashView = () => {
  viewingTrash = !viewingTrash;
  $('#toggle-trash-btn').html(viewingTrash
    ? '<i class="fas fa-list"></i> View Active'
    : '<i class="fas fa-trash"></i> View Trash');
  $('#page-title').text(viewingTrash ? 'Trashed Users' : 'User Management');
  $('#add-user-btn').toggle(!viewingTrash);
  usersTable.ajax.url(getUsersUrl()).load();
};

const getUsersUrl = () => `${API_URL}/api/v1/users${viewingTrash ? '?trashed=1' : ''}`;

const saveUser = () => {
  const name = $('#user-name').val().trim();
  const email = $('#user-email').val().trim();
  const password = $('#user-password').val();
  const role = $('#user-role').val();

  if (editingUserId) {
    updateUserRole(editingUserId, role);
    return;
  }

  $.ajax({
    url: `${API_URL}/api/v1/register`,
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ name, email, password }),
    success: (data) => {
      const userId = data.user?.id;
      if (role === 'admin' && userId) {
        $.ajax({
          url: `${API_URL}/api/v1/users/${userId}/role`,
          method: 'PUT',
          headers: { Authorization: `Bearer ${getToken()}` },
          contentType: 'application/json',
          data: JSON.stringify({ role }),
          complete: () => finishUserSave()
        });
      } else {
        finishUserSave();
      }
    },
    error: (xhr) => Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Could not create user' })
  });
};

const finishUserSave = () => {
  $('#userModal').modal('hide');
  usersTable.ajax.reload();
  Swal.fire({ icon: 'success', title: 'User saved!' });
};

const updateUserRole = (id, role) => {
  const currentUser = getUser();

  const applyRoleChange = () => {
    $.ajax({
      url: `${API_URL}/api/v1/users/${id}/role`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${getToken()}` },
      contentType: 'application/json',
      data: JSON.stringify({ role }),
      success: () => {
        if (currentUser && String(currentUser.id) === String(id) && role !== 'admin') {
          Swal.fire({
            icon: 'warning',
            title: 'Your admin access was removed',
            text: 'You will be logged out. Log in again with an admin account.'
          }).then(() => {
            sessionStorage.clear();
            window.location.href = pageUrl('login.html');
          });
          return;
        }
        if (currentUser && String(currentUser.id) === String(id)) {
          currentUser.role = role;
          sessionStorage.setItem('user', JSON.stringify(currentUser));
        }
        finishUserSave();
      },
      error: (xhr) => Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Could not update role' })
    });
  };

  if (currentUser && String(currentUser.id) === String(id) && role === 'customer') {
    Swal.fire({
      title: 'Remove your own admin access?',
      text: 'You will lose access to admin pages.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ce1141'
    }).then((result) => {
      if (result.isConfirmed) applyRoleChange();
    });
    return;
  }

  applyRoleChange();
};

const openEditUserModal = (user) => {
  resetUserForm();
  editingUserId = user.id;
  $('#user-id').val(user.id);
  $('#user-name').val(user.name).prop('readonly', true);
  $('#user-email').val(user.email).prop('readonly', true);
  $('.user-password-field').hide();
  $('#user-role').val(user.role);
  $('#user-modal-title').text('Edit User Role');
  $('#userModal').modal('show');
};

const initUsersTable = () => {
  usersTable = $('#users-table').DataTable({
    ajax: authAjax(getUsersUrl()),
    columns: [
      { data: 'id' },
      { data: 'name' },
      { data: 'email' },
      { data: 'role' },
      {
        data: 'is_active',
        render: (d) => d ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'
      },
      {
        data: 'createdAt',
        render: (d) => new Date(d).toLocaleDateString()
      },
      {
        data: null,
        render: (d) => viewingTrash
          ? `<button class="btn btn-primary btn-sm restore-btn" data-id="${d.id}"><i class="fas fa-undo"></i> Restore</button>`
          : `<button class="btn btn-secondary btn-sm edit-user-btn" data-id="${d.id}"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${d.id}">Move to Trash</button>`
      }
    ]
  });

  $('#users-table').on('click', '.edit-user-btn', function () {
    const id = $(this).data('id');
    const row = usersTable.rows().data().toArray().find((u) => String(u.id) === String(id));
    if (row) openEditUserModal(row);
  });

  $('#users-table').on('click', '.delete-btn', function () {
    const id = $(this).data('id');
    Swal.fire({
      title: 'Move user to trash?',
      text: 'They will not be able to log in until restored.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ce1141'
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: `${API_URL}/api/v1/users/${id}/status`,
          method: 'PUT',
          headers: { Authorization: `Bearer ${getToken()}` },
          success: () => { usersTable.ajax.reload(); Swal.fire('Moved to trash', '', 'success'); }
        });
      }
    });
  });

  $('#users-table').on('click', '.restore-btn', function () {
    const id = $(this).data('id');
    $.ajax({
      url: `${API_URL}/api/v1/users/${id}/restore`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${getToken()}` },
      success: () => { usersTable.ajax.reload(); Swal.fire('Restored!', 'User can log in again.', 'success'); }
    });
  });
};
