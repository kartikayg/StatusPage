import express from 'express';
import bodyParser from 'body-parser';
import compress from 'compression';
import methodOverride from 'method-override';
import cors from 'cors';
import helmet from 'helmet';


const start = (conf = {}) => {

  const app = express();


  // parse body params and attache them to req.body
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(compress());
  app.use(methodOverride());

  // secure apps by setting various HTTP headers
  app.use(helmet());

  // enable CORS - Cross Origin Resource Sharing
  app.use(cors());

  // log the call
  

  // setup routes


  // log error in winston transports except when executing test suite
  


  // if error is not an instanceOf APIError, convert it.
  app.use((err, req, res, next) => {

  });

  // catch 404 and forward to error handler
  app.use((req, res, next) => {

  });

  // error handler, send stacktrace only during development
  app.use((err, req, res, next) => {
    
  });

};

export default Object.create({ start });