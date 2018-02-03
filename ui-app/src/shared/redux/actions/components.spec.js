import { assert } from 'chai';

import * as actionTypes from './types';
import * as actions from './components';

describe ('shared/redux/actions/components', function () {

  it ('add component action', function () {

    const cmp = { name: 'asda', id: 'id' };
    const a = actions.addComponent(cmp);

    assert.deepEqual(a, {
      type: actionTypes.ADD_COMPONENT,
      component: cmp
    });

  });

});