/**
 * Created by Administrator on 6/4/2015.
 * Sending email using nodemailer and node-email-template
 */
var config = require('../config');
var request = require('request');
var firebase = require('firebase-admin');
var serviceAccount = require('../firebase_config.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount)
});

var Notification = module.exports = {};

Notification.sendNotice = function(senderID, recieverID, data, callback){
  if(senderID != recieverID){
    console.log("same person");
  }
  firebase.messaging().sendToDevice("dh60xN-BLUU:APA91bFkLeUmIFoPpoAfCuyPTSeORnoO5_4EoxicH_zM2rBzFCYkrUUJdmQ5CMSIcJ9ZwmfpNRbU_8ruParNEXDSrw6toRxcLHL2ULxuEyFOtMz--h1bSjdUBrC1Y4ls2UDusCLaOvbA", data)
  .then(function(response) {
    // See the MessagingDevicesResponse reference documentation for
    // the contents of response.
    console.log("Successfully sent message:", response);
  })
  .catch(function(error) {
    console.log("Error sending message:", error);
  });
  return callback();

}
