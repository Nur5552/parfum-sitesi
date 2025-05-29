const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017"; 
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("parfumdb");
    const collection = db.collection("parfums");

    const data = await collection.find().toArray();
    console.log(data);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
