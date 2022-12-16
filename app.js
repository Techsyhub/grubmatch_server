const express = require("express")
const app = express()
const http = require("http")
var mongoose = require("mongoose");
const config = require("./config");
const { Server } = require("socket.io")
const Room = require("./models/room");
const { sendNotification } = require("./controller/notification")
const yelp = require("yelp-fusion");

const server = http.createServer(app)
const io = new Server(server);


const YELP_CLIENT = yelp.client(config.YELP_KEY );

const port = process.env.PORT || 3001;
app.get("/", (req, res) => {
  res.send("hello world");
})

app.use(express.json())


mongoose
  .connect(config.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Mongodb connected"))
  .catch((e) => console.log("Mongodb connection error", e));


  app.post("/createRoom", async (req, res) => {
    // console.log(req.query)

    try {

      const { name, zip, radius, code, location, deviceId, fcm_token } = req.body
      if (!name, !zip, !radius, !code, !location.longitude, !deviceId, !fcm_token) {
        res.json({ error: "Required fields are missing" })
      } else {
        YELP_CLIENT
          .search({
            term: "food",
            longitude: location.longitude,
            latitude: location.latitude,
          })
          .then(async (response) => {
            var apiData = response.jsonBody;

            const obj = {
              name,
              zip,
              radius,
              code,
              fcmTokenList: [fcm_token],
              location: {
                longitude: location.longitude,
                latitude: location.latitude,
              },
              resturentData: apiData,
              userList: [{ name, deviceId, host: true }]
            }

            const Data = new Room(obj);
            const roomData = await Data.save();
            // socket.on('create', function(roomData) {
            //   socket.join(roomDatsa);
            // });

            const responce = {
              message: "create",
              error: false,
              data: roomData,
            };

            res.json(responce);


          })
          .catch((error) => {
            console.log(error)
            const responce = {
              error: true,
              error: error,
            };
            res.json(responce);

          });

      }

    } catch (error) {
      console.log("errror", error)
      const responce = {
        error: true,
        error: error,
      };
      res.json(responce);
    }
  })

  app.post("/joinRoom", async (req, res) => {
    const { name, code, deviceId, fcm_token } = req.body;

    try {
      if (!code || !name || !deviceId || !fcm_token) {
        res.send("Please Fill The Input Correctly");
      } else {
        let result = await Room.find({ code: code });

        if (result && result[0]) {
          result = result[0]
          console.log(result.code, code, typeof result.code, typeof code, result.code === code)
          if (result.code !== code) {
            res.json({
              error: "Invalid Code"
            });

          } else {

            const isUserExist = result.userList.find(item => item.deviceId === deviceId)
            if (isUserExist) {

              res.json({
                error: "User already exist"
              })
            } else {
              let userList = result.userList
              userList.push({ deviceId, host: false, name })

              let fcmTokenList = result.fcmTokenList
              fcmTokenList.push(fcm_token)

              let updateRoom = await Room.updateOne({ code: code }, { userList, fcmTokenList });


              // io.on("connection", async (socket) => {
              //   socket.join(Room._id);

              //   // and then later
              //   io.to(Room).emit(response);

              // });
            
              console.log("update Room ______", updateRoom)
              if (updateRoom.acknowledged) {
                sendNotification({
                  title: name + " joined the room!",
                   fcmTokenList: fcmTokenList 
                  },
                   () => { result.userList = userList; 
                    res.json({
                       message: "Join Room Successfully",
                    data: result,
                    error: false
                  })
                })

              }
            }
          }
        } else {
          res.json({
            error: "The session has been expired"
          })
        }

      }
    } catch (error) {
      console.log(error)
      res.json({ error: "Server Error" })
    }
  })

  app.post("/leaveRoom", async (req, res) => {
    const { roomId, deviceId, fcm_token } = req.body;
    console.log(req.body)
    if (!roomId || !deviceId || !fcm_token) {
      res.json({ "error": "Please Fill The Input Correctly" });
    } else {
      let result = await Room.findById(roomId);
      if (!result) {
        res.json({
          error: "The session has been expired"
        })
      } else {
        console.log(result.userList)
        let leftUser = "", leftUserIndex = -1;

        for (let index = 0; index < result.userList.length; index++) {
          const element = result.userList[index];
          if (element.deviceId === deviceId) {
            leftUser = element.name;
            leftUserIndex = index
          }

        }
        let userList = result.matchList.splice(1, leftUserIndex)

        for (let index = 0; index < result.matchList.length; index++) {
          const element = result.matchList[index];
          if (element.deviceId === deviceId) {
            leftUser = element.name;
            leftUserIndex = index
          }

        }
        let matchList = result.matchList.splice(1, leftUserIndex)
        let fcmTokenList = result.fcmTokenList.filter(item => item !== fcm_token)

        console.log(matchList)
        Room.update({ _id: roomId }, { userList: userList, matchList: matchList, fcmTokenList: fcmTokenList })
          .exec((err, doc) => {
            console.log({ doc, err })
            if (doc) {
              // sendNotification({
              //   title: name + " joined the room!",
              //    fcmTokenList: fcmTokenList 
              //   },
              //    () => { result.userList = userList; 
              //     res.json({
              //        message: "Join Room Successfully",
              //     data: result,
              //     error: false
              //   })
              // })
              sendNotification({
                title: leftUser + " left the room!",
                text: leftUser + " left the room!",
                fcmTokenList: result.fcmTokenList
              }, () => {
                res.json({ message: "you left the room" })
              })
            }
            else if (err) {
              res.json({ error: err })
            }
          })
      }
    }

  })

  app.post("/isSessionExpire",async(req,res)=>{

    try {
      const { roomId} = req.body;
      if (!roomId) {
        throw "Please Fill The Input Correctly"
      } else {
        let result = await Room.findById(roomId);
        console.log({expire:false, room:{data:result}})
        if (!result) {
         res.json({expire:true})
        }else{
          res.json({expire:false, room:{data:result}})
        }
    }
    } catch (error) {
      console.log(error)
        res.json({
          error:error
        })
    }
   

  })

  const generateCode = (req, res) => {

    const code = Math.floor(10000 + Math.random() * 90000)
    console.log("run", Room)
    Room.find({ code: code })
      .exec((err, doc) => {
        if (err) {
          console.log(err)
        }
        else if (doc && doc[0]) {
          generateCode(req, res)
        }
        else {
          res.json({code })
        }
      })
  }


  app.get("/createCode", async(req,res)=>{
    generateCode(req, res)
  })

io.on("connection", socket => {
  
  console.log("a user connected", socket.id)

  socket.on("setup", (room) => {
    socket.join(room._id);
    console.log("socket setup call user connected")
    socket.emit("connected");
    // const clients= await io.in(room._id).fetchSockets()
    // console.log("client=====",clients)
  });


  socket.on("joinRoom", (room) => {
    socket.join(room._id);
    socket.emit("connected");
    console.log("User Joined Room: " + room);
    // const clients= await io.in(room._id).fetchSockets()
    // console.log("client=====",clients)
    io.in(room._id).emit("newJoinee",`${room.joineeName} has joined the room!`)
  });

  socket.on("leaveRoom", (room) => {
    socket.leave(room._id);
    console.log("User left Room: " + room);
    io.in(room._id).emit("newleftee",`${room.lefteeName} has left the room!`)

  });

  socket.on("likeCard", async (data) => {
    
    // like the card and check if all records match then broadcast the event "allRecordMatch"
    const { roomId, deviceId, restaurant } = data;
    try {
      // check if the session id is in the record

      if (!roomId || !deviceId || !restaurant.id) {
        throw "Please Fill The Input Correctly"
      } else {
        let result = await Room.findById(roomId);
        if (!result) {
          throw "The session has been expired"
        } else {
          
          let found = false
          let array = result.matchList.slice(0)
          
        //search user in match list if found update record if not found add record
          for (const iterator of array) {
            // console.log(iterator, deviceId)
            if (iterator.deviceId === deviceId) {
              iterator.restaurant = restaurant
              found = true
            }
          }         
          if (!found) {
           array.push({ deviceId, restaurant })
          //  console.log("araat---------",array )
          } 

          // now check if all the elements in array have liked the same restaurant
          // if yes then emit even record match 
          // update record in db 
          // let isSame = false
          // let selectedRestaurant={}
       let isSame=   array.every(val=>val.restaurant.id === restaurant.id)
      //  console.log(temp)
          // for (const iterator of array) {
          //   // console.log(iterator.restaurant.id, restaurant.id)
          //   if (iterator.restaurant.id === restaurant.id) {
          //    isSame = true
          //    selectedRestaurant=iterator
          //    console.log("same")
          //    break
          //   }
          // }   
        

          // else {
           

            // console.log(roomId)
            // update record in  db
            let updateRoom = await Room.updateOne({ _id: roomId }, { matchList: array });
            //  console.log("1111", isSame, array.length, updateRoom.acknowledged)
            if (updateRoom.acknowledged) {
              if(isSame && array.length>1){

                // for (const iterator of array) {
              
                  // let event= "recordMatch" + roomId
                  // console.log("evetn_____",event)
                  // socket.emit(event, { result })
                  // socket.broadcast.to(event).emit( {result} );
                  // io.in(roomId).emit({result}); 
                  // if (iterator.restaurant.id !== restaurant.id) {
                  //  isSame = false
                  // }
                // }   
                // console.log("updateRoom._id",roomId, result)
                // io.to(roomId).emit("match",restaurant)// work for only client
                io.in(roomId).emit("match",restaurant)// all client in room include sender
                console.log("result=====", restaurant)
                // const clients= await io.in(roomId).fetchSockets()
                // console.log("client=====",clients)
                // console.log("socket rooms",roomId, socket.rooms)
                // socket.on("typing", (room) => socket.in(room).emit("typing"));
            
              }
              
            }
          // }
        }
      }

    } catch (err) {
       socket.emit("error"+deviceId, {error:err})
    }

  })


  socket.on("disconnect", () => {
    console.log("user disconnected")
  })
})

server.listen(port, () => {
  console.log("server is running on"+port)
})