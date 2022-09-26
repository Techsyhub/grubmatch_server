const config= require('../config')
const fetch = require('node-fetch')
const sendNotification=({title, text, fcmTokenList},cb)=>{


    const notificationBody={
        // notification: {
        //     title:title,
        //     text:text
        // },
        // registration_ids:fcmTokenList
        "notification": {
            "title":title,
            "text":text
            
        },
        "registration_ids" : [
            "dAU_FW35R2O4kOfHv5zK5F:APA91bFn2DcHfTazAau4LGTra91phbXKY005tUrpa3P4jOhLc5_cgqmJLv1kfRp1ONobXJ7SO3M6ayzz7o2tJTBIq1V_n-9QWDdd-52dReF1UUJkaraiYVrL4nsQN9vnI6KRxlIoO42z",
            "dAU_FW35R2O4kOfHv5zK5F:APA91bFn2DcHfTazAau4LGTra91phbXKY005tUrpa3P4jOhLc5_cgqmJLv1kfRp1ONobXJ7SO3M6ayzz7o2tJTBIq1V_n-9QWDdd-52dReF1UUJkaraiYVrL4nsQN9vnI6KRxlIoO42z",
            "fjc3Q6Y5QrmiNCpUEIVIqc:APA91bEZhYi88BVpPXPcu_v9q-Ey4m8_S1fql_a4IFF9eZvB9veXonGWjdqQrx17fVUdrW9s9TKY4X-jczCzQWJm6zygivejDiOTFfDE4bxiOTPaXICJ-X-EOq22raSrohGqzXHTDdez",
            "fjc3Q6Y5QrmiNCpUEIVIqc:APA91bEZhYi88BVpPXPcu_v9q-Ey4m8_S1fql_a4IFF9eZvB9veXonGWjdqQrx17fVUdrW9s9TKY4X-jczCzQWJm6zygivejDiOTFfDE4bxiOTPaXICJ-X-EOq22raSrohGqzXHTDdez",
            "fjc3Q6Y5QrmiNCpUEIVIqc:APA91bEZhYi88BVpPXPcu_v9q-Ey4m8_S1fql_a4IFF9eZvB9veXonGWjdqQrx17fVUdrW9s9TKY4X-jczCzQWJm6zygivejDiOTFfDE4bxiOTPaXICJ-X-EOq22raSrohGqzXHTDdez",
            ...fcmTokenList
        ]
    }
    console.log(notificationBody)

    fetch('https://fcm.googleapis.com/fcm/send',{
        'method':'POST',
        'headers':{
            'Authorization':'key='+config.FIREBASE_SERVER_KEY
        },
        'body': notificationBody //JSON.stringify(notificationBody)
    }).then((data)=>{
        cb();
        console.log("notification sent successfully",{data})
    }).catch((error)=>{
        console.log("notification error:", error)
    })
}

module.exports={ sendNotification}