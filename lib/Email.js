/**
 * Created by Administrator on 6/4/2015.
 * Sending email using nodemailer and node-email-template
 */
var config = require('../config');
var Email = require('email-templates');
var path = require('path');
var email = module.exports = {};

/**
 *
 * @param locals Object that have email, template, subject is always required
 * @param callback
 */
email.sendEmailtoClient = function(locals,callback){
  emailTemplates(templatesDir, function(err, template) {

    if (err || !locals.template || !locals.email || !locals.subject) {
      return callback(err);
    } else {
      var transport = nodemailer.createTransport({
        service: 'Zoho',
        auth: {
          user: config.smtpuser,
          pass: config.smtppass
        }
      });
      template(locals.template, locals, function (err, html, text) {
        if (err) {
          return callback(err);
        } else {
          transport.sendMail({
            from: config.fromname + '< ' + config.mailfrom + '>',
            to: locals.email,
            subject: locals.subject,
            html: html,
            // generateTextFromHTML: true,
            text: text
          }, function (err, responseStatus) {
            if (err) {
              if(typeof callback == 'function'){
                return callback(err);
              }

            } else {
              if(typeof callback == 'function'){
                return callback(err,responseStatus.message);
              }
            }
          });
        }
      });
    }
  });
};

email.sendEmailtoAdmin = function(locals,callback){
  console.log('locals',locals);
  if (locals.template && locals.email && locals.subject) {
    var EmailService = new Email({
      message: {
        from: config.mailfrom,
        subject: locals.subject
      },
      send: true,
      transport: {
        service: 'Zoho',
        auth: {
          user: config.smtpuser,
          pass: config.smtppass
        }
      },
      juice: true,
      juiceResources: {
        preserveImportant: true,
        webResources: {
          relativeTo: path.resolve(__dirname, '../public/stylesheets')
        }
      }
    });
    EmailService.send({
      template: '../views/layouts/emails/' + locals.template,
      message: {
        replyTo: locals.firstname + ' ' + locals.lastname + ' <' + locals.email + '>',
        to: config.admin_email
      },
      locals: locals
    }).then(function(e){
      //console.log('email.send()',e);
      return callback('Email Sent');
    }).catch(function(e){
      //console.log('error',e);
      return callback('Email could not send');
    });
  } else {
    return callback('Could not send email');
  }
};

