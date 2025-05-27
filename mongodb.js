const mongoose = require('mongoose');

// Connection for user authentication (LoginSignUpDetails)
const userDB = mongoose.createConnection('mongodb://127.0.0.1:27017/LoginSignUpDetails', {
    serverSelectionTimeoutMS: 5000,
});

// Connection for store and product management (stores DB)
const storeDB = mongoose.createConnection('mongodb://127.0.0.1:27017/stores', {
    serverSelectionTimeoutMS: 5000,
});

// Store Schema
const storeSchema = new mongoose.Schema({
    storeName: { type: String, required: true, unique: true },
    storeAddress: { type: String, required: true },
});

// Register models clearly in both DBs
const StoreUser = userDB.model('Store', storeSchema); // For populating User schema
const Store = storeDB.model('Store', storeSchema);    // For actual Store operations

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    storeName: { type: String, required: true },
    storeAddress: { type: String, required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    notifications: [{
    message: { type: String, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId },
    storeId: { type: mongoose.Schema.Types.ObjectId },   // ✅ ADD THIS
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
    }]




});

const User = userDB.model('User', userSchema);

// Function to create product model dynamically
const createProductModel = (storeId) => {
    const modelName = `Product_${storeId}`;
    if (storeDB.models[modelName]) {
        return storeDB.models[modelName];
    }

    const ProductSchema = new mongoose.Schema({
        name: { type: String, required: true },
        price: { type: Number, required: true },
        inventory: { type: Number, required: true },
        category: { type: String, required: true },
        description: { type: String },
        discount: { type: Number, default: 0 },
        expiryDate: { type: Date },
        eslImage: { type: String }, // ESL Image URL
        lowStockThreshold: { type: Number, default: 0 },
        brandName: { type: String },
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    });

    return storeDB.model(modelName, ProductSchema, `User_${storeId}`);
};

module.exports = {
    User,
    Store,       // Use for actual store operations
    StoreUser,   // Use for populating in User schema
    createProductModel,
};
