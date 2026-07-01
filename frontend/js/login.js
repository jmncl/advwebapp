$(document).ready(() => {
  $('#login-form').on('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const email = $('#email').val().trim();
    const password = $('#password').val();

    if (!email) { $('#email-error').show(); valid = false; } else { $('#email-error').hide(); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('#email-format-error').show(); valid = false; } else { $('#email-format-error').hide(); }
    if (!password) { $('#password-error').show(); valid = false; } else { $('#password-error').hide(); }

    if (!valid) return;

    $.ajax({
      url: `${API_URL}/api/v1/login`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ email, password }),
      success: (data) => {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        Swal.fire({ icon: 'success', title: 'Welcome back!', timer: 1500, showConfirmButton: false })
          .then(() => {
            window.location.href = data.user.role === 'admin' ? '/admin/dashboard.html' : '/index.html';
          });
      },
      error: (xhr) => {
        Swal.fire({ icon: 'error', text: xhr.responseJSON?.message || xhr.responseJSON?.error || 'Login failed' });
      }
    });
  });
});
