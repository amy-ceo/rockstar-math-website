const twilio = require("twilio");


const client = new twilio('AC75e9fbdaa03266d90065fb6b191c0fca', 'b99d34a9a8620206cf53cd4a89fb645c');

client.messages.create({
    body: 'Test Message',
    from: '+19499796284',
    to: '+18474970649'
})
.then(message => console.log("Message SID:", message.sid))
.catch(error => console.error("Twilio Error:", error));