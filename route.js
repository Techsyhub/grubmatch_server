const {createRoomController, joinRoomController, leaveRoom, getNewJoinee, createCode, matchLike, isAllRecordMatch} = require("./controller")

const appRouter= (app) => {
    
    app.post("/createRoom", createRoomController);
    app.post("/joinRoom", joinRoomController);
    app.post("/getNewJoinee", getNewJoinee);
    app.post("/matchLike", matchLike);
    app.post("/isAllRecordMatch", isAllRecordMatch)
    app.get("/createCode", createCode)
    app.post("/leaveRoom", leaveRoom)
    app.post("/", (req,res)=> res.send("hello"))
}

module.exports = appRouter