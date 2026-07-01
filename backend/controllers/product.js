const db = require('../models');
const Product = db.Product;
const ProductPhoto = db.ProductPhoto;
const { Op } = require('sequelize');

exports.getAllProducts = async (req, res) => {
  try {
    const { search, category, size, min_price, max_price, sort } = req.query;
    const where = { deleted_at: null, is_active: 1 };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { item_code: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    if (category) where.category = category;
    if (size) where.size = size;
    if (min_price || max_price) {
      where.unit_price = {};
      if (min_price) where.unit_price[Op.gte] = min_price;
      if (max_price) where.unit_price[Op.lte] = max_price;
    }

    let order = [['createdAt', 'DESC']];
    if (sort === 'price_asc') order = [['unit_price', 'ASC']];
    if (sort === 'price_desc') order = [['unit_price', 'DESC']];

    const products = await Product.findAll({
      where,
      include: [{ model: ProductPhoto }],
      order
    });

    return res.status(200).json({ rows: products });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error fetching products' });
  }
};

exports.getAdminProducts = async (req, res) => {
  try {
    const { trashed } = req.query;
    const where = trashed === '1'
      ? { deleted_at: { [Op.ne]: null } }
      : { deleted_at: null };

    const products = await Product.findAll({
      where,
      include: [{ model: ProductPhoto }],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ rows: products });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error fetching products' });
  }
};

exports.getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, deleted_at: null },
      include: [{ model: ProductPhoto }]
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.status(200).json({ success: true, result: product });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error fetching product' });
  }
};

exports.getAdminProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: ProductPhoto }]
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.status(200).json({ success: true, result: product });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error fetching product' });
  }
};

exports.searchAutocomplete = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(200).json({ rows: [] });
    const products = await Product.findAll({
      where: {
        deleted_at: null,
        is_active: 1,
        [Op.or]: [
          { name: { [Op.like]: `%${q}%` } },
          { item_code: { [Op.like]: `%${q}%` } }
        ]
      },
      attributes: ['id', 'name', 'item_code', 'category', 'unit_price'],
      limit: 8
    });
    return res.status(200).json({ rows: products });
  } catch (err) {
    return res.status(500).json({ error: 'Search error' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    return res.status(200).json({ rows: ['Clothing', 'Footwear'] });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching categories' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { item_code, name, category, size, unit_price, description, stock_quantity, is_active } = req.body;
    if (!item_code || !name || !category || !unit_price) {
      return res.status(400).json({ error: 'Missing required fields: item_code, name, category, unit_price' });
    }

    let image_url = null;
    if (req.file) image_url = req.file.path.replace(/\\/g, '/');

    const product = await Product.create({
      item_code,
      name,
      category,
      size: size || null,
      unit_price,
      description,
      stock_quantity: stock_quantity || 0,
      is_active: is_active !== undefined ? is_active : 1,
      image_url
    });

    return res.status(201).json({ success: true, product });
  } catch (err) {
    console.log(err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Item Code already exists' });
    }
    return res.status(500).json({ error: 'Error creating product', details: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_code, name, category, size, unit_price, description, stock_quantity, is_active } = req.body;
    let image_url = req.file ? req.file.path.replace(/\\/g, '/') : undefined;

    const updateData = { item_code, name, category, size, unit_price, description, stock_quantity, is_active };
    if (image_url) updateData.image_url = image_url;

    await Product.update(updateData, { where: { id } });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Item Code already exists' });
    }
    return res.status(500).json({ error: 'Error updating product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.deleted_at) return res.status(400).json({ error: 'Product is already in trash' });

    await product.update({ deleted_at: new Date() });
    return res.status(200).json({ success: true, message: 'Product moved to trash' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error deleting product' });
  }
};

exports.restoreProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!product.deleted_at) return res.status(400).json({ error: 'Product is not in trash' });

    await product.update({ deleted_at: null });
    return res.status(200).json({ success: true, message: 'Product restored' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error restoring product' });
  }
};

exports.uploadPhotos = async (req, res) => {
  try {
    const { product_id } = req.params;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const photos = await Promise.all(req.files.map((f) =>
      ProductPhoto.create({ product_id, photo_path: f.path.replace(/\\/g, '/') })
    ));
    return res.status(201).json({ success: true, photos });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error uploading photos' });
  }
};
