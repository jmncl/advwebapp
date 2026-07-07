require('dotenv').config();
const app = require('./app');
const db = require('./models');

const PORT = process.env.PORT || 4000;

db.sequelize.sync({ alter: false }).then(() => {
  console.log('Database connected.');
  app.listen(PORT, () => console.log(`Jordan Brand Store API running on port ${PORT}`));
}).catch((err) => {
  console.error('Database connection failed:', err.message);
  process.exit(1);
});
