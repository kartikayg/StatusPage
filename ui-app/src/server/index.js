/**
 * @fileoverview UI backend server. The main purpose of this backend
 * is to add SSR functionality to this ui app.
 */

import express from 'express';
import { matchRoutes } from 'react-router-config';

import { configure as configureStore } from '../shared/redux/store';
import { raw as routes } from '../shared/routes';
import renderer from './renderer';


/**
 * Sets up the express server
 */
const setupServer = () => {

  const app = express();

  // app.use(bodyParser.urlencoded({ extended: true }));
  // app.use(bodyParser.json());

  // static files
  app.use('/public', express.static('./dist/public'));

  app.get('/favicon.ico', (req, res) => {
    res.status(204);
  });

  // all the page loads
  app.get('*', (req, res, next) => {

    try {

      const route = matchRoutes(routes.routes, req.path);

      const store = configureStore({});

      const context = {};
      const content = renderer(req, store, context);

      if (context.url) {
        return res.redirect(301, context.url);
      }
      else if (context.notFound) {
        res.status(404);
      }

      return res.send(content);
    }
    catch (e) {
      return next(e);
    }

  });

  // start the server
  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`ui-app running on localhost: ${port}`); // eslint-disable-line no-console
  });

};

setupServer();
