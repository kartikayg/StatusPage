/**
 * @fileoverview
 */

import component from './component';
import componentGroup from './component-group';

import {getDao} from '../lib/db/mongo';

const init = (db) => {

  const componentGroupRepo = componentGroup.init(getDao(db, 'component_groups'));
  const componentRepo = component.init(getDao(db, 'components'), componentGroupRepo);

  return Object.assign({}, {
    component: componentRepo,
    componentGroup: componentGroupRepo
  });

};

export default Object.create({ init });
