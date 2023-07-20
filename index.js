const express = require('express');
const app = express();
const path = require('path');
const AWS = require('aws-sdk');
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');

const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set the AWS region
AWS.config.update({ region: 'us-east-1' });

// Create an instance of DynamoDB DocumentClient
const docClient = DynamoDBDocument.from(new DynamoDB());

let trashCanFilledPercentage = 0;

app.get('/trashCanFilledPercentage', (req, res) => {
  res.write(String(trashCanFilledPercentage));
  res.end();
});

// Subscribe to DynamoDB Stream events
const subscribeToStreamEvents = async (streamArn) => {
  try {
    // Create a DynamoDB Document Client
    const dynamodb = new AWS.DynamoDB();

    // Create a stream event source
    const streamParams = {
      TableName: 'tbl_real_data', // Replace with your table name
      StreamArn: streamArn
    };

    // Start listening to stream events
    const stream = dynamodb.createEventStream(streamParams);

    // Process incoming stream records
    stream.on('data', (record) => {
      const eventName = record.eventName;
      const dynamodbNewImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);

      // Perform actions based on the event type
      if (eventName === 'INSERT' || eventName === 'MODIFY') {
        // Handle insert or modify event
        trashCanFilledPercentage = Number(dynamodbNewImage.filledPercentage);
        io.emit('trashCanFilledPercentageUpdate', trashCanFilledPercentage);
        console.log('Updated trash fill percentage:', trashCanFilledPercentage);
      } else if (eventName === 'REMOVE') {
        // Handle remove event
        // You can implement custom logic if needed when an item is removed
        console.log('Item removed:', dynamodbNewImage);
      }
    });

    stream.on('error', (err) => {
      console.error('Error processing DynamoDB Stream events:', err);
    });
  } catch (err) {
    console.error('Failed to subscribe to DynamoDB Stream events:', err);
  }
};

// Specify the DynamoDB Stream ARN
const streamArn = 'arn:aws:dynamodb:us-east-1:889028696898:table/tbl_real_data/stream/2023-07-20T09:00:00.000';

// Call the function to subscribe to DynamoDB Stream events
subscribeToStreamEvents(streamArn);

app.post('/trashCanFilledPercentage', (req, res) => {
  trashCanFilledPercentage = Number(req.body.value);

  io.emit('trashCanFilledPercentageUpdate', trashCanFilledPercentage);

  console.log('Updated trash fill percentage:', trashCanFilledPercentage);

  res.write('Updated the percentage');
  res.end();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use('/js', express.static('js'));

const port = process.env.PORT || 3000;

const server = http.listen(port, () => {
  console.log(`Server running on http://44.211.224.99:${port}`);
});

io.on('connection', (socket) => {
  socket.emit('trashCanFilledPercentageUpdate', trashCanFilledPercentage);
  console.log('Client connected...');
});
