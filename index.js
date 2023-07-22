//install required npm packages
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
const { fromBase64 } = require('@aws-sdk/util-base64-node');

// Set your AWS credentials (or use environment variables)
const awsConfig = {
  credentials: {
    accessKeyId: '',
    secretAccessKey: '',
  },
  region: '', // Replace with your desired AWS region
};

// Create a DynamoDB client
const dynamoDBClient = new DynamoDBClient(awsConfig);

let trashCanFilledPercentage = 0;
let bin_height = 20;

// Example: Retrieve an item from DynamoDB table
const params = {
  TableName: 'tbl_real_data', // Replace with your DynamoDB table name
  Key: {
    // Define the primary key of the item you want to retrieve
    // Replace 'primaryKey' with the actual primary key attribute name
    id: { S: '' }, // Replace with the primary key value
  },
};

// Convert Binary data to a real value (floating-point number)
function toDecimal(v) {
  let binary = '';
  if (typeof v == 'string') {
    binary = v.split();
  } else {
    binary = v.toString().split();
  }
  let decimal = 0;
  for (let i = 0; i < binary.length; i++) {
    decimal = (decimal * 2) + binary[i];
  }
  return decimal;
}

async function retrievePercentageFromDynmoDBAndUpdatePercentage() {
  try {
    const data = await dynamoDBClient.send(new GetItemCommand(params));
    if (data && data.Item && data.Item.RealData_raw && data.Item.RealData_raw.B) {
      const realValue = toDecimal(data.Item.RealData_raw.B);
      console.log('Retrieved item - RealData:', realValue);

      // Get the last value from the array
      const lastValue = realValue[realValue.length - 1];
      console.log(lastValue);
      //trashCanFilledPercentage = lastValue;
      trashCanFilledPercentage = round((lastValue/bin_height)*100, 2);
      console.log(trashCanFilledPercentage);
      io.emit('trashCanFilledPercentageUpdate', trashCanFilledPercentage);
      console.log('Updated trashfill percentage: ' + trashCanFilledPercentage);
    } else {
      console.log('Invalid data format or missing attribute');
    }
  } catch (err) {
    console.error('Error retrieving item:', err);
  }
}

app.get('/trashCanFilledPercentage', function (req, res) {
  res.write(String(trashCanFilledPercentage));
  res.end();
});

/* 
dynamoDBClient.send(new GetItemCommand(params))
  .then((data) => {
    // The data variable contains the retrieved item
    if (data && data.Item && data.Item.RealData_raw && data.Item.RealData_raw.B) {
      const realValue = convertBinaryToReal(data.Item.RealData_raw.B);
      console.log('Retrieved item - RealData:', realValue);
      // Now you have the real value in the "realValue" variable
    } else {
      console.log('Invalid data format or missing attribute');
    }
  })
  .catch((err) => {
    console.error('Error retrieving item:', err);
  }); */


// Forcefully update server percetage(Not recommended)
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

const port = process.env.PORT || 3001;

const server = http.listen(port, () => {
  const { port } = server.address();
  console.log(`Server running on http://localhost:${port}`);
});

io.on('connection', function (socket) {
  socket.emit('trashCanFilledPercentageUpdate', trashCanFilledPercentage);
  console.log('Client connected...');
});


setTimeout(() => {
  try {
    retrievePercentageFromDynmoDBAndUpdatePercentage()
  } catch (ex) {
    console.error(ex)
  }
}, 2000)

