const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

const dbPath = path.join(__dirname, 'brgy.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening database:', err.message);
    else {
        console.log('Connected to SQLite database (brgy.db).');
        db.run('PRAGMA foreign_keys = ON');
    }
});

app.use(express.static(path.join(__dirname, '..', 'bis-ui')));
app.use(express.json());
app.disable('x-powered-by');
const HOST = 'localhost';
app.get('/api/status', (req, res) => {
    res.json({ status: 'Server is running' });
});
console.log('Barangay Management System started.');

app.get('/api/metrics', (req, res) => {
    let metrics = {};

    db.get("SELECT COUNT(*) AS count FROM resident WHERE status='Resident'", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        metrics.residents = row.count;

        db.get("SELECT COUNT(*) AS count FROM household", (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            metrics.households = row.count;

            db.get("SELECT COUNT(*) AS count FROM businesses WHERE status='Active'", (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                metrics.businesses = row.count;

                db.get("SELECT COUNT(*) AS count FROM blotter_reports", (err, row) => {
                    if (err) return res.status(500).json({ error: err.message });
                    metrics.blotter_reports = row.count;
                    res.json(metrics);
                });
            });
        });
    });
});

app.get('/api/residents', (req, res) => {
    const query = `
        SELECT r.resident_id, r.first_name, r.middle_name, r.last_name,
        p.purok_name, r.civil_status, r.contact_no, r.status
        FROM resident r
        JOIN purok p ON r.purok_id = p.purok_id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/blotter', (req, res) => {
    db.all("SELECT * FROM blotter_reports", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/businesses', (req, res) => {
    db.all("SELECT * FROM businesses", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});
