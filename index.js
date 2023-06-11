const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.port || 5000
require('dotenv').config()

// middlewire
app.use(cors())
app.use(express.json())





const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.SECRET_USER}:${process.env.SECRET_PASS}@cluster0.wcry9bp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const homeCollection = client.db("assignment12").collection("homeDB");
    const userCollection = client.db('assignment12').collection('users')
    app.get('/home', async(req, res) =>{
        const result = await homeCollection.find().toArray()
        res.send(result)
    })

    // users
    app.post('/users', async(req,res)=>{
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    })
    app.get('/users', async(req, res)=>{
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req,res) =>{
    res.send('server is running')
})

app.listen(port, () =>{
    console.log(`server is running on port ${port}`)
})