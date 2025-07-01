const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('*----------< Connected to MongoDB >-----------*'))
  .catch(err => console.error(err));

// async function connectDB() {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI, {
//       tls: true,              // force TLS encryption
//       family: 4,              // prefer IPv4
//       socketTimeoutMS: 10000, // quick fail if no connection
//     });
//     console.log('✅ Connected to MongoDB Atlas');
//   } catch (err) {
//     console.error('❌ MongoDB connection failed:', err.message);
//     console.error('💥 Full error:', err);
//     process.exit(1);
//   }
// }

// connectDB();

module.exports = mongoose;
