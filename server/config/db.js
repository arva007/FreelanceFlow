const mongoose = require('mongoose');

const connectDB = async () => {
  // Support both MONGODB_URI (current .env) and MONGO_URI (legacy key name)
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.error(
      '❌ MongoDB URI not found. Make sure MONGODB_URI is set in server/.env'
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    // querySrv ECONNREFUSED means the system DNS server cannot resolve the
    // Atlas SRV record. This is a network/DNS issue — NOT a code issue.
    // Fix: change your DNS to 8.8.8.8 / 8.8.4.4 (see README for steps).
    if (error.message && error.message.includes('querySrv ECONNREFUSED')) {
      console.error(
        '\n⚠️  DNS Issue Detected:\n' +
        '   Your system DNS server is blocking the MongoDB Atlas SRV lookup.\n' +
        '   This cannot be fixed by changing JavaScript code.\n' +
        '   Action required — change your DNS server to Google Public DNS:\n' +
        '     Primary:   8.8.8.8\n' +
        '     Secondary: 8.8.4.4\n' +
        '   See README.md for step-by-step instructions.\n'
      );
    }

    process.exit(1);
  }
};

module.exports = connectDB;
