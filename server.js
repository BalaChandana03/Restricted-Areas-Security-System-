const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql2');
const multer = require('multer'); // Require 'multer' for file uploads
const upload = multer({ dest: 'uploads/' }); // Specify the destination for uploaded files

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'rass', // Replace with your database name
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database: ' + err.message);
    } else {
        console.log('Connected to the database');
    }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Add this line to handle JSON data

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/admin-login', (req, res) => {
    const { userId, password } = req.body;

    db.query(
        'SELECT * FROM admin_users WHERE username = ? AND password = ?',
        ['admin', password],
        (err, results) => {
            if (err) {
                console.error('Database error: ' + err.message);
                res.status(500).send('Internal Server Error');
                return;
            }

            if (results.length >0) {
                // Admin credentials are correct
                // Redirect to the admin dashboard or the desired page
                res.redirect('/admin-dashboard.html'); // Replace with your admin dashboard URL
            } else {
                // Admin credentials are incorrect
                res.send('Invalid credentials');
            }
        }
    );
});

app.post('/user-login', (req, res) => {
    const { userId, password } = req.body;
    console.log('Received user ID and password:', userId, password);
    db.query(
        'SELECT * FROM authorized_persons WHERE userId = ? AND password = ?',
        [userId, password],
        (error, results) => {
            if (error) {
                console.error('Database error: ' + error.message);
                res.status(500).send('Internal Server Error');
            } else if (results.length === 1) {
                // User credentials are correct
                res.sendStatus(200); // Successful user login
            } else {
                // User credentials are incorrect
                res.sendStatus(401); // Unauthorized
            }
        }
    );
});

app.post('/add-authorized', (req, res) => {
    const { name, userId, password } = req.body;

    // Check if the user ID already exists in the database
    db.query(
        'SELECT * FROM authorized_persons WHERE userId = ?',
        [userId],
        (error, results) => {
            if (error) {
                console.error('Database error: ' + error.message);
                res.status(500).send('Internal Server Error');
            } else if (results.length > 0) {
                // Duplicate user ID
                res.json({ success: false, message: 'User ID already exists. Please choose a different User ID.' });
            } else {
                // User ID is unique, so proceed to insert the new authorized person
                db.query(
                    'INSERT INTO authorized_persons (name, userId, password) VALUES (?, ?, ?)',
                    [name, userId, password],
                    (error, results) => {
                        if (error) {
                            console.error('Database error: ' + error.message);
                            res.status(500).send('Internal Server Error');
                        } else {
                            // Successful addition
                            res.json({ success: true });
                        }
                    }
                );
            }
        }
    );
});

app.get('/get-authorized-users', (req, res) => {
    db.query('SELECT name, userId FROM authorized_persons', (error, results) => {
        if (error) {
            console.error('Database error: ' + error.message);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Retrieved authorized users:', results); // Add this line
            res.json(results);
        }
    });
});

app.delete('/delete-authorized-user/:userId', (req, res) => {
    const userId = req.params.userId;

    db.query('DELETE FROM authorized_persons WHERE userId = ?', [userId], (error, results) => {
        if (error) {
            console.error('Database error: ' + error.message);
            res.status(500).send('Internal Server Error');
        } else if (results.affectedRows === 1) {
            res.sendStatus(200); // Successful deletion
        } else {
            res.sendStatus(404); // User not found
        }
    });
});

app.post('/add-user', upload.single('userImage'), (req, res) => {
    const { registeredNo } = req.body;
    const userImage = req.file ? req.file.path : null;

    // Check if the user ID already exists in the database
    db.query(
        'INSERT INTO users (registeredNo, userImage) VALUES (?, ?)',
        [registeredNo, userImage],
        (error, results) => {
            if (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    // Duplicate entry error (registration number already exists)
                    res.status(400).json({ success: false, message: 'Registration number already exists. Please choose a different number.' });
                } else {
                    // Other database error
                    console.error('Database error: ' + error.message);
                    res.status(500).send('Internal Server Error');
                }
            } else {
                // Successful addition
                res.status(200).json({ success: true, message: 'User added successfully' });
            }
        }
    );
});

app.get('/get-users', (req, res) => {
    // Fetch user data from the 'users' table
    db.query('SELECT registeredNo, userImage FROM users', (error, results) => {
        if (error) {
            console.error('Database error: ' + error.message);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Retrieved user data:', results);

            // Send the user data as JSON response
            res.json(results);
        }
    });
});

// Add a new route for deleting user details by registeredNo
app.delete('/delete-user/:registeredNo', (req, res) => {
    const registeredNo = req.params.registeredNo;

    // Delete the user with the given registeredNo from the 'users' table
    db.query('DELETE FROM users WHERE registeredNo = ?', [registeredNo], (error, results) => {
        if (error) {
            console.error('Database error: ' + error.message);
            res.status(500).send('Internal Server Error');
        } else if (results.affectedRows === 1) {
            // User deleted successfully
            res.sendStatus(200);
        } else {
            // User not found
            res.sendStatus(404);
        }
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
