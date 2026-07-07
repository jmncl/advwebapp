$(document).ready(() => {
  const token = new URLSearchParams(window.location.search).get('token');

  if (!token) {
    $('#verify-status').html('Invalid verification link. <a href="register.html">Register again</a> or <a href="login.html">log in</a>.');
    return;
  }

  $.ajax({
    url: `${API_URL}/api/v1/verify-email?token=${encodeURIComponent(token)}`,
    method: 'GET',
    success: (data) => {
      $('#verify-status').html(`<p style="color:#28a745;"><i class="fas fa-check-circle"></i> ${data.message}</p>`);
      Swal.fire({
        icon: 'success',
        title: 'Email Verified!',
        text: data.message,
        confirmButtonColor: '#ce1141'
      }).then(() => {
        window.location.href = pageUrl('login.html');
      });
    },
    error: (xhr) => {
      const message = xhr.responseJSON?.message || xhr.responseJSON?.error || 'Verification failed';
      $('#verify-status').html(`<p style="color:#ce1141;"><i class="fas fa-times-circle"></i> ${message}</p>`);
    }
  });
});
