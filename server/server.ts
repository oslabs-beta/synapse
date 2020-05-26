const path = require('path');
const express = require('express');
const synapse = require('./synapse/synapse');

const app = express();

const PORT = 3000;

<<<<<<< HEAD
app.use('/api', synapse(path.resolve(__dirname, './resources')));
=======
app.use(express.json());

app.use("/api", synapse(path.resolve(__dirname, "./resources")));
>>>>>>> 0ff72496acf4a7b48a69e0b48c48c15ee486f85c

app.get('/', (req, res) => {
  res.send('hello world');
});

app.use((err, req, res, next) => res.status(err.status).send(err.serialize()));

app.listen(PORT, () => console.log(`listening on port ${PORT}`));

module.exports = app;
