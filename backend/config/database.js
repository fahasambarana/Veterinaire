const mongoose = require('mongoose');

const connectDB = async () => {

    mongoose.connect(process.env.MONGO_URI,
        { useNewUrlParser: true,
        useUnifiedTopology: true })
        .then(() => console.log('Mande tsara ny database'))
        .catch((err) => console.error('Database connection failed:', err));
}

module.exports = connectDB;