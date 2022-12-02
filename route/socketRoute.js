const express = require("express")
const router= express.Router();
const socketController = require("../controller/room")


const socketRouter=(io)=>{
    const room = new socketController(io);
    
    const {
        createRoomController, 
        joinRoomController,
        leaveRoom,
        getNewJoinee,
        createCode,
        matchLike, 
        isAllRecordMatch
        }= room
    router.post("/createRoom", createRoomController);
    router.post("/joinRoom", joinRoomController);
    router.post("/getNewJoinee", getNewJoinee);
    router.post("/matchLike", matchLike);
    router.post("/isAllRecordMatch", isAllRecordMatch)
    router.get("/createCode", createCode)
    router.post("/leaveRoom", leaveRoom)
    return router
}


module.exports = socketRouter