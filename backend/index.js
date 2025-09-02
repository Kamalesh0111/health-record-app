const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./database');
const apiRoutes = require('./api');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: { status: 400, message: 'Username and password are required.' } });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);

    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(query, [username, hashedPassword], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: { status: 409, message: 'Conflict: This username is already taken.' } });
            }
            return res.status(500).json({ error: { status: 500, message: 'Error registering user.' } });
        }
        res.status(201).json({ message: 'User registered successfully. Please log in.' });
    });
});

app.post('/login', (req, res) => {
    const { username, password, role: intendedRole } = req.body;

    if (!username || !password || !intendedRole) {
        return res.status(400).json({ error: { status: 400, message: 'Username, password, and role are required.' } });
    }

    const query = 'SELECT id, username, password, role FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            return res.status(500).json({ error: { status: 500, message: 'Database error during login.' } });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: { status: 404, message: 'User not found.' } });
        }

        const user = results[0];
        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).json({ error: { status: 401, message: 'Unauthorized: Invalid credentials.' } });
        }

        const actualRole = user.role;
        
        if (intendedRole === 'admin' && actualRole !== 'admin') {
            return res.status(403).json({
                error: { status: 403, message: 'Forbidden: You do not have administrator privileges.' }
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({ auth: true, token: token });
    });
});

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
            if (err) {
                return res.status(403).json({ error: { status: 403, message: 'Forbidden: Invalid or expired token.' } });
            }
            req.user = userPayload;
            next();
        });
    } else {
        res.status(401).json({ error: { status: 401, message: 'Unauthorized: No token provided.' } });
    }
};

app.get('/api/verify', authenticateJWT, (req, res) => {
    res.status(200).json({ message: 'Token is valid.' });
});

app.use('/api', authenticateJWT, apiRoutes);

app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});