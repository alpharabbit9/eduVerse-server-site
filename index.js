const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // secret key



const port = process.env.PORT || 5000;

const app = express();

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.chblh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const courseCollection = client.db('eduerseDB').collection('courses');
    const ConfirmedCourseCollection = client.db('eduerseDB').collection('confirmedCourse');
    const userCollection = client.db('eduerseDB').collection('users');
    const teacherRequestCollection = client.db('eduerseDB').collection('teacherRequest');
    const paymentsCollection = client.db('eduerseDB').collection('payments');


    // ! User Related API

    app.get('/users', async (req, res) => {

      const result = await userCollection.find().toArray()

      res.send(result)
    })

    app.get('/users/profileDetails/:email' , async(req,res) =>{

      const email = req.params.email ;

      const query = {email :email};

      const result = await userCollection.findOne(query);

      res.send(result);
    })

    app.post('/users', async (req, res) => {

      const user = req.body;

      // console.log(user)

      const query = { email: user.email }

      const existUser = await userCollection.findOne(query);

      if (existUser) {
        return res.send({ message: 'User Already Exist', insertedId: null })
      }

      const result = await userCollection.insertOne(user)
    })

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await userCollection.deleteOne(query);

      res.send(result)
    })

    app.patch('/users/teacher/:email', async (req, res) => {

      const email = req.params.email;

      const filter = { email: email }

      const updatedDoc = {
        $set:
        {

          role: 'teacher'
        }
      }

      const result = await userCollection.updateOne(filter, updatedDoc);

      res.send(result)



    })

    app.patch('/users/reject/:email', async (req, res) => {

      const email = req.params.email;

      const filter = { email: email }

      const updatedDoc = {

        $set: {
          role: "student"
        }
      }

      const result = await userCollection.updateOne(filter, updatedDoc);

      res.send(result)
    })


    // !  Admin API 

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;

      const filter = { _id: new ObjectId(id) };

      const updatedDoc = {
        $set:
        {
          role: 'admin'
        }
      }

      const result = await userCollection.updateOne(filter, updatedDoc)

      res.send(result)


    })


    // ! Teacher Related API

    app.get('/teacherRequest', async (req, res) => {

      const result = await teacherRequestCollection.find().toArray()
      res.send(result)
    })

    app.post('/teacherRequest', async (req, res) => {
      const request = req.body;

      const query = { email: req.body.teacher_email };

      const isExist = await teacherRequestCollection.findOne(query)

      if (isExist) {
        return res.status(400).send({ message: "Request already exists" });
      }

      const result = await teacherRequestCollection.insertOne(request);

      res.send(result)
    })

    app.patch('/teacherRequest/:id', async (req, res) => {

      const id = req.params.id;

      const filter = { _id: new ObjectId(id) }

      const updatedDoc = {
        $set:
        {
          status: 'Approved'
        }
      }

      const result = await teacherRequestCollection.updateOne(filter, updatedDoc);

      res.send(result)
    })

    app.patch('/teacherRequest/reject/:id', async (req, res) => {

      const id = req.params.id;

      const filter = { _id: new ObjectId(id) }

      const updatedDoc = {

        $set: {

          status: "rejected"

        }

      }

      const result = await teacherRequestCollection.updateOne(filter, updatedDoc)

      res.send(result)
    })





    //! Course Related API

    app.get('/courses', async (req, res) => {
      const result = await courseCollection.find().toArray();
      res.send(result)
    })

    // ? Courses search by email 

    app.get('/courses/:email', async (req, res) => {

      const email = req.params.email;

      const query = { email: email }

      const result = await courseCollection.find(query).toArray();

      res.send(result)
    })

    app.put('/courses/:id', async (req, res) => {
      const id = req.params.id;
      const updatedCourse = req.body;

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updatedCourse
      };

      const result = await courseCollection.updateOne(filter, updateDoc);
      res.send(result);
    });


    app.post('/courses', async (req, res) => {

      const course = req.body;

      const result = await courseCollection.insertOne(course)

      res.send(result)
    })

    app.delete('/course/delete/:id', async (req, res) => {

      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await courseCollection.deleteOne(query);

      res.send(result);
    })

    app.patch('/courses/:id', async (req, res) => {
      const id = req.params.id;

      const filter = { _id: new ObjectId(id) }

      const updatedDoc = {

        $set: {

          status: "Approved"

        }
      }

      const result = await courseCollection.updateOne(filter, updatedDoc)

      res.send(result)
    })
    app.patch('/courses/reject/:id', async (req, res) => {
      const id = req.params.id;

      const filter = { _id: new ObjectId(id) }

      const updatedDoc = {

        $set: {

          status: "Rejected"

        }
      }

      const result = await courseCollection.updateOne(filter, updatedDoc)

      res.send(result)
    })

    // ! Confirmed Course API

    app.get("/confirmedCourse", async (req, res) => {
      const result = await ConfirmedCourseCollection.find().toArray()
      res.send(result)
    })

    app.post('/confirmedCourse', async (req, res) => {

      const course = req.body;

      console.log(req.body)

      const result = await ConfirmedCourseCollection.insertOne(course);

      res.send(result)
    })

    app.delete('/confirmedCourse/:title', async (req, res) => {

      const title = req.params.title;

      const query = { title: title };

      const isCourse = await ConfirmedCourseCollection.findOne(query);

      if (!isCourse) {
        return res.send({ message: "Course not found" })
      }

      const result = await ConfirmedCourseCollection.deleteOne(query);

      res.send(result)
    })

    app.get('/confirmedCourse/id/:id', async (req, res) => {
      const id = req.params.id;

      try {
        const query = { _id: new ObjectId(id) };
        const result = await ConfirmedCourseCollection.findOne(query);

        if (!result) {
          return res.status(404).send({ error: "Course not found" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error fetching course by ID:", error);
        res.status(500).send({ error: "Invalid ID or Server Error" });
      }
    });







    app.get('/learnToday', async (req, res) => {
      const result = await ConfirmedCourseCollection.find()
        .sort({ totalEnrollment: -1 })
        .limit(4)
        .toArray();
      res.send(result)
    })


    // ! Payment 

   app.post('/payments' , async(req,res) =>{
    const payment = req.body ;

    const result = await paymentsCollection.insertOne(payment);

    res.send(result);
   })

   app.get('/payments/:email' , async(req,res) =>{
    const email = req.params.email;

    const query = {email:email};

    const result = await paymentsCollection.find(query).toArray()

    res.send(result)
   })

   app.get('/payments/details/:id' ,  async(req , res) =>{

    const id  =  req.params.id  ;

    const query = {_id : new ObjectId(id)};

    const result = await paymentsCollection.findOne(query);

    res.send(result);
   })







  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send("To achieve extraordinary things in lfe , you have to do extraordinary things")
})

app.listen(port, () => {
  console.log(`Reporting from port : ${port}`)
})
