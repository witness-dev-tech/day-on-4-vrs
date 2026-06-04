const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// ====================================================================
// 1. CORS CONFIGURATION
// ====================================================================
app.use(cors({
    origin: 'http://localhost:5173', // Matches standard frontend development environments (e.g., Vite)
    credentials: true,               // Allows session cookies to sync across origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ====================================================================
// 2. MIDDLEWARE CONFIGURATION
// ====================================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'vrs_secret_session_key_123', 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 2, // Session lifespan: 2 hours
        secure: false,              // Set to true if running over HTTPS
        httpOnly: true,             // Shields cookies from client-side script access
        sameSite: 'lax'             
    }
}));

// Authentication Guard Middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized access. Please log in.' });
};

// ====================================================================
// 3. DATABASE CONNECTION POOL
// ====================================================================
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'vrs',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// ====================================================================
// 4. AUTHENTICATION & ACCOUNT ENDPOINTS
// ====================================================================

// Create Account / Register User
app.post('/api/auth/register', [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').isIn(['Admin', 'Staff']).withMessage('Role must be either Admin or Staff')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password, role } = req.body;
    try {
        const [existingUser] = await db.query('SELECT user_id FROM user WHERE username = ?', [username]);
        if (existingUser.length > 0) return res.status(400).json({ error: 'Username is already taken' });

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const [result] = await db.query(
            'INSERT INTO user (username, password, role) VALUES (?, ?, ?)',
            [username, hashedPassword, role]
        );
        res.status(201).json({ message: 'User account created successfully', userId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login User
app.post('/api/auth/login', [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM user WHERE username = ?', [username]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        req.session.userId = user.user_id;
        req.session.username = user.username;
        req.session.role = user.role;

        res.json({ message: 'Logged in successfully', user: { id: user.user_id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Logout User
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Could not complete logout request.' });
        res.clearCookie('connect.sid'); 
        res.json({ message: 'Logged out successfully' });
    });
});

// ====================================================================
// 5. CUSTOMER CRUD ENDPOINTS
// ====================================================================

// [CREATE] - Add a new customer profile
app.post('/api/customers', isAuthenticated, [
    body('fullname').trim().notEmpty().withMessage('Full name is required'),
    body('nationalid').trim().notEmpty().withMessage('National ID is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('email').trim().isEmail().withMessage('Valid email address is required'),
    body('address').trim().notEmpty().withMessage('Address is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { fullname, nationalid, phone, email, address } = req.body;
    try {
        const [existing] = await db.query('SELECT customer_id FROM customer WHERE nationalid = ?', [nationalid]);
        if (existing.length > 0) return res.status(400).json({ error: 'A customer with this National ID already exists.' });

        const [result] = await db.query(
            `INSERT INTO customer (fullname, nationalid, phone, email, address) VALUES (?, ?, ?, ?, ?)`,
            [fullname, nationalid, phone, email, address]
        );
        res.status(201).json({ message: 'Customer profile registered successfully', customerId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [READ ALL] - Fetch full customer directory
app.get('/api/customers', isAuthenticated, async (req, res) => {
    try {
        const [customers] = await db.query('SELECT * FROM customer ORDER BY fullname ASC');
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [READ SINGLE] - Lookup single customer profile
app.get('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
        const [customer] = await db.query('SELECT * FROM customer WHERE customer_id = ?', [req.params.id]);
        if (customer.length === 0) return res.status(404).json({ error: 'Customer not found.' });
        res.json(customer[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [UPDATE] - Modify an existing customer profile record
app.put('/api/customers/:id', isAuthenticated, [
    body('fullname').trim().notEmpty().withMessage('Full name cannot be blank'),
    body('phone').trim().notEmpty().withMessage('Phone number cannot be blank'),
    body('email').trim().isEmail().withMessage('Provide a valid email address'),
    body('address').trim().notEmpty().withMessage('Address cannot be blank')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { fullname, phone, email, address } = req.body;
    try {
        const [result] = await db.query(
            `UPDATE customer SET fullname = ?, phone = ?, email = ?, address = ? WHERE customer_id = ?`,
            [fullname, phone, email, address, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Customer record not found.' });
        res.json({ message: 'Customer profile metadata modified successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ====================================================================
// 6. VEHICLE FLEET CRUD ENDPOINTS
// ====================================================================

// [CREATE] - Add a new operational vehicle asset to the fleet
app.post('/api/vehicles', isAuthenticated, [
    body('platenumber').trim().notEmpty().withMessage('Plate number is required'),
    body('brand').trim().notEmpty().withMessage('Vehicle brand is required'),
    body('model').trim().notEmpty().withMessage('Vehicle model description is required'),
    body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid vehicle model year required'),
    body('vehicletype').trim().notEmpty().withMessage('Vehicle class designation type required'),
    body('purchase_price').isDecimal().withMessage('Asset acquisition valuation price is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { platenumber, brand, model, year, vehicletype, purchase_price } = req.body;
    try {
        const [existing] = await db.query('SELECT platenumber FROM vehicle WHERE platenumber = ?', [platenumber]);
        if (existing.length > 0) return res.status(400).json({ error: 'A vehicle asset with this plate number already exists.' });

        await db.query(
            `INSERT INTO vehicle (platenumber, brand, model, year, vehicletype, purchase_price) VALUES (?, ?, ?, ?, ?, ?)`,
            [platenumber, brand, model, year, vehicletype, purchase_price]
        );
        res.status(201).json({ message: 'Vehicle asset logged into fleet pool registry successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [READ ALL] - Fetch entire vehicle fleet pool
app.get('/api/vehicles', isAuthenticated, async (req, res) => {
    try {
        const [vehicles] = await db.query('SELECT * FROM vehicle ORDER BY status ASC, brand ASC');
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [READ SINGLE] - Get specifics on one unique operational vehicle unit
app.get('/api/vehicles/:platenumber', isAuthenticated, async (req, res) => {
    try {
        const [vehicle] = await db.query('SELECT * FROM vehicle WHERE platenumber = ?', [req.params.platenumber]);
        if (vehicle.length === 0) return res.status(404).json({ error: 'Vehicle asset entity not found.' });
        res.json(vehicle[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [UPDATE] - Adjust vehicle condition details or configuration state
app.put('/api/vehicles/:platenumber', isAuthenticated, [
    body('brand').trim().notEmpty().withMessage('Vehicle brand configuration details required'),
    body('model').trim().notEmpty().withMessage('Vehicle model configuration details required'),
    body('status').isIn(['Available', 'Rented', 'Maintenance']).withMessage('Invalid fleet cycle status asset flag supplied')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { brand, model, status } = req.body;
    try {
        const [result] = await db.query(
            `UPDATE vehicle SET brand = ?, model = ?, status = ? WHERE platenumber = ?`,
            [brand, model, status, req.params.platenumber]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Vehicle asset entity not found.' });
        res.json({ message: 'Vehicle asset classification details updated.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [DELETE] - Decommission a vehicle without breaking database relational integrity
app.delete('/api/vehicles/:platenumber', isAuthenticated, async (req, res) => {
    const { platenumber } = req.params;
    try {
        // Change from DELETE to updating the lifecycle status flag
        const [result] = await db.query(
            "UPDATE vehicle SET status = 'Maintenance' WHERE platenumber = ?", 
            [platenumber]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vehicle asset entity not found.' });
        }

        res.json({ message: 'Vehicle asset successfully decommissioned from active deployment pools.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ====================================================================
// 7. OPERATIONS ENDPOINTS: RESERVATION_RENTAL WORKFLOW
// ====================================================================

// [CREATE] - Place a new booking record (Reservation Phase)
app.post('/api/bookings', isAuthenticated, [
    body('customer_id').isInt().withMessage('Valid customer ID is required'),
    body('platenumber').trim().notEmpty().withMessage('Vehicle plate number is required'),
    body('startdate').isDate().withMessage('Valid start date is required'),
    body('enddate').isDate().withMessage('Valid end date is required'),
    body('rentalfee').isDecimal().withMessage('Valid rental fee amount is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { customer_id, platenumber, startdate, enddate, rentalfee } = req.body;
    const user_id = req.session.userId; 

    try {
        const [result] = await db.query(
            `INSERT INTO reservation_rental (customer_id, platenumber, user_id, startdate, enddate, rentalfee) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [customer_id, platenumber, user_id, startdate, enddate, rentalfee]
        );
        res.status(201).json({ message: 'Booking transaction logged successfully', transactionId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [READ ALL] - Fetch full collection of listings with detailed join fields
app.get('/api/bookings', isAuthenticated, async (req, res) => {
    try {
        const [bookings] = await db.query(`
            SELECT rr.*, c.fullname AS customer_name, v.brand, v.model, u.username AS handled_by
            FROM reservation_rental rr
            JOIN customer c ON rr.customer_id = c.customer_id
            JOIN vehicle v  ON rr.platenumber = v.platenumber
            JOIN user u     ON rr.user_id = u.user_id
            ORDER BY rr.transaction_id DESC
        `);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [READ SINGLE] - Extract single transaction entry by primary lookup parameter
app.get('/api/bookings/:id', isAuthenticated, async (req, res) => {
    try {
        const [booking] = await db.query('SELECT * FROM reservation_rental WHERE transaction_id = ?', [req.params.id]);
        if (booking.length === 0) return res.status(404).json({ error: 'Target workflow record not found' });
        res.json(booking[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [UPDATE GENERAL METADATA] - Structural timeline adjustments or metadata calibration
app.put('/api/bookings/:id', isAuthenticated, [
    body('startdate').isDate().withMessage('Valid start date configuration required'),
    body('enddate').isDate().withMessage('Valid return date configuration required'),
    body('rentalfee').isDecimal().withMessage('Valid financial pricing structural adjustments required'),
    body('reservationstatus').trim().notEmpty().withMessage('Reservation status string required'),
    body('rentalstatus').trim().notEmpty().withMessage('Rental status string required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { startdate, enddate, rentalfee, reservationstatus, rentalstatus } = req.body;
    try {
        const [result] = await db.query(
            `UPDATE reservation_rental 
             SET startdate = ?, enddate = ?, rentalfee = ?, reservationstatus = ?, rentalstatus = ? 
             WHERE transaction_id = ?`,
            [startdate, enddate, rentalfee, reservationstatus, rentalstatus, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Target transactional data map not located.' });
        res.json({ message: 'Booking timeline entry data customized successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [UPDATE PHASE 1] - Activate Rental Transition (Car dispatch / Leave Lot)
app.patch('/api/bookings/:id/activate', isAuthenticated, async (req, res) => {
    try {
        const [booking] = await db.query('SELECT platenumber FROM reservation_rental WHERE transaction_id = ?', [req.params.id]);
        if (booking.length === 0) return res.status(404).json({ error: 'Target record not found' });

        const targetPlate = booking[0].platenumber;
        await db.query(
            `UPDATE reservation_rental 
             SET reservationstatus = 'Fulfilled', rentalstatus = 'Ongoing', rentaldate = CURRENT_DATE() 
             WHERE transaction_id = ?`, 
            [req.params.id]
        );
        await db.query("UPDATE vehicle SET status = 'Rented' WHERE platenumber = ?", [targetPlate]);
        res.json({ message: 'Rental processed out successfully. Vehicle shifted to active road operations.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [UPDATE PHASE 2] - Finalize Rental Transition (Car return / Close Transaction)
app.patch('/api/bookings/:id/return', isAuthenticated, async (req, res) => {
    try {
        const [booking] = await db.query('SELECT platenumber FROM reservation_rental WHERE transaction_id = ?', [req.params.id]);
        if (booking.length === 0) return res.status(404).json({ error: 'Target record not found' });

        const targetPlate = booking[0].platenumber;
        await db.query(
            `UPDATE reservation_rental 
             SET rentalstatus = 'Completed', returndate = CURRENT_DATE() 
             WHERE transaction_id = ?`, 
            [req.params.id]
        );
        await db.query("UPDATE vehicle SET status = 'Available' WHERE platenumber = ?", [targetPlate]);
        res.json({ message: 'Vehicle collection verified. Transaction successfully finalized and archived.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [DELETE] - Clear out a transactional record completely
app.delete('/api/bookings/:id', isAuthenticated, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM reservation_rental WHERE transaction_id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Target transaction record not found' });
        res.json({ message: 'Booking entry purged from tracking ledger successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ====================================================================
// Daily Activity Report
app.get('/api/reports/daily', isAuthenticated, async (req, res) => {
    try {
        const [report] = await db.query(`
            SELECT 
                rr.transaction_id, 
                c.fullname AS customer_fullname, 
                c.phone, 
                c.nationalid,
                v.platenumber, 
                v.brand, 
                v.model, 
                v.year, 
                v.vehicletype,
                rr.reservationdate, 
                rr.reservationstatus, 
                rr.rentaldate, 
                rr.rentalfee, 
                rr.rentalstatus, 
                u.username AS processed_by
            FROM reservation_rental rr
            INNER JOIN customer c ON rr.customer_id = c.customer_id
            INNER JOIN vehicle v  ON rr.platenumber = v.platenumber
            INNER JOIN user u     ON rr.user_id = u.user_id
            WHERE rr.reservationdate = CURRENT_DATE() 
               OR rr.rentaldate = CURRENT_DATE() 
               OR rr.returndate = CURRENT_DATE()
            ORDER BY rr.transaction_id DESC
        `);
        res.json(report);
    } catch (err) {
        console.error("DEBUG - Daily Report Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Weekly Performance Summary
app.get('/api/reports/weekly', isAuthenticated, async (req, res) => {
    try {
        const [report] = await db.query(`
            SELECT 
                c.fullname AS customer_fullname, 
                c.phone, 
                c.nationalid,
                v.platenumber, 
                v.brand, 
                v.model, 
                v.year, 
                v.vehicletype,
                rr.reservationdate, 
                rr.reservationstatus, 
                rr.rentaldate, 
                rr.rentalfee, 
                rr.rentalstatus
            FROM reservation_rental rr
            JOIN customer c ON rr.customer_id = c.customer_id
            JOIN vehicle v  ON rr.platenumber = v.platenumber
            WHERE YEARWEEK(rr.startdate, 0) = YEARWEEK(CURRENT_DATE(), 0)
        `);
        res.json(report);
    } catch (err) {
        console.error("DEBUG - Weekly Report Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Monthly Operational Summary
app.get('/api/reports/monthly', isAuthenticated, async (req, res) => {
    try {
        const [report] = await db.query(`
            SELECT 
                c.fullname AS customer_fullname, 
                c.phone, 
                c.nationalid,
                v.platenumber, 
                v.brand, 
                v.model, 
                v.year, 
                v.vehicletype,
                rr.reservationdate, 
                rr.reservationstatus, 
                rr.rentaldate, 
                rr.rentalfee, 
                rr.rentalstatus
            FROM reservation_rental rr
            JOIN customer c ON rr.customer_id = c.customer_id
            JOIN vehicle v  ON rr.platenumber = v.platenumber
            WHERE MONTH(rr.startdate) = MONTH(CURRENT_DATE())
              AND YEAR(rr.startdate) = YEAR(CURRENT_DATE())
        `);
        res.json(report);
    } catch (err) {
        console.error("DEBUG - Monthly Report Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ====================================================================
// 9. PROCESS EXECUTABLE INITIALIZATION
// ====================================================================
app.listen(PORT, () => {
    console.log(`Server executing securely on port ${PORT}`);
});
