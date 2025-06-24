const mongoose = require('mongoose');

// Optional retry wrapper
async function connectWithRetry(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        tls: true,              // force TLS, prevent Render's TLSv1.3 bug
        family: 4,              // prefer IPv4 for DNS/IP stability
        socketTimeoutMS: 10000, // fail quickly on bad connection
      });

      console.log('✅ Connected to MongoDB Atlas');
      return;
    } catch (err) {
      console.error(`❌ MongoDB connection failed (attempt ${i + 1}): ${err.message}`);
      if (i < retries - 1) {
        console.log(`🔁 Retrying in ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        console.error('❌ All MongoDB connection attempts failed. Exiting app...');
        process.exit(1); // Only exit if DB is critical
      }
    }
  }
}

connectWithRetry();

module.exports = mongoose;

