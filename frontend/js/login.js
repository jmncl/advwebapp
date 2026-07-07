$(document).ready(() => {
  $('#login-form').validate({
    rules: {
      email: { required: true, email: true },
      password: { required: true, minlength: 6 }
    },
    messages: {
      email: {
        required: 'Email is required',
        email: 'Invalid email format'
      },
      password: {
        required: 'Password is required',
        minlength: 'Password must be at least 6 characters'
      }
    },
    errorElement: 'div',
    errorClass: 'text-danger small mt-1',
    submitHandler: () => submitLogin()
  });
});

const submitLogin = () => {
  const email = $('#email').val().trim();
  const password = $('#password').val();

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
          window.location.href = data.user.role === 'admin' ? pageUrl('admin/dashboard.html') : pageUrl('index.html');
        });
    },
    error: (xhr) => {
      const data = xhr.responseJSON || {};
      if (xhr.status === 403 && data.needsVerification) {
        Swal.fire({
          icon: 'warning',
          title: 'Email not verified',
          text: data.message,
          showCancelButton: true,
          confirmButtonText: 'Resend verification email',
          confirmButtonColor: '#ce1141',
          cancelButtonText: 'OK'
        }).then((result) => {
          if (result.isConfirmed) {
            $.ajax({
              url: `${API_URL}/api/v1/resend-verification`,
              method: 'POST',
              contentType: 'application/json',
              data: JSON.stringify({ email: $('#email').val().trim() }),
              success: (res) => Swal.fire({ icon: 'success', text: res.message }),
              error: (res) => Swal.fire({ icon: 'error', text: res.responseJSON?.error || 'Could not resend email' })
            });
          }
        });
        return;
      }
      Swal.fire({ icon: 'error', text: data.message || data.error || 'Login failed' });
    }
  });
};
