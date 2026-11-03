const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, testConnection } = require('./db');
const { calculateElasticity } = require('./elasticity');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// SYSTEM / HEALTH CHECK
// ----------------------------------------------------
app.get('/api/health', async (req, res) => {
  const isConnected = await testConnection();
  res.json({
    status: isConnected ? 'online' : 'database_disconnected',
    database: process.env.DB_NAME || 'demand_elasticity',
    host: process.env.DB_HOST || 'localhost',
  });
});

// ----------------------------------------------------
// DASHBOARD STATS
// ----------------------------------------------------
app.get('/api/dashboard', async (req, res) => {
  try {
    const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) AS totalProducts FROM Products');
    const [[{ totalExperiments }]] = await pool.query('SELECT COUNT(*) AS totalExperiments FROM Experiments');
    const [[{ totalObservations }]] = await pool.query('SELECT COUNT(*) AS totalObservations FROM Observations');

    const [recentExperiments] = await pool.query(`
      SELECT e.experiment_id, e.experiment_name, e.start_date, e.end_date, e.location, p.product_name 
      FROM Experiments e 
      JOIN Products p ON e.product_id = p.product_id 
      ORDER BY e.experiment_id DESC LIMIT 5
    `);

    const [recentObservations] = await pool.query(`
      SELECT o.observation_id, o.price, o.quantity_sold, o.observed_at, e.experiment_name 
      FROM Observations o 
      JOIN Experiments e ON o.experiment_id = e.experiment_id 
      ORDER BY o.observed_at DESC LIMIT 5
    `);

    res.json({
      stats: { totalProducts, totalExperiments, totalObservations },
      recentExperiments,
      recentObservations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// PRODUCTS CRUD
// ----------------------------------------------------
app.get('/api/products', async (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : '%';
    const [rows] = await pool.query(
      'SELECT product_id, product_name, category, brand FROM Products WHERE product_name LIKE ? ORDER BY product_id DESC',
      [search]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  const { product_name, category, brand } = req.body;
  if (!product_name || product_name.trim() === '') {
    return res.status(400).json({ error: 'Product name is required.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO Products (product_name, category, brand) VALUES (?, ?, ?)',
      [product_name.trim(), category?.trim() || null, brand?.trim() || null]
    );
    res.status(201).json({ product_id: result.insertId, product_name, category, brand });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const { product_name, category, brand } = req.body;
  const productId = req.params.id;
  if (!product_name || product_name.trim() === '') {
    return res.status(400).json({ error: 'Product name is required.' });
  }
  try {
    await pool.query(
      'UPDATE Products SET product_name = ?, category = ?, brand = ? WHERE product_id = ?',
      [product_name.trim(), category?.trim() || null, brand?.trim() || null, productId]
    );
    res.json({ message: 'Product updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Products WHERE product_id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Cannot delete product. Ensure no experiments are linked to it first.' });
  }
});

// ----------------------------------------------------
// EXPERIMENTS CRUD
// ----------------------------------------------------
app.get('/api/experiments', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.experiment_id, e.product_id, e.experiment_name, e.start_date, e.end_date, e.location, e.notes,
             p.product_name, p.category, p.brand
      FROM Experiments e
      JOIN Products p ON e.product_id = p.product_id
      ORDER BY e.experiment_id DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/experiments', async (req, res) => {
  const { product_id, experiment_name, start_date, end_date, location, notes } = req.body;
  if (!product_id || !experiment_name) {
    return res.status(400).json({ error: 'Product selection and experiment name are required.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO Experiments (product_id, experiment_name, start_date, end_date, location, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [product_id, experiment_name.trim(), start_date || null, end_date || null, location || null, notes || null]
    );
    res.status(201).json({ experiment_id: result.insertId, message: 'Experiment created successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/experiments/:id', async (req, res) => {
  const { product_id, experiment_name, start_date, end_date, location, notes } = req.body;
  try {
    await pool.query(
      'UPDATE Experiments SET product_id = ?, experiment_name = ?, start_date = ?, end_date = ?, location = ?, notes = ? WHERE experiment_id = ?',
      [product_id, experiment_name.trim(), start_date || null, end_date || null, location || null, notes || null, req.params.id]
    );
    res.json({ message: 'Experiment updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/experiments/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Experiments WHERE experiment_id = ?', [req.params.id]);
    res.json({ message: 'Experiment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Cannot delete experiment. Remove its observations first.' });
  }
});

// ----------------------------------------------------
// OBSERVATIONS CRUD
// ----------------------------------------------------
app.get('/api/experiments/:id/observations', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT observation_id, experiment_id, price, quantity_sold, observed_at FROM Observations WHERE experiment_id = ? ORDER BY price ASC, observed_at ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/experiments/:id/observations', async (req, res) => {
  const experimentId = req.params.id;
  const { price, quantity_sold, observed_at } = req.body;

  if (price === undefined || quantity_sold === undefined || !observed_at) {
    return res.status(400).json({ error: 'Price, quantity sold, and observation timestamp are required.' });
  }
  if (Number(price) <= 0) {
    return res.status(400).json({ error: 'Price must be greater than zero.' });
  }
  if (Number(quantity_sold) < 0 || !Number.isInteger(Number(quantity_sold))) {
    return res.status(400).json({ error: 'Quantity sold must be a non-negative integer.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO Observations (experiment_id, price, quantity_sold, observed_at) VALUES (?, ?, ?, ?)',
      [experimentId, parseFloat(price), parseInt(quantity_sold, 10), observed_at]
    );
    res.status(201).json({ observation_id: result.insertId, message: 'Observation saved successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/observations/:id', async (req, res) => {
  const { price, quantity_sold, observed_at } = req.body;
  if (Number(price) <= 0 || Number(quantity_sold) < 0) {
    return res.status(400).json({ error: 'Invalid price or quantity values.' });
  }
  try {
    await pool.query(
      'UPDATE Observations SET price = ?, quantity_sold = ?, observed_at = ? WHERE observation_id = ?',
      [parseFloat(price), parseInt(quantity_sold, 10), observed_at, req.params.id]
    );
    res.json({ message: 'Observation updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/observations/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Observations WHERE observation_id = ?', [req.params.id]);
    res.json({ message: 'Observation deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// ANALYSIS ENDPOINT
// ----------------------------------------------------
app.get('/api/experiments/:id/analysis', async (req, res) => {
  try {
    const [[experiment]] = await pool.query(
      `SELECT e.*, p.product_name, p.category, p.brand 
       FROM Experiments e 
       JOIN Products p ON e.product_id = p.product_id 
       WHERE e.experiment_id = ?`,
      [req.params.id]
    );

    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found.' });
    }

    const [observations] = await pool.query(
      'SELECT observation_id, experiment_id, price, quantity_sold, observed_at FROM Observations WHERE experiment_id = ? ORDER BY price ASC',
      [req.params.id]
    );

    res.json({
      experiment,
      observations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Production: Serve React client build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, async () => {
  console.log(`[Server] Express server running on port ${PORT}`);
  await testConnection();
});