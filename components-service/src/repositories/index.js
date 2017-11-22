/**
 * @fileoverview
 */

import component from './component';
import componentGroup from './component-group';

const init = (db) => {

  const componentGroupRepo = componentGroup.init(db.dao('component_groups'));
  const componentRepo = component.init(db.dao('components'), componentGroupRepo);

  return Object.assign({}, {
    component: componentRepo,
    componentGroup: componentGroupRepo
  });

};

export default { init };
