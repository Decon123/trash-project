const express = require('express');
const dotenv = require('dotenv').config();
//Interact with AWS IOT Services
const awsIot = require('aws-iot-device-sdk');
//
const app = express();
const path = require('path');

const http = require('http').Server(app);
const io = require('socket.io')(http)
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Creating an AWS IoT device object:
/* const device = awsIot.device({
    keyPath: '<path_to_private_key>',
    certPath: '<path_to_certificate>',
    caPath: '<path_to_root_ca>',
    clientId: 'uniqueClientIdentifier',
    host: 'your-aws-iot-endpoint.amazonaws.com'
});  */
    
let trashCanFilledPercentage = 0;

app.get('/trashCanFilledPercentage', function (req, res) {
    res.write(String(trashCanFilledPercentage));
    res.end();
});

/*-------------------------------------------------
// Connect to AWS IoT Core
device.on('connect', function() {
    console.log('Connected to AWS IoT Core');
  
    // Subscribe to a topic
    device.subscribe('topic/trashCanFilledPercentage');
  });
  
  // Handle received messages
  device.on('message', function(topic, payload) {
    const trashCanFilledPercentage = Number(payload.toString());
    console.log('Received trashCanFilledPercentage:', trashCanFilledPercentage);
  
    // Update the value and emit to connected clients
    // ...
  });
  
  // Handle errors
  device.on('error', function(error) {
    console.error('AWS IoT error:', error);
  });
  
        /*-------------------------------------------------*/

app.post('/trashCanFilledPercentage', function (req, res) {
    trashCanFilledPercentage = Number(req.body.value);

    io.emit('trashCanFilledPercentageUpdate', trashCanFilledPercentage);

    //send data to influxDB(Install influxdb to server)

    //make a series using influxDB

    console.log('Updated trashfill percentage: ' + trashCanFilledPercentage);
    
    res.write('updated the percentage');
    res.end();
});
    
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use('/js', express.static('js'))

const port = process.env.PORT || 3000;

const server = http.listen(port, () => {
    const { port } = server.address();
    console.log(`Server running on http://3.91.54.203:${port}`);
});


io.on('connection', function (socket) {
    socket.emit('trashCanFilledPercentageUpdate', trashCanFilledPercentage);
    console.log('Client connected...')
});   