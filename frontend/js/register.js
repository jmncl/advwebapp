$(document).ready(() => {
  $('#register-form').validate({
    rules: {
      name: { required: true, minlength: 2, maxlength: 80 },
      email: { required: true, email: true },
      password: { required: true, minlength: 6 },
      confirm_password: { required: true, equalTo: '#password' }
    },
    messages: {
      name: {
        required: 'Name is required',
        minlength: 'Name must be at least 2 characters'
      },
      email: {
        required: 'Email is required',
        email: 'Invalid email format'
      },
      password: {
        required: 'Password is required',
        minlength: 'Password must be at least 6 characters'
      },
      confirm_password: {
        required: 'Please confirm your password',
        equalTo: 'Passwords do not match'
      }
    },
    errorElement: 'div',
    errorClass: 'text-danger small mt-1',
    submitHandler: () => submitRegister()
  });
});

const submitRegister = () => {
  const name = $('#name').val().trim();
  const email = $('#email').val().trim();
  const password = $('#password').val();

  $.ajax({
    url: `${API_URL}/api/v1/register`,
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ name, email, password }),
    success: (data) => {
      Swal.fire({
        icon: 'success',
        title: 'Check your email!',
        html: `${data.message}<br><br>We sent a verification link to <strong>${email}</strong>.`,
        confirmButtonColor: '#ce1141'
      }).then(() => {
        window.location.href = pageUrl('login.html');
      });
    },
    error: (xhr) => {
      Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Registration failed' });
    }
  });
};
