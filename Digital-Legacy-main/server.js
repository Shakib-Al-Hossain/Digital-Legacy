const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cse470_project').then(() => {
    console.log('MongoDB connected');
}).catch(err => console.log(err));

// Routes placeholder
// Routes
app.use('/api/auth', require('./route/authRoute'));
app.use('/api/profile', require('./route/profileRoute'));
app.use('/api/vault', require('./route/vaultRoute'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
