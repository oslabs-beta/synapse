const path = require('path');
const express = require('express');
const synapse = require('./synapse/synapse');

const app = express();

const PORT = 3000;

app.use('/api', synapse(path.resolve(__dirname, './resources')));

app.get('/', (req, res) => {
  res.send('hello world');
});
<<<<<<< HEAD
=======

app.use((err, req, res, next) => res.status(err.status).send(err.serialize()));

>>>>>>> 3c80fda9be6370fb4b7acf497a5cd76464e8b5f8
app.listen(PORT, () => console.log(`listening on port ${PORT}`));

module.exports = app;
