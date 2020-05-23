const express = require('express');
const app = express();
const synapse = require('./synapse/synapse');

const PORT = 3000;

app.use('/api', synapse('./resources'));

app.get('/', (req, res) => {
  res.send('hello world');
});

app.listen(PORT, () => console.log(`listening on port ${PORT}`));
