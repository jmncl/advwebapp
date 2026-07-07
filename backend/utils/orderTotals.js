const getItemPrice = (item) => parseFloat(item.unit_price ?? item.Product?.unit_price ?? 0);

const getItemName = (item) => item.product_name || item.Product?.name || 'Product';

const computeItemSubtotal = (item) => getItemPrice(item) * (item.quantity || 0);

const computeOrderTotal = (order) => {
  const items = order.OrderItems || [];
  return items.reduce((sum, item) => sum + computeItemSubtotal(item), 0);
};

const enrichOrder = (order) => {
  const plain = order.toJSON ? order.toJSON() : { ...order };
  plain.computed_total = computeOrderTotal(plain);
  if (plain.OrderItems) {
    plain.OrderItems = plain.OrderItems.map((item) => ({
      ...item,
      computed_subtotal: computeItemSubtotal(item)
    }));
  }
  return plain;
};

const enrichOrders = (orders) => orders.map(enrichOrder);

module.exports = {
  getItemPrice,
  getItemName,
  computeItemSubtotal,
  computeOrderTotal,
  enrichOrder,
  enrichOrders
};
