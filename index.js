const express = require('express');
const app = express();
const path = require('path');

const http = require('http').Server(app);
const io = require('socket.io')(http)
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let trashCanFilledPercentage = 0;

app.get('/trashCanFilledPercentage', function (req, res) {
    res.write(String(trashCanFilledPercentage));
    res.end();
});

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
    console.log(`Server running on http://localhost:${port}`);
});


io.on('connection', function (socket) {
    socket.emit('trashCanFilledPercentageUpdate', trashCanFilledPercentage);
    console.log('Client connected...')
});