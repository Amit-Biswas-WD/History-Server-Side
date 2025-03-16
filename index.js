const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.use(express.json());
app.use(cookieParser());

const logger = (req, res, next) => {
  console.log("inside the logger");
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};


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
    const artifactColl = client.db("historyServer").collection("artifacts");

    // Auth Related Api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    // post artifacts data
    app.post("/artifacts", async (req, res) => {
      const user = req.body;
      const result = await artifactColl.insertOne(user);
      res.send(result);
    });

    // read artifacts data
    // app.get("/artifacts", async (req, res) => {
    //   const cursor = await artifactColl.find().toArray();
    //   res.send(cursor);
    // });

    // get some data
    app.get("/artifacts", verifyToken, async (req, res) => {
      // console.log("now inside the api callback");
      const email = req.query.email;
      const query = { email: email };

      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: "Forbidden access" });
      }

      // console.log("cuk cuk cookies", req.cookies);
      const result = await artifactColl.find(query).toArray();
      res.send(result);
    });

    // // specific id
    app.get("/artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await artifactColl.findOne(query);
      res.send(result);
    });

    // delete artifacts
    app.delete("/artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await artifactColl.deleteOne(query);
      res.send(result);
    });

    // update artifacts
    app.put("/artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const artifact = req.body;
      console.log(id, artifact);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateUser = {
        $set: {
          name: artifact.name,
          artifactType: artifact.artifactType,
          historicalContext: artifact.historicalContext,
          createdAt: artifact.createdAt,
          discoveredAt: artifact.discoveredAt,
          photo: artifact.photo,
          location: artifact.location,
        },
      };
      const result = await artifactColl.updateOne(filter, updateUser, options);
      res.send(result);
    });

    // read history data
    app.get("/history", logger, async (req, res) => {
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
