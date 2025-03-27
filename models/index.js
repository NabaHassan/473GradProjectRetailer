const mongoose = require('mongoose');

// DB connections
const userDB = mongoose.createConnection('mongodb://127.0.0.1:27017/LoginSignUpDetails');
const storeDB = mongoose.createConnection('mongodb://127.0.0.1:27017/stores');

// Store schema
const storeSchema = new mongoose.Schema({
    storeName: String,
    storeAddress: String,
});
const Store = userDB.model('Store', storeSchema);
storeDB.model('Store', storeSchema); // just for products

// User schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    phone: String,
    storeName: String,
    storeAddress: String,
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
});
const User = userDB.model('User', userSchema);

// Dynamic product model
const createProductModel = (storeId) => {
    const modelName = `Product_${storeId}`;
    if (storeDB.models[modelName]) return storeDB.models[modelName];

    const ProductSchema = new mongoose.Schema({
        name: String,
        price: Number,
        inventory: Number,
        category: String,
        description: String,
        discount: Number,
        expiryDate: Date,
        eslCode: Number,
        lowStockThreshold: Number,
        brandName: String,
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },

    });

    return storeDB.model(modelName, ProductSchema, `product_${storeId}`);
};

module.exports = { User, Store, createProductModel };
