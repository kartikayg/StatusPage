/**
 * @fileoverview UI backend server. The main purpose of this backend
 * is to add SSR functionality to this ui app.
 */

import express from 'express';
import { matchRoutes } from 'react-router-config';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import { configure as configureStore } from '../shared/redux/store';
import { raw as routes } from '../shared/routes';
import renderer from './renderer';

import auth from './auth';
import { apiGateway } from '../shared/lib/ajaxActions';

/**
 * Sets up the express server
 */
const setupServer = () => {

  const app = express();

  let authAdapter;

  // initialize auth adapter
  app.use((req, res, next) => {
    authAdapter = auth.init(req, res);
    next();
  });

  app.use(cookieParser());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // static files
  app.use('/public', express.static('./dist/public'));

  app.get('/favicon.ico', (req, res) => {
    res.status(204);
  });

  // login call
  app.post('/login', (req, res, next) => {

    const data = { username: req.body.username, password: req.body.password };

    // use the api-gateway to get the login token
    apiGateway.post('/login_token', data).then(msg => {
      // set the cookie. this is used to authenticate for SSR
      authAdapter.token = msg.token;
      res.json(msg);
    }).catch(e => {
      const status = e.status || e.httpStatus || 500;
      res.status(status).json({ message: e.message });
    });

  });

  // on logout
  app.get('/logout', (req, res) => {
    authAdapter.logout();
    res.redirect('/login');
  });

  // all the other page loads
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
