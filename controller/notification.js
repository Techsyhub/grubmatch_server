const config= require('../config')
const sendNotification=({title, text, fcmTokenList})=>{

    const notificationBody={
        'notification': {
            'title':title,
            'text':text,
        },
        'registration_ids':fcmTokenList
    }

    fetch('https://fcm.googleapis/com/fcm/send',{
        'method':'POST',
        'headers':{
            'Authorization':'key='+config.FIREBASE_SERVER_KEY
        },
        'body':JSON.stringify(notificationBody)
    }).then(()=>{
        console.log("notification sent successfully")
    }).catch((error)=>{
        console.log("notification error:", error)
    })
}

module.exports={ sendNotification}