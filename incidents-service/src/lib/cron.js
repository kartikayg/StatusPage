/**
 * @fileoverview Library to add functions on cron and ability to stop
 */

import cron from 'cron';

let jobs = [];

/**
 * Add a function to run on the cron.
 * @param {string} cronTime
 * @param {function} fn
 * @return {object}
 */
const addJob = (cronTime, fn) => {

  const job = new cron.CronJob({
    cronTime,
    onTick: fn,
    start: true // auto start the job
  });

  jobs.push(job);

  return job;

};

/**
 * Stops a cron job
 */
const stop = (job) => {
  if (job.running) {
    job.stop();
  }
};

/**
 * Stop all jobs
 */
const stopAll = () => {
  jobs.forEach(stop);
  jobs = [];
};


export default {
  addJob,
  stop,
  stopAll
};
