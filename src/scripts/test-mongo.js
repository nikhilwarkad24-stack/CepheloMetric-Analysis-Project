// Simple MongoDB connection tester.
// Usage (PowerShell):
//   $env:MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority'
//   node .\src\scripts\test-mongo.js
// Usage (CMD):
//   set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority && node src\scripts\test-mongo.js

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('ERROR: MONGODB_URI environment variable is not set. See .env.example.');
  process.exit(1);
}

function maskConnectionString(u) {
  try {
    return u.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
  } catch (e) {
    return '***';
  }
}

console.info('Using MONGODB_URI:', maskConnectionString(uri));

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    console.info('Connecting to MongoDB...');
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } catch (err) {
    console.error('Connection test failed:', err.message || err);
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => {});
  }
}

run().catch(err => {
  console.error('Unexpected error:', err);
  process.exitCode = 1;
});