import express from 'express';
// import mysql from 'mysql2/promise';
import { Router } from 'express';

const router = Router();

// Create connection pool (same as server.js)
import pool from '../config/db.js';

// Get all provinces
router.get('/provinces', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT id, name_kh FROM provinces ORDER BY name_kh');
    connection.release();

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get districts by province
router.get('/districts/:provinceId', async (req, res) => {
  try {
    const { provinceId } = req.params;
    const connection = await pool.getConnection();

    const [rows] = await connection.execute(
      'SELECT id, name_kh FROM districts WHERE province_id = ? ORDER BY name_kh',
      [provinceId]
    );

    connection.release();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get communes by district
router.get('/communes/:districtId', async (req, res) => {
  try {
    const { districtId } = req.params;
    const connection = await pool.getConnection();

    const [rows] = await connection.execute(
      'SELECT id, name_kh FROM communes WHERE district_id = ? ORDER BY name_kh',
      [districtId]
    );

    connection.release();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get villages by commune
router.get('/villages/:communeId', async (req, res) => {
  try {
    const { communeId } = req.params;
    const connection = await pool.getConnection();

    const [rows] = await connection.execute(
      'SELECT id, name_kh FROM villages WHERE commune_id = ? ORDER BY name_kh',
      [communeId]
    );

    connection.release();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
