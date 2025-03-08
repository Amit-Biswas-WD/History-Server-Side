const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log(process.env.DB_USER);

// const uri = `mongodb+srv://history_server:HrvpJhviV5jglHRj@cluster0.yit3t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yit3t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const historyCollection = client.db("historyServer").collection("history");
    const artifactCollection = client
      .db("historyServer")
      .collection("artifacts");

    // post artifacts data
    app.post("/artifacts", async (req, res) => {
      const user = req.body;
      console.log("product", user);
      const result = await artifactCollection.insertOne(user);
      res.send(result);
    });

    // read artifacts data
    app.get("/artifacts", async (req, res) => {
      const cursor = await artifactCollection.find().toArray();
      res.send(cursor);
    });

    // specific id
    app.get("/artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await artifactCollection.findOne(query);
      res.send(result);
    });

    // delete artifacts 
    app.delete("/artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await artifactCollection.deleteOne(query);
      res.send(result);
    });

    // read history data
    app.get("/history", async (req, res) => {
      const cursor = await historyCollection.find().toArray();
      res.send(cursor);
    });

    // see single value history data
    app.get("/history/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await historyCollection.findOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("History Project is Running.");
});

app.listen(port, () => {
  console.log(`History Project is port: ${port}`);
});
