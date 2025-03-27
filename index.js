const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const hbs = require('hbs');

const { User, Store, createProductModel } = require('./models');

const app = express();
const port = 3000;

// Setup Handlebars and Middleware
hbs.registerHelper('eq', (a, b) => a === b);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secure_session_secret_123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'templates'));
app.use(express.static(path.join(__dirname, 'public')));

// Auth middleware
function ensureAuthenticated(req, res, next) {
    if (!req.session.user) {
        console.error('Unauthorized access.');
        return res.redirect('/login');
    }
    next();
}

// Routes
app.get('/', ensureAuthenticated, async (req, res) => {
    const ProductModel = createProductModel(req.session.user.storeId);
    const lowStockProducts = await ProductModel.find({ inventory: { $lt: 5 } });
    const outOfServiceLabels = await ProductModel.find({ inventory: 0 });
    res.render('home', { lowStockProducts, outOfServiceLabels });
});

app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/home');
    res.render('login');
});

app.get('/signup', (req, res) => res.render('signup'));

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

app.get('/home', ensureAuthenticated, async (req, res) => {
    const ProductModel = createProductModel(req.session.user.storeId);
    const products = await ProductModel.find();
    res.render('home', {
        name: req.session.user.name,
        storeName: req.session.user.storeName,
        products
    });
});

app.get('/inventory', ensureAuthenticated, async (req, res) => {
    const ProductModel = createProductModel(req.session.user.storeId);
    const products = await ProductModel.find();
    res.render('inventory', { products });
});

app.get('/add-product', ensureAuthenticated, (req, res) => res.render('add-product'));

app.post('/add-product', ensureAuthenticated, async (req, res) => {
    const ProductModel = createProductModel(req.session.user.storeId);
    const newProduct = new ProductModel({
        ...req.body,
            storeId: req.session.user.storeId,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
    });
    await newProduct.save();
    res.redirect('/inventory');
});

app.get('/delete-product/:id', ensureAuthenticated, async (req, res) => {
    const ProductModel = createProductModel(req.session.user.storeId);
    await ProductModel.findByIdAndDelete(req.params.id);
    res.redirect('/inventory');
});

app.get('/modify-product', ensureAuthenticated, async (req, res) => {
    const ProductModel = createProductModel(req.session.user.storeId);
    const products = await ProductModel.find({});
    res.render('modify-product', { products });
});

app.get('/edit-product/:id', ensureAuthenticated, async (req, res) => {
    const productId = req.params.id;
    const ProductModel = createProductModel(req.session.user.storeId);

    try {
        const product = await ProductModel.findById(productId);
        if (!product) return res.status(404).send("Product not found");

        res.render('edit-product', { product });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send("Internal Server Error");
    }
});


app.post('/signup', async (req, res) => {
    const { name, email, password, confirmPassword, phone, storeName, storeAddress } = req.body;

    if (!name || !email || !password || !confirmPassword || !storeName || !storeAddress)
        return res.status(400).send('All fields are required.');

    if (password.length < 8) return res.status(400).send('Password must be at least 8 characters.');
    if (password !== confirmPassword) return res.status(400).send('Passwords do not match.');

    try {
        // ⚠️ FIX: Check/create store using Store from storeDB
        let store = await Store.findOne({ storeName });
        if (!store) {
            store = new Store({ storeName, storeAddress });
            await store.save();
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).send('Email is already registered.');

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            storeName,
            storeAddress,
            storeId: store._id  // this links correctly to storeDB
        });

        await newUser.save();
        res.redirect('/login');
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).populate('storeId');
        if (!user) return res.status(400).send('User not found');

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).send('Invalid credentials');

        req.session.user = {
            id: user._id,
            name: user.name,
            storeId: user.storeId._id,
            storeName: user.storeId.storeName
        };
        res.redirect('/home');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/update-product/:id', ensureAuthenticated, async (req, res) => {
    const productId = req.params.id;
    const ProductModel = createProductModel(req.session.user.storeId);

    try {
        await ProductModel.findByIdAndUpdate(productId, req.body, { new: true });
        res.redirect('/inventory');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send("Internal Server Error");
    }
});



app.listen(port, () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
});
