import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './App.css';

const api = axios.create({
    baseURL: 'http://localhost:5000'
});

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setIsLoggedIn(false);
        setUserRole(null);
    }, []);

    const handleLoginSuccess = (token) => {
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const decodedToken = jwtDecode(token);
        setUserRole(decodedToken.role);
        setIsLoggedIn(true);
    };

    useEffect(() => {
        const verifyUserSession = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    await api.get('/api/verify');
                    const decodedToken = jwtDecode(token);
                    setUserRole(decodedToken.role);
                    setIsLoggedIn(true);
                } catch (err) {
                    handleLogout();
                }
            }
            setLoading(false);
        };
        verifyUserSession();
    }, [handleLogout]);

    if (loading) {
        return <div className="App"><h1>Verifying Session...</h1></div>;
    }

    return (
        <div className="App">
            {isLoggedIn ? (
                <>
                    <button onClick={handleLogout} className="logout-button">Logout</button>
                    {userRole === 'admin' ? <AdminPanel /> : <PatientPanel />}
                </>
            ) : (
                <LoginPage onLoginSuccess={handleLoginSuccess} />
            )}
        </div>
    );
}

const LoginPage = ({ onLoginSuccess }) => {
    const [loginMode, setLoginMode] = useState('patient');
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/login', {
                username,
                password,
                role: loginMode
            });
            onLoginSuccess(response.data.token);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Login Failed. Please check credentials.');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/register', { username, password });
            alert('Registration successful! Please log in.');
            setIsRegistering(false);

        } catch (err) {
            setError(err.response?.data?.error?.message || 'Registration Failed.');
        }
    };
    
    return (
        <>
            <h1>Healthcare Management System</h1>
            <div className="login-container">
                {isRegistering ? (
                    <h2>Register as a New Patient</h2>
                ) : (
                    <>
                        <div className="login-toggle">
                            <button
                                className={`toggle-btn ${loginMode === 'patient' ? 'active' : ''}`}
                                onClick={() => setLoginMode('patient')}
                            >
                                Patient Login
                            </button>
                            <button
                                className={`toggle-btn ${loginMode === 'admin' ? 'active' : ''}`}
                                onClick={() => setLoginMode('admin')}
                            >
                                Admin Login
                            </button>
                        </div>
                        <h2>{loginMode === 'admin' ? 'Administrator Portal' : 'Patient Portal'}</h2>
                    </>
                )}
                
                {error && <p className="error-message">{error}</p>}
                
                <form onSubmit={isRegistering ? handleRegister : handleLogin}>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
                    <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
                </form>

                <button className="secondary-action" onClick={() => setIsRegistering(!isRegistering)}>
                    {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
                </button>
            </div>
        </>
    );
};

const AdminPanel = () => {
    const [patients, setPatients] = useState([]);

    const fetchAllPatients = useCallback(async () => {
        try {
            const response = await api.get('/api/admin/patients');
            setPatients(response.data.data);
        } catch (error) { console.error('Failed to fetch patients', error); }
    }, []);

    useEffect(() => { fetchAllPatients(); }, [fetchAllPatients]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to permanently delete this patient record?')) {
            try {
                await api.delete(`/api/admin/patients/${id}`);
                fetchAllPatients();
            } catch (error) { alert('Failed to delete patient.'); }
        }
    };

    return (
        <div>
            <h1>Admin Dashboard</h1>
            <h2>All Patient Records</h2>
            <div className="patient-list">
                {patients.length > 0 ? patients.map(p => (
                    <div className="patient-card" key={p.id}>
                        <div className="patient-info">
                            <p><strong>Name:</strong> {p.name}, {p.age}</p>
                            <p><strong>Owner Account:</strong> {p.owner}</p>
                            <p><strong>Medical History:</strong> {p.medical_history || 'N/A'}</p>
                        </div>
                        <div className="patient-actions">
                            <button onClick={() => handleDelete(p.id)} className="delete-button">Delete</button>
                        </div>
                    </div>
                )) : <p>No patient records found.</p>}
            </div>
        </div>
    );
};

const PatientPanel = () => {
    const [profile, setProfile] = useState({ name: '', age: '', gender: '', medical_history: '' });
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/api/my-profile');
                if (response.data.data) {
                    setProfile(response.data.data);
                }
            } catch (error) { console.error('Failed to fetch profile', error); }
        };
        fetchProfile();
    }, []);

    const handleInputChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setFeedback('');
        try {
            await api.put('/api/my-profile', profile);
            setFeedback('Profile updated successfully!');
        } catch (error) {
            setFeedback('Failed to update profile.');
        }
    };

    return (
        <div>
            <h1>My Patient Profile</h1>
            <h2>Update Your Information</h2>
            <form onSubmit={handleUpdate} className="patient-form">
                <input type="text" name="name" value={profile.name} onChange={handleInputChange} placeholder="Full Name" required />
                <input type="number" name="age" value={profile.age} onChange={handleInputChange} placeholder="Age" required />
                <input type="text" name="gender" value={profile.gender} onChange={handleInputChange} placeholder="Gender" />
                <textarea name="medical_history" value={profile.medical_history} onChange={handleInputChange} placeholder="Medical History"></textarea>
                <button type="submit">Save Changes</button>
                {feedback && <p className="feedback-message">{feedback}</p>}
            </form>
        </div>
    );
};

export default App;