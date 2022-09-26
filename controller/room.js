const yelp = require("yelp-fusion");
const createRoom = require("../models/room");
const joinRoom = require("../models/user");
const config = require("../config");
const {sendNotification}= require("./notification")

const YELP_CLIENT = yelp.client(config.YELP_KEY );

const generateCode =(res)=>{
  const code= Math.floor(10000 + Math.random() * 90000)
 
  createRoom.find({code:code})
  .exec((err, doc)=>{
    if(err){ 
      console.log(1, error)
      res.json({
        error:err,
        message:"Database error"
      })
    }
    else if (doc && doc[0]){
      console.log(2, doc)
      generateCode(res)
    }else{
      res.json({code:code})
    }
  })


}
const createCode = async (req, res)=>{
  generateCode(res) 
}

const createRoomController = async  (req, res) => {
    try {
    
      const{ name, zip, radius, code , location, deviceId,fcm_token }= req.body
      if(!name, !zip, !radius, !code , !location.longitude, !deviceId,!fcm_token){
        res.json({error:"Required fields are missing"})
      }else{
        YELP_CLIENT
        .search({
          term: "food",
          longitude: location.longitude,
          latitude: location.latitude ,
        })
        .then(async(response) => {
          var apiData = response.jsonBody;
        
          const obj ={
            name,    
            zip,  
            radius,
            code,
            fcmTokenList:[fcm_token],
            location: {
              longitude: location.longitude,
              latitude: location.latitude,
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

      }
    
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
  const{name, code,  deviceId, fcm_token}= req.body;
   
    try{
      if (!code || !name || !deviceId || !fcm_token) {
        res.send("Please Fill The Input Correctly");
      } else {
        let result = await createRoom.find({code:code});

        if(result && result[0]){
          result= result[0]
          console.log(result.code, code, typeof result.code , typeof code, result.code===code)
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
            
            let fcmTokenList= result.fcmTokenList
            fcmTokenList.push(fcm_token)

            let updateRoom= await createRoom.updateOne({code: code}, { userList, fcmTokenList});
            
            if(updateRoom.acknowledged){
            sendNotification({
                title:"Grubmatch",
                text: name+ " joined the room!",
                fcmTokenList:fcmTokenList
              },()=>{
                result.userList= userList;
                res.json({
                  message:"Join Room Successfully",
                  data:result,
                  error:false
                })
              })
             
            }
           }     
          }
        }else{
          res.json({
            error:"The session has been expired"
          })
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
    const{roomId, deviceId, userList}= req.body;
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
        let temp =[]
      
        let allRecord= result.userList.concat(userList);

        // allRecord.foreach(a_user=>{
        //   let found = false;
        //     result.userList.foreach(()=>{

        //     })
           
        //     })
        // })
          
      //   result.userList.forEach((dbUsers)=>{
      //     userList.forEach((users)=> {

      //       if(dbUsers.)
      // }
      //   }
        
      // ));





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
          res.json({
            message:"matched",
            restaurant:result.matchList[0].restaurant
          })
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
      }else{
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

  }

  
  const leaveRoom = async (req,res)=>{
    const{roomId, deviceId}= req.body;
    if (!roomId || !deviceId) {
      res.json({"error":"Please Fill The Input Correctly"});
    } else {
      let result = await createRoom.findById(roomId);
      if(!result){
        res.json({
          error:"The session has been expired"
        })
      }else{
        console.log(result.userList)
        let leftUser="", leftUserIndex=-1

        for (let index = 0; index <  result.userList.length; index++) {
          const element =  result.userList[index];
          if(element.deviceId===deviceId){
            leftUser=element.name;
            leftUserIndex= index
          }
          
        }     
        let userList = result.userList.splice(1,leftUserIndex)
        console.log(userList)
        createRoom.update({_id:roomId},{userList:userList})
        .exec((err, doc)=>{
          console.log({doc,err})
          if(doc){
            sendNotification({
              title:"Grubmatch",
              text: leftUser+ " left the room!",
              fcmTokenList:result.fcmTokenList.toString()
            },()=>{
              res.json({message:"you left the room"})
            })
          }
          else if(err){
            res.json({error:err})
          }
        })
      }
    }
    
  }

 
  module.exports={
    createRoomController, joinRoomController, getNewJoinee, matchLike, isAllRecordMatch, createCode, leaveRoom
  }