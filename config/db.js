const mongoose = require('mongoose');
// mongoose.set('debug', true);
mongoose.connect(process.env.MONGODB_URI, {
  tls: true,             // force TLS, avoids Render TLSv1.3 bug
  family: 4,             // prefer IPv4 (Render DNS issues are rare but possible)
  socketTimeoutMS: 10000 // optional: timeout if DB is slow to respond
})
  .then(() => console.log('----------< Connected to MongoDB Atlas >-----------'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    // Optional: prevent app crash
    // process.exit(1); 
  });

module.exports = mongoose;
