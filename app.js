const express = require("express")
const app = express()
const http = require("http")
var mongoose = require("mongoose");
const config = require("./config");
const { Server } = require("socket.io")
const Room = require("./models/room");
const { sendNotification } = require("./controller/notification")

const server = http.createServer(app)
const io = new Server(server);

const port = process.env.PORT || 4000;
app.get("/", (req, res) => {
  res.send("hello world");
})

mongoose
  .connect(config.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Mongodb connected"))
  .catch((e) => console.log("Mongodb connection error", e));

io.on("connection", socket => {
  console.log("a user connected")



  const generateCode = (data) => {

    const code = Math.floor(10000 + Math.random() * 90000)
    console.log("run", Room)
    Room.find({ code: code })
      .exec((err, doc) => {
        if (err) {
          console.log(err)
        }
        else if (doc && doc[0]) {
          generateCode(data)
        }
        else {

          socket.emit("getCode" + data, code)
        }
      })
  }
  socket.on("createCode", data => {
    generateCode(data)
  })

  app.post("/createRoom", async (req, res) => {
    console.log(req.query)

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

            const Data = new createRoom(obj);
            const Room = await Data.save();

            const responce = {
              message: "create",
              error: false,
              data: Room,
            };

            res.json(responce);

          })
          .catch((error) => {
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
        let result = await createRoom.find({ code: code });

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

              let updateRoom = await createRoom.updateOne({ code: code }, { userList, fcmTokenList });
              // io.on("connection", async (socket) => {
              //   socket.join(Room._id);

              //   // and then later
              //   io.to(Room).emit(response);

              // });

              if (updateRoom.acknowledged) {
                sendNotification({
                  title: name + " joined the room!",
                  fcmTokenList: fcmTokenList
                }, () => {
                  result.userList = userList;
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
    const { roomId, deviceId, fcmToken } = req.body;
    if (!roomId || !deviceId || !fcmToken) {
      res.json({ "error": "Please Fill The Input Correctly" });
    } else {
      let result = await createRoom.findById(roomId);
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
        let fcmTokenList = result.fcmTokenList.filter(item => item !== fcmToken)

        console.log(matchList)
        createRoom.update({ _id: roomId }, { userList: userList, matchList: matchList, fcmTokenList: fcmTokenList })
          .exec((err, doc) => {
            console.log({ doc, err })
            if (doc) {
              sendNotification({
                title: leftUser + " left the room!",
                text: leftUser + " left the room!",
                fcmTokenList: result.fcmTokenList.toString()
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
      const { roomId, deviceId} = data;
      if (!roomId || !deviceId) {
        throw "Please Fill The Input Correctly"
      } else {
        let result = await createRoom.findById(roomId);
        if (!result) {
          throw "The session has been expired"
        }else{
          res.json({
            error :false,
            room: result
          })
        }
    }
    } catch (error) {
      socket.emit("error"+deviceId, error)
    }
   

  })


  socket.on("likeCard", async (data) => {
    // like the card and check if all records match then broadcast the event "allRecordMatch"
    const { roomId, deviceId, restaurant } = data;
    try {
      // check if the session id is in the record

      if (!roomId || !deviceId || !restaurant.id) {
        throw "Please Fill The Input Correctly"
      } else {
        let result = await createRoom.findById(roomId);
        if (!result) {
          throw "The session has been expired"
        } else {
          //search user in match list if found update record if not found add record
          let found = false
          for (const iterator of result.matchList) {
            console.log(iterator, deviceId)
            if (iterator.deviceId === deviceId) {
              iterator.restaurant = restaurant
              found = true
            }
          }
          if (!found) {
            result.matchList.push({ deviceId, restaurant })
          } else {
            // update record in  db
            let updateRoom = await createRoom.updateOne({ _id: roomId }, { matchList: result.matchList });
            if (updateRoom.acknowledged) {
              //  res.json({
              //    data:result,
              //    error:false
              //  })
              socket.emit("recordMatch" + roomId, { result })
            }


            // res.json({found, result})


          }
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
  console.log("server is running on 3000")
})