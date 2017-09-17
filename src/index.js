// npm packges
import dotenv from 'dotenv';

// internal packages
import config from './config';


const init = async () => {

  // load config
  dotenv.config();
  const conf = config.load(process.env);

  console.log(conf);

  // load db

  // load repositories

  // start the server


};

init()
  .catch((e) => {
    console.error(`Problem initializing the app: ${e}`);
  });
