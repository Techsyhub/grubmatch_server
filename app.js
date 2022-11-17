const express = require("express");
var mongoose = require("mongoose");
const cors = require("cors");
const config = require("./config");
const app = express();
const http = require("http")
const socketIO = require ("socket.io")


//allowing cors
app.use(cors())

const server = http.createServer(app);
const io = socketIO(server, {
  cors:{
    origin:"*"
  }
})

// io.on("connection", socket=>{
//   console.log("A user is connected");
  
//   socket.on("message", message=> {
//     console.log(`message from ${socket.id}: ${message}`)
//   })
  
//   socket.on ('discount', ()=>{
//     console.log(`socket ${socket.id} disconnected`)
//   })
// })

// module.exports = {io}
const socketRouter= require("./route/socketRoute")(io)


app.use("/", socketRouter)


const port = process.env.PORT || config.PORT;


mongoose
  .connect(config.MONGO_URI , { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Mongodb connected"))
  .catch((e) => console.log("Mongodb connection error",e));

// Middlevare




//to access request body we used express.json() middleware. It is available in Express v4.160 onwards.
app.use(express.json())


//to access url-encoded request body we used express.urlencoded()
app.use(express.urlencoded({ extended: true }))

app.get('/', function (req, res) {
  res.send('hello, world! Grubmatch is alive')
})

server.listen(port, () =>  console.log(`Grubmatch server listening on port ${port}`));


