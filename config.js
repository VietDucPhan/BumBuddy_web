var config = {
  db_url : process.env.MONGODB_URI,
  app_name : "BumBuddy",
  sitename : "Bum Buddy",
  session_secret : process.env.SESSION_SECRECTS,
  meta_desc: "",
  meta_key: "",
  lifetime: 15*(1000*60), // milisecond
  clear_expire_sessions: 3600,// second
  admin_email: 'admin@bumbuddy.app',
  mailfrom: 'no.reply@bumbuddy.app',
  fromname: 'No Reply',
  smtpuser: 'no.reply@bumbuddy.app',
  smtppass: process.env.SMTP_PASS,
  smtphost: 'smtp.zoho.com',
  smtpport: 465,
  imgur_access_token: process.env.IMGUR_ACCESS_TOKEN,
  push_notification_key: process.env.NOTIFICATION_SERVER_KEY
};

module.exports = config;
