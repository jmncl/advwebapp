module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Cart', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    size: DataTypes.STRING,
    deleted_at: { type: DataTypes.DATE, allowNull: true }
  }, { tableName: 'cart', timestamps: true });
};
