/**
 * @fileoverview - mocking the incidents-service
 */

const express = require('express');

const app = express();

// a dummy object. doesn't really have to be valid
const testIncidentObj = {
  id: 'IC123',
  name: 'something wrong',
  updates: [
    {
      id: 'IU123',
      message: 'message',
      status: 'resolved'
    }
  ]
};


app.get('/incidents', (req, res) => {
  res.json([testIncidentObj]);
});

app.post('/incidents', (req, res) => {
  res.json(testIncidentObj);
});

app.delete('/incidents/:id', (req, res) => {
  res.json({ message: 'Incident Deleted' });
});

// listen on the port
app.listen(process.env.PORT);
console.log('Fake incidents service on port 80');

process.on('SIGTERM', () => { process.exit(1) });
process.on('SIGINT', () => { process.exit(1) });
