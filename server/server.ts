const path = require('path');
const express = require('express');
const synapse = require('./synapse/synapse');

const app = express();

const PORT = 3000;

app.use('/api', synapse(path.resolve(__dirname, './resources')));

app.get('/', (req, res) => {
  res.send('hello world');
});
app.listen(PORT, () => console.log(`listening on port ${PORT}`));
