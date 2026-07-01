module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'),
      defaultValue: 'Pending'
    },
    shipping_address: DataTypes.TEXT,
    payment_method: DataTypes.STRING,
    deleted_at: { type: DataTypes.DATE, allowNull: true }
  }, { tableName: 'orders', timestamps: true });
};
