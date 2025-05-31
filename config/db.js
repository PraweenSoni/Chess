const mongoose = require('mongoose');
// mongoose.set('debug', true);
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('*----------< Connected to MongoDB >-----------*'))
  .catch(err => console.error(err));

module.exports = mongoose;
