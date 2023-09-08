const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const app = express();
const port = 3005;
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

const uri =
  "mongodb+srv://Task-Management:mDKp7HxctiuER81S@cluster0.ivmjea7.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const userCollection = client.db("Task-Management").collection("users");
    const taskCollection = client.db("Task-Management").collection("tasks");

    app.post("/api/createUser", upload.single("img"), async (req, res) => {
      console.log(req.body);
      const { name, email, password } = req.body;
      if (!req.file) {
        return res.json({ error: "Please provide an image" });
      }

      const img = req.file.path;

      if (!name || !email || !password) {
        return res.json({ error: "Please provide name, email, and password" });
      }
      if (password.length < 6) {
        return res.json({
          error: "Password length should be at least 6 characters",
        });
      }
      const existingUser = await userCollection.findOne({ email });
      if (existingUser) {
        return res.json({ error: "Email is already taken" });
      }

      const result = await userCollection.insertOne({
        name,
        email,
        password,
        img,
      });
      res.json({ success: "Congratulations! Sign Up successful" });
    });

    app.post("/api/loginUser", async (req, res) => {
      console.log(req.body);
      const { email, password } = req.body;

      const filterUser = await userCollection.findOne({ email, password });

      if (!filterUser) {
        res.json({ error: "User not found" });
      } else if (filterUser.password !== password) {
        res.json({ error: "Password not match" });
      } else {
        const userData = {
          email: filterUser.email,
          id: filterUser._id,
          name: filterUser.name,
          bio: filterUser?.bio,
          img: filterUser?.img,
        };

        res.json({
          success: "Congratulations! Logged in successfully",
          userData,
        });
      }
    });

    app.put("/api/editProfile/:id", upload.single("img"), async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const update = {
        $set: {
          name: req.body.name,
          bio: req.body.bio,
          img: req.file.path,
        },
      };
      const options = { upsert: true };
      const result = await userCollection.updateOne(filter, update, options);
      res.send(result);
    });

    // Taks Manage API
    app.post("/api/manageTasks", async (req, res) => {
      const newTask = req.body;
      console.log(newTask);
      const result = await taskCollection.insertOne(newTask);
      res.send(result);
    });
    app.get("/api/manageTasks", async (req, res) => {
      const query = {};
      const result = await taskCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/api/manageTasks/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.findOne(query);
      res.send(result);
    });
    app.delete("/api/manageTasks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/api/assignTasks/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email, 118);
      const query = { assignTask: { $in: [email] } };
      const result = await taskCollection.findOne(query);
      res.send(result);
    });

    app.put("/api/assignTasks/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: "Completed",
        },
      };
      const result = await taskCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // userCollection API
    app.get("/api/users", async (req, res) => {
      const query = {};
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/api/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
