/**
 * Setup tables schema and constraints in the Db
 */

export default async function (db) {

  /* eslint-disable key-spacing */

  // components collection
  const componentValidator = {
    $and: [
      { _id:                { $exists: true, $type: 'string' } },
      { name:               { $exists: true, $type: 'string' } },
      { help_text:          { $type: 'string' } },
      { status:             { $exists: true, $type: 'string' } },
      { sort_order:         { $exists: true, $type: 'int' } },
      { is_active:          { $exists: true, $type: 'bool' } },
      { group_id:           { $type: 'string' } },
      { last_modified:      { $type: 'timestamp' } }
    ]
  };

  await db.createCollection('components', {
    validator: componentValidator
  });


  // component groups collection
  const componentGroupsValidator = {
    $and: [
      { _id:                  { $exists: true, $type: 'string' } },
      { name:                 { $exists: true, $type: 'string' } },
      { help_text:            { $type: 'string' } },
      { status:               { $exists: true, $type: 'string' } },
      { sort_order:           { $exists: true, $type: 'int' } },
      { is_active:            { $exists: true, $type: 'bool' } },
      { last_modified:        { $type: 'timestamp' } }
    ]
  };

  await db.createCollection('component_groups', {
    validator: componentGroupsValidator
  });

  /* eslint-enable key-spacing */

}
