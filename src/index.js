// @flow
import express from 'express';
import debug from 'debug';

const app = express();
const log = debug('app:log');

app.listen(4040, () => {
  log('app started');
});
