/**
 * @fileoverview UI backend server. The main purpose of this backend
 * is to add SSR functionality to this ui app.
 */

import express from 'express';
import { matchRoutes } from 'react-router-config';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cookiesMiddleware from 'universal-cookie-express';

import { configure as configureStore } from '../shared/redux/store';
import { raw as routes } from '../shared/routes';
import renderer from './renderer';

import auth from './auth';
import { initCookies as initFlashMessageCookies } from '../shared/lib/flash-message-storage';
import { apiGateway } from '../shared/lib/ajax-actions';

/**
 * Sets up the express server
 */
const setupServer = () => {

  const app = express();

  let authAdapter;

  // initialize auth adapter and flash message storage
  app.use((req, res, next) => {
    authAdapter = auth.init(req, res);
    next();
  });

  app.use(cookieParser(), cookiesMiddleware(), (req, res, next) => {
    initFlashMessageCookies(req.universalCookies);
    next();
  });

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // set auth token for api gateway
  app.use((req, res, next) => {
    apiGateway.setAuthToken(authAdapter.token);
    next();
  });

  // static files
  app.use('/public', express.static(`${__dirname}/public`));

  app.get('/favicon.ico', (req, res) => {
    res.send('icon');
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
    res.redirect(302, '/login');
  });

  // all the other page loads
  app.get('*', async (req, res, next) => {

    try {

      // match the route(s) for the current path. more than one can
      // match depending on the router config
      const route = matchRoutes(routes.routes, req.path);

      // validate if route needs to be authenticated
      const authenticate = route.some(r => {
        return r.route.auth === true;
      });
      if (authenticate && authAdapter.isAuthenticated() === false) {
        return res.redirect('/login');
      }

      // load data based on the routes load
      const initialLoads = route.map(r => {
        return r.route.initialLoad ? r.route.initialLoad(r.match.params) : Promise.resolve({});
      });

      const initialData = await Promise.all(initialLoads);

      // create store with initial state
      const store = configureStore(Object.assign({}, ...initialData));

      // render on server side and response accordingly
      const context = {};
      const content = renderer(req, store, context);

      if (context.url) {
        return res.redirect(302, context.url);
      }

      return res.send(content);

    }
    catch (e) {
      return next(e);
    }

  });

  // error handler on page load
  app.use((err, req, res, next) => {
    res.send('Unable to load the site. Please try again later.');
  });

  // start the server
  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`ui-app running on localhost: ${port}`); // eslint-disable-line no-console
  });

};

setupServer();
