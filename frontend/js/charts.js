let barChart, lineChart, pieChart;

$(document).ready(() => {
  if (!requireAdmin()) return;
  loadDashboard();
});

const loadDashboard = () => {
  $.ajax({
    url: `${API_URL}/api/v1/dashboard`,
    headers: { Authorization: `Bearer ${getToken()}` },
    success: (data) => {
      const s = data.stats;
      $('#stat-products').text(s.totalProducts);
      $('#stat-users').text(s.totalUsers);
      $('#stat-orders').text(s.totalOrders);
      $('#stat-revenue').text(formatPrice(s.totalRevenue));

      buildCharts(data);
    },
    error: () => Swal.fire({ icon: 'error', text: 'Could not load dashboard data' })
  });
};

const buildCharts = (data) => {
  const orders = data.orders || [];

  const monthMap = {};
  orders.forEach((o) => {
    const key = new Date(o.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
    monthMap[key] = (monthMap[key] || 0) + parseFloat(o.computed_total || 0);
  });

  const lineLabels = Object.keys(monthMap);
  const lineData = Object.values(monthMap);

  const catMap = {};
  (data.categorySales || []).forEach((item) => {
    const cat = item.Product?.category || 'Other';
    const lineTotal = parseFloat(item.Product?.unit_price || 0) * item.quantity;
    catMap[cat] = (catMap[cat] || 0) + lineTotal;
  });

  if (lineChart) lineChart.destroy();
  if (pieChart) pieChart.destroy();

  const lineCtx = document.getElementById('lineChart');
  if (lineCtx) {
    lineChart = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: lineLabels.length ? lineLabels : ['No data'],
        datasets: [{ label: 'Revenue', data: lineData.length ? lineData : [0], borderColor: '#ce1141', fill: false }]
      }
    });
  }

  const pieCtx = document.getElementById('pieChart');
  if (pieCtx) {
    pieChart = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: Object.keys(catMap).length ? Object.keys(catMap) : ['No data'],
        datasets: [{
          data: Object.values(catMap).length ? Object.values(catMap) : [1],
          backgroundColor: ['#ce1141', '#111111', '#888888', '#555555']
        }]
      }
    });
  }

  const dayMap = {};
  orders.forEach((o) => {
    const key = new Date(o.createdAt).toLocaleDateString();
    dayMap[key] = (dayMap[key] || 0) + 1;
  });

  const barCtx = document.getElementById('barChart');
  if (barCtx) {
    if (barChart) barChart.destroy();
    barChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(dayMap).slice(-7),
        datasets: [{ label: 'Orders', data: Object.values(dayMap).slice(-7), backgroundColor: '#111111' }]
      }
    });
  }
};
