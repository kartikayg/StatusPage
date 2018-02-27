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

app.patch('/components/:id', (req, res) => {
  res.json(testComponentObj);
});

// listen on the port
app.listen(process.env.PORT);
console.log(`Fake components service on port ${process.env.PORT}`);

process.on('SIGTERM', () => {
  process.exit(1);
});
process.on('SIGINT', () => {
  process.exit(1);
});
