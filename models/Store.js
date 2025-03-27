const mongoose = require('mongoose');
const { retailerDB } = require('../config'); // Make sure path is correct

const StoreSchema = new mongoose.Schema({
  storeName: String,
  email: String,
  phone: String,
  storeAddress: String
}, { collection: 'users' }); // or 'userdetails' if that’s your actual collection

module.exports = retailerDB.model('Store', StoreSchema);
