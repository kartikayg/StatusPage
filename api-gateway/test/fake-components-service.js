/**
 * @fileoverview - mocking the component-service
 */

const express = require('express');

const app = express();

const testComponentObj = {
  id: 'CI-123',
  name: 'api',
  description: 'description',
  status: 'operational',
  group_id: null
};

const testGroupObj = {
  id: 'CG-123',
  name: 'group'
};


app.get('/components', (req, res) => {
  res.json([testComponentObj]);
});

app.get('/component_groups', (req, res) => {
  res.json([testGroupObj]);
});

app.post('/components', (req, res) => {
  res.json(testComponentObj);
});

app.post('/component_groups', (req, res) => {
  res.json(testGroupObj);
});

app.patch('/components/:id', (req, res) => {
  res.json(testComponentObj);
});

// listen on the port
app.listen(process.env.PORT);
console.log('Fake components service on port 80');

process.on('SIGTERM', () => { process.exit(1) });
process.on('SIGINT', () => { process.exit(1) });
