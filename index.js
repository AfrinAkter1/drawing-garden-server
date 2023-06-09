const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.port || 5000

// middlewire
app.use(cors())
app.use(express.json())

app.get('/', (req,res) =>{
    res.send('server is running')
})

app.listen(port, () =>{
    console.log(`server is running on port ${port}`)
})