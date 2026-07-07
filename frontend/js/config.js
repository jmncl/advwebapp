const API_URL = 'http://localhost:4001';

const pageUrl = (path) => {
  const clean = path.replace(/^\//, '');
  if (window.location.pathname.includes('/admin/')) {
    if (clean.startsWith('admin/')) {
      return clean.replace('admin/', '');
    }
    return `../${clean}`;
  }
  return clean;
};

const getToken = () => {  const token = sessionStorage.getItem('token');
  if (!token) return null;
  return token;
};

const getUser = () => {
  const user = sessionStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

const requireLogin = () => {
  const token = getToken();
  if (!token) {
    Swal.fire({ icon: 'warning', text: 'You must be logged in.' }).then(() => {
      window.location.href = pageUrl('login.html');
    });
    return null;
  }
  return token;
};

const requireAdmin = () => {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    Swal.fire({ icon: 'error', text: 'Admin access required.' }).then(() => {
      window.location.href = pageUrl('index.html');
    });
    return false;
  }
  return true;
};

const requireCustomer = () => {
  const token = requireLogin();
  if (!token) return null;

  const user = getUser();
  if (!user || user.role !== 'customer') {
    Swal.fire({
      icon: 'info',
      text: user?.role === 'admin'
        ? 'Admins manage all orders in the admin panel.'
        : 'Customer login required to view orders.'
    }).then(() => {
      window.location.href = user?.role === 'admin'
        ? pageUrl('admin/orders.html')
        : pageUrl('login.html');
    });
    return null;
  }

  return token;
};

const updateNavbar = () => {
  const user = getUser();
  const $auth = $('#nav-auth');
  const $cartBadge = $('#cart-count');

  if (user) {
    $auth.html(`
      ${user.role === 'customer' ? `<a href="${pageUrl('orders.html')}"><i class="fas fa-shopping-bag"></i> My Orders</a>` : ''}
      ${user.role === 'admin' ? `<a href="${pageUrl('admin/dashboard.html')}"><i class="fas fa-cog"></i> Admin</a>` : ''}
      <a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
    `);
    $('#logout-btn').on('click', (e) => {
      e.preventDefault();
      const token = getToken();
      const finishLogout = () => {
        sessionStorage.clear();
        window.location.href = pageUrl('index.html');
      };

      if (!token) {
        finishLogout();
        return;
      }

      $.ajax({
        url: `${API_URL}/api/v1/logout`,
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        complete: finishLogout
      });
    });
    loadCartCount();
  } else {
    $auth.html(`
      <a href="${pageUrl('login.html')}"><i class="fas fa-sign-in-alt"></i> Login</a>
      <a href="${pageUrl('register.html')}"><i class="fas fa-user-plus"></i> Register</a>
    `);
    $cartBadge.hide();
  }
};

const loadCartCount = () => {
  const token = getToken();
  if (!token) return;
  $.ajax({
    url: `${API_URL}/api/v1/cart`,
    headers: { Authorization: `Bearer ${token}` },
    success: (data) => {
      const count = data.rows ? data.rows.length : 0;
      $('#cart-count').text(count).toggle(count > 0);
    }
  });
};

const formatPrice = (price) => `₱${parseFloat(price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const productImage = (product) => {
  if (product.image_url) {
    return `${API_URL}/${product.image_url}`;
  }
  return null;
};

const goToProduct = (productId) => {
  if (!productId) return;
  const id = String(productId);
  sessionStorage.setItem('viewProductId', id);
  window.location.assign(`${pageUrl('product-detail.html')}?id=${encodeURIComponent(id)}#${id}`);
};

const getProductIdFromUrl = () => {
  const fromQuery = new URLSearchParams(window.location.search).get('id');
  if (fromQuery) return fromQuery;

  const fromHash = window.location.hash.replace(/^#/, '').trim();
  if (fromHash) return fromHash;

  return sessionStorage.getItem('viewProductId');
};

const authAjax = (url) => ({
  url,
  type: 'GET',
  beforeSend: (xhr) => {
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  },
  dataSrc: (json) => json.rows || [],
  error: (xhr) => {
    if (xhr.status === 401) {
      Swal.fire({ icon: 'error', text: 'Session expired. Please log in again.' })
        .then(() => { window.location.href = pageUrl('login.html'); });
    } else if (xhr.status === 403) {
      Swal.fire({
        icon: 'error',
        title: 'Admin access denied',
        text: 'Your role may have changed. Please log out and log in again as admin.'
      }).then(() => {
        sessionStorage.clear();
        window.location.href = pageUrl('login.html');
      });
    } else {
      Swal.fire({ icon: 'error', text: 'Could not load data. Is the backend running?' });
    }
  }
});
