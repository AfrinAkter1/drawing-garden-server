const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.port || 5000
require('dotenv').config()

// middlewire
app.use(cors())
app.use(express.json())
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY)

const verifyJWT = (req, res, next)=>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized access'})
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err){
      return res.status(401).send({error: true, message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next();
  })
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
     client.connect();

    const homeCollection = client.db("assignment12").collection("homeDB");
    const userCollection = client.db('assignment12').collection('users');
    const classesCollection = client.db('assignment12').collection('classes');
    const selectCollection = client.db('assignment12').collection('select');
    const paymentCollection = client.db('assignment12').collection('payment');

    app.post('/jwt', (req,res) =>{
      const user = req.body;
      const token  = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '24h'})
      res.send({ token })
    })
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
        return res.send({ message: 'user already exist' })
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    app.get('/users', async(req, res)=>{
      const result = await userCollection.find().toArray()
      res.send(result)
    })

// admin
app.get('/users/admin/:email',verifyJWT, async(req, res)=>{
  const email = req.params.email;
  if(req.decoded.email !== email){
    res.send({ admin: false})
  }

  const query = { email: email}
  const user = await userCollection.findOne(query)
  const result = { admin: user?.role === 'admin'}
  res.send(result)
})

    app.patch('/users/admin/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await userCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })
// instractor
    app.get('/users/instractor/:email',verifyJWT, async(req, res)=>{
      const email = req.params.email;
      if(req.decoded.email !== email){
        res.send({ instractor: false})
      }
    
      const query = { email: email}
      const user = await userCollection.findOne(query)
      const result = { instractor: user?.role2 === 'instractor'}
      res.send(result)
    })

    app.patch('/users/instractor/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set: {
          role2: 'instractor'
        },
      };
      const result = await userCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })
// User delete
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })

     // All Instractor classes api data
    app.post('/addClass', async (req, res) => {
      const query = req.body;
      const result = await classesCollection.insertOne(query);
      res.send(result);
    })
    // admin manage Users for APi show data all add instractor Class
    app.get('/allClasses', async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    })
      // only my All Class get api
    app.get('/myAllClass', verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' });
      }
      const query = { email: email }
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    })
      // home page Class and all Classes route this approve class show
    app.get('/allApprovedClasses/:text', async (req, res) => {
      const result = await classesCollection.find({ status: req.params.text }).toArray();
      res.send(result);

    })
    // Home page popular class show get api routes
    app.get('/popularClass/:status', async (req, res) => {
      // console.log(req.params.status);
      const limitClass = 6;
      const result = await classesCollection.find({ status: req.params.status }).sort({ student: -1 }).limit(limitClass).toArray();
      res.send(result);
    })
    // Admin deny and send feedback instractor class findOne
    app.put('/addClasses/:id', async (req, res) => {
      const id = req.params.id;
      const feedback = req.body.feedback; 
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $push: { feedback: feedback } 
      };
      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

 // admin approved classes apis:
    app.patch('/classes/:id', async (req, res) => {
      const id = req.params.id;
      const status = req.query.status;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: status,
        }
      };
      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);
    })
    // Delete my class
    app.delete('/myClass/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.deleteOne(query);
      res.send(result)
    })
     // ok selected class get
    app.get('/selectClass', verifyJWT, async (req, res) => {
      const email = req.query.email;
      // console.log(email)
      if (!email) {
        return res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' });
      }
      const query = { email: email }
      const result = await selectCollection.find(query).toArray();
      res.send(result);
    })
     // payment er jonno kaj start

//     // Id dore payment kaj baki new****
    app.get("/selectClass/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectCollection.findOne(query);
      res.send(result);
    });

    // select Class cats theke delete
    app.delete('/selectClass/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await selectCollection.deleteOne(query);
      res.send(result);
    })

// User Select button click to set mongodb
    app.post("/selectClass", async (req, res) => {
      const item = req.body;

      const result = await selectCollection.insertOne(item);
      return res.send(result);
    });

//     // create payment intent
    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", verifyJWT, async (req, res) => {
      const payment = req.body;
      const id = payment.id;
      const filter = { id: id };
      const query = {
        _id: new ObjectId(id),
      };
      const existingPayment = await paymentCollection.findOne(filter);
      if (existingPayment) {
        return res.send({ message: "Already Enrolled This Class" })
      }
      const insertResult = await paymentCollection.insertOne(payment);
      const deleteResult = await selectCollection.deleteOne(query);
      return res.send({ insertResult, deleteResult });
    });


    app.patch("/all-classes/seats/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateClass = await classesCollection.findOne(filter);
      if (!updateClass) {
        console.log("Seat not found");
        return;
      }
      const updateEnrollStudent = updateClass.student + 1;
      const updatedAvailableSeats = updateClass.seats - 1;
      const update = {
        $set: {
          seats: updatedAvailableSeats,
          student: updateEnrollStudent,
        },
      };
      const result = await classesCollection.updateOne(filter, update);
      res.send(result);
    });
    app.get('/payments', verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' });
      }
      const query = { email: email }
      const result = await paymentCollection.find(query).sort({ date: -1 }).toArray()
      res.send(result);
    })

  //All instractors get data
    app.get('/allInstractors/:text', async (req, res) => {
      const result = await userCollection.find({ role2: req.params.text }).toArray();
      res.send(result);
    })
    app.get('/popularInstractors/:text', async (req, res) => {
      const limitInstractor = 6;
      const result = await userCollection.find({ role2: req.params.text }).limit(limitInstractor).toArray();
      res.send(result);
    })
    // Send a ping to confirm a successful connection
    client.db("admin").command({ ping: 1 });
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