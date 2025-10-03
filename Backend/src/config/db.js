const mongoose = require('mongoose');

/** 
 * Database Singleton: ensure a single shared DB connection (only one instance):contentReference[oaicite:0]{index=0} 
 * using MongoDB via Mongoose.
 */
class Database {
  static instance;
  static async connect(uri) {
    if (!Database.instance) {
      // Connect to MongoDB (useUnifiedTopology for stable connection)
      Database.instance = await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("MongoDB connected");
    }
    return Database.instance;
  }
}

module.exports = Database;
