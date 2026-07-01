$(document).ready(() => {
  $('#register-form').on('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const name = $('#name').val().trim();
    const email = $('#email').val().trim();
    const password = $('#password').val();
    const confirm = $('#confirm-password').val();

    if (!name) { $('#name-error').show(); valid = false; } else { $('#name-error').hide(); }
    if (!email) { $('#email-error').show(); valid = false; } else { $('#email-error').hide(); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('#email-format-error').show(); valid = false; } else { $('#email-format-error').hide(); }
    if (!password) { $('#password-error').show(); valid = false; } else { $('#password-error').hide(); }
    if (password !== confirm) { $('#confirm-error').show(); valid = false; } else { $('#confirm-error').hide(); }

    if (!valid) return;

    $.ajax({
      url: `${API_URL}/api/v1/register`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ name, email, password }),
      success: () => {
        Swal.fire({ icon: 'success', title: 'Account created!', text: 'You can now log in.' })
          .then(() => { window.location.href = pageUrl('login.html'); });
      },
      error: (xhr) => {
        Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Registration failed' });
      }
    });
  });
});
