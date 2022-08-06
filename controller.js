const yelp = require("yelp-fusion");
const createRoom = require("./models/room");
const joinRoom = require("./models/user");
const config = require("./config");

const YELP_CLIENT = yelp.client(config.YELP_KEY );

const createRoomController = async  (req, res) => {
    try {
      console.log("hello from create room controller")
      const{ name, zip, radius, code , location, deviceId }= req.body
      console.log(req.body)
      YELP_CLIENT
        .search({
          term: "food",
          longitude: location.longitude|| -89.5,
          latitude: location.latitude || 44.5,
        })
        .then(async(response) => {
          var apiData = response.jsonBody;
        
          const obj ={
            name,    
            zip,  
            radius,
            code,
            location: {
              longitude: location.longitude|| -89.5,
              latitude: location.latitude || 44.5,
            },
            resturentData: apiData,
            userList:[{name, deviceId , host:true}]


          }
          const Data =  new createRoom(obj);
          const Room= await Data.save();
        
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
    } catch (error) {
      console.log("errror", error)
      const responce = {
        error: true,
        error: error,
      };
      res.json(responce);
    }
  }

 const joinRoomController = async (req, res) => {
  const{name, code, roomId, deviceId}= req.body;
   
    try{
      if (!code || !name || !roomId || !deviceId) {
        res.send("Please Fill The Input Correctly");
      } else {
        let result = await createRoom.findById(roomId);
        if(!result){
          res.json({
            error:"The session has been expired"
          })
        }
        if(result.code !== code){
          res.json({
            error:"Invalid Code"
          });
        
        }else{
         const isUserExist = result.userList.find(item => item.deviceId=== deviceId)
         if(isUserExist){
          res.json({
            error:"User already exist"
          })
         }else{
          let userList= result.userList
          userList.push({deviceId, host:false, name})
          let updateRoom= await createRoom.updateOne({ _id: roomId}, { userList });
          if(updateRoom.acknowledged){
            result.userList= userList;
            res.json({
              message:"Join Room Successfully",
              data:result,
              error:false
            })
          }
         }     
        }
      }
    }catch(error){
      console.log(error)
      res.json({error:"Server Error"})
    }
  }


  const getNewJoinee = async (req, res)=>{
    // res.send("hello from get new joinee")
    // console.log("get ")
    // get code and session id check if the room exist
    const{roomId, deviceId}= req.body;
    if (!roomId || !deviceId) {
      res.json({"error":"Please Fill The Input Correctly"});
    } else {
      let result = await createRoom.findById(roomId);
      if(!result){
        res.json({
          error:"The session has been expired"
        })
      }
      findUser= result.userList.find(item=>item.deviceId ===deviceId)
      console.log(result)
      if(findUser){
       res.json({
        userList:result.userList
       })
      }else{
        res.json({
          error:"Invalid User"
        })
      }
    }

    // return the all users 
    // on client side compare both arrays and show the notfication toast of the new joinee
  }

  const isAllRecordMatch =async(req,res)=>{
    //on client side call a timer after 5secs call this api
    // get the sessionid from the req
    // check if all the elements if the match array have same restaurant id then show a status match and return that object to the client side 
    const{roomId, deviceId}= req.body;
    if (!roomId || !deviceId) {
      res.json({"error":"Please Fill The Input Correctly"});
    } else {
      let result = await createRoom.findById(roomId);
      if(!result){
        res.json({
          error:"The session has been expired"
        })
      }
      let count =0

      if(result.matchList.length>0){
        for (const iterator of result.matchList) {
          if(iterator.restaurant.id === result.matchList[0].restaurant.id){
            count++;
          }
        }
        if(count=== result.matchList.length){
          res.json({message:"matched"})
        }else{
          res.json({
            error :false
          })
        }
      }else{
        res.json({
          error :false
        })
      }
      
      
    }


    // else return false
  }

  const matchLike= async (req, res)=>{
    //get the object and userid and session id or code from request
    const{roomId, deviceId, restaurant}= req.body;
   
    // check if the session id is in the record
   
    if (!roomId || !deviceId || !restaurant.id) {
      res.json({"error":"Please Fill The Input Correctly"});
    } else {
      let result = await createRoom.findById(roomId);
      if(!result){
        res.json({
          error:"The session has been expired"
        })
      }
      //search user in match list if found update record if not found add record
      let found = false
      for (const iterator of result.matchList) {
        if(iterator.id === deviceId){
          iterator.restaurant = restaurant
          found= true
        }
      }
      if(!found){
        result.matchList.push({deviceId, restaurant})
      }      

      //update record in  db
     let updateRoom= await createRoom.updateOne({ _id: roomId},{matchList:result.matchList});
     if(updateRoom.acknowledged){
       res.json({
         data:result,
         error:false
       })
     }

    }

  }

  module.exports={
    createRoomController, joinRoomController, getNewJoinee, matchLike, isAllRecordMatch
  }