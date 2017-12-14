// import {assert} from 'chai';
// import sinon from 'sinon';

// import emailRepo from './email';

// import { DuplicatedSubscriptionError } from '../errors';

// describe('repo/subscription/email', function() {


//   /**
//    * MOCK VARIABLES
//    */

//   const daoMockObj = {

//     name: 'subscriptions',

//     count(pred) {
//       return Promise.resolve(pred.email === 'duplicated@gmail.com' ? 1 : 0);
//     }

//   };

//   const repo = emailRepo.init(daoMockObj);

//   describe ('validate()', function () {

//      it ('should return subscription object if no problem', async function () {
//       const data = { id: 'id', email: 'valid@gmail.com' };
//       const v = await repo.validate(data);
//       assert.deepEqual(v, data);
//     });

//     it ('should throw exception if duplicated email', function (done) {

//       repo.validate({
//         id: 'id', email: 'duplicated@gmail.com'
//       }).catch(e => {
//         assert.strictEqual(e.name, 'DuplicatedSubscriptionError');
//         done();
//       });

//     });

//   });

// });