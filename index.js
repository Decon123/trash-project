const express = require('express');
const app = express();
const path = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Load the AWS SDK for Node.js
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');

// Set your AWS credentials (or use environment variables)
const awsConfig = {
  credentials: {
    accessKeyId: 'AKIA457R5LNBDV6Y2PBG',
    secretAccessKey: 'sC+uATTeF4RDkK7y3XQmKVxUe3Y30SoXLvhtDAe4',
  },
  region: 'us-east-1', // Replace with your desired AWS region
};

// Create a DynamoDB client
const dynamoDBClient = new DynamoDBClient(awsConfig);

let trashCanFilledPercentage = 0;

// Example: Retrieve an item from DynamoDB table
const params = {
  TableName: 'tbl_real_data', // Replace with your DynamoDB table name
  Key: {
    // Define the primary key of the item you want to retrieve
    // Replace 'primaryKey' with the actual primary key attribute name
    id: { S: 'c3edce96-76f4-4627-be78-3537c236f97f' }, // Replace with the primary key value
  },
};

app.get('/trashCanFilledPercentage', function (req, res) {
  res.write(String(trashCanFilledPercentage));
  res.end();
});

dynamoDBClient.send(new GetItemCommand(params))
  .then((data) => {
    // The data variable contains the retrieved item
    console.log('Retrieved item:', data.Item);
  })
  .catch((err) => {
    console.error('Error retrieving item:', err);
  });

app.post('/trashCanFilledPercentage', function (req, res) {
  trashCanFilledPercentage = Number(req.body.value);

  io.emit('trashCanFilledPercentageUpdate', trashCanFilledPercentage);
  console.log('Updated trashfill percentage: ' + trashCanFilledPercentage);

  res.write('updated the percentage');
  res.end();
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use('/js', express.static('js'));

const port = process.env.PORT || 3000;

const server = http.listen(port, () => {
  const { port } = server.address();
  console.log(`Server running on http://localhost:${port}`);
});

io.on('connection', function (socket) {
  socket.emit('trashCanFilledPercentageUpdate', trashCanFilledPercentage);
  console.log('Client connected...');
});
