const express = require('express');
const router = express.Router();
const db = require('./database');
const crypto = require('crypto');

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({
            error: { status: 403, message: 'Forbidden: Access is restricted to administrators.' }
        });
    }
    next();
};

const getAdminPatientLinks = (patientId) => {
    return {
        self: { href: `/api/admin/patients/${patientId}` },
        delete: { href: `/api/admin/patients/${patientId}`, method: 'DELETE' }
    };
};

const getPatientProfileLinks = () => {
    return {
        self: { href: '/api/my-profile', method: 'GET' },
        update: { href: '/api/my-profile', method: 'PUT' }
    };
};

router.get('/admin/patients', adminOnly, (req, res) => {
    const query = 'SELECT p.id, p.name, p.age, p.gender, p.medical_history, u.username as owner FROM patients p JOIN users u ON p.user_id = u.id ORDER BY p.id DESC';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: { status: 500, message: 'Database query failed.' } });
        }
        
        const patientsWithLinks = results.map(patient => ({
            ...patient,
            _links: getAdminPatientLinks(patient.id)
        }));

        res.status(200).json({
            data: patientsWithLinks,
            _links: {
                self: { href: '/api/admin/patients', method: 'GET' }
            }
        });
    });
});

router.delete('/admin/patients/:id', adminOnly, (req, res) => {
    const patientId = req.params.id;
    const query = 'DELETE FROM patients WHERE id = ?';
    db.query(query, [patientId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: { status: 500, message: 'Error deleting patient record.' } });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: { status: 404, message: 'Patient record not found.' } });
        }
        res.status(204).send();
    });
});

router.get('/my-profile', (req, res) => {
    const userId = req.user.id;
    const query = 'SELECT * FROM patients WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) { return res.status(500).json({ error: { status: 500, message: 'Database query failed.' } }); }
        
        const patientProfile = results[0] || null;

        const etag = crypto.createHash('sha1').update(JSON.stringify(patientProfile)).digest('hex');
        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.setHeader('ETag', etag);

        if (req.headers['if-none-match'] === etag) {
            return res.status(304).send();
        }
        
        res.status(200).json({
            data: patientProfile ? { ...patientProfile, _links: getPatientProfileLinks() } : null
        });
    });
});

router.put('/my-profile', (req, res) => {
    const userId = req.user.id;
    const { name, age, gender, medical_history } = req.body;
    if (!name || !age) {
        return res.status(400).json({ error: { status: 400, message: 'Name and age are required fields.' } });
    }

    const query = `
        INSERT INTO patients (user_id, name, age, gender, medical_history) 
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = ?, age = ?, gender = ?, medical_history = ?
    `;
    const params = [userId, name, age, gender, medical_history, name, age, gender, medical_history];

    db.query(query, params, (err, result) => {
        if (err) { return res.status(500).json({ error: { status: 500, message: 'Error saving your profile.' } }); }
        
        const updatedProfile = {
            user_id: userId, name, age, gender, medical_history,
            _links: getPatientProfileLinks()
        };
        
        res.status(200).json({ data: updatedProfile });
    });
});

module.exports = router;
