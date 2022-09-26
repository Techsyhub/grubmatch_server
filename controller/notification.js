const config= require('../config')
const fetch = require('node-fetch')
const sendNotification=({title, text, fcmTokenList})=>{


    const notificationBody={
        'notification': {
            'title':title,
            'text':text,
        },
        'registration_ids':fcmTokenList
    }
    console.log(notificationBody)

    fetch('https://fcm.googleapis.com/fcm/send',{
        'method':'POST',
        'headers':{
            'Authorization':'key='+config.FIREBASE_SERVER_KEY
        },
        'body':JSON.stringify(notificationBody)
    }).then((data)=>{
        console.log("notification sent successfully",{data})
    }).catch((error)=>{
        console.log("notification error:", error)
    })
}

module.exports={ sendNotification}