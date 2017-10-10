/**
 * @fileoverview
 */


import component from './component';
import componentGroup from './component-group';

const init = (db) => {

  const componentGroupRepo = componentGroup.init(db);
  const componentRepo = component.init(db, componentGroupRepo);

  return Object.create({
    component: componentRepo,
    group: componentGroupRepo
  });

};

export default Object.create({ init });
