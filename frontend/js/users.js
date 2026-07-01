let usersTable;
let viewingTrash = false;

$(document).ready(() => {
  if (!requireAdmin()) return;

  $('#toggle-trash-btn').on('click', toggleTrashView);
  initUsersTable();
});

const toggleTrashView = () => {
  viewingTrash = !viewingTrash;
  $('#toggle-trash-btn').html(viewingTrash
    ? '<i class="fas fa-list"></i> View Active'
    : '<i class="fas fa-trash"></i> View Trash');
  $('#page-title').text(viewingTrash ? 'Trashed Users' : 'User Management');
  usersTable.ajax.url(getUsersUrl()).load();
};

const getUsersUrl = () => `${API_URL}/api/v1/users${viewingTrash ? '?trashed=1' : ''}`;

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
          : `<select class="form-control form-control-sm role-select" data-id="${d.id}" style="width:100px;display:inline;">
              <option value="customer" ${d.role === 'customer' ? 'selected' : ''}>Customer</option>
              <option value="admin" ${d.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${d.id}">Move to Trash</button>`
      }
    ]
  });

  $('#users-table').on('change', '.role-select', function () {
    const id = $(this).data('id');
    const role = $(this).val();
    const currentUser = getUser();

    const applyRoleChange = () => {
      $.ajax({
        url: `${API_URL}/api/v1/users/${id}/role`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
        contentType: 'application/json',
        data: JSON.stringify({ role }),
        success: () => {
          if (currentUser && String(currentUser.id) === String(id)) {
            if (role !== 'admin') {
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
            currentUser.role = role;
            sessionStorage.setItem('user', JSON.stringify(currentUser));
          }
          usersTable.ajax.reload();
          Swal.fire({ icon: 'success', title: 'Role updated', timer: 1000, showConfirmButton: false });
        },
        error: (xhr) => {
          usersTable.ajax.reload();
          Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Could not update role' });
        }
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
        else usersTable.ajax.reload();
      });
      return;
    }

    applyRoleChange();
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
