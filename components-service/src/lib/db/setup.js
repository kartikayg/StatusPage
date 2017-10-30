/**
 * @fileoverview Setup tables schema and constraints in the Db
 */

export default async function (db) {

  /* eslint-disable key-spacing */

  // components collection
  const componentValidator = {
    $and: [
      { created_at:         { $exists: true, $type: 'timestamp' } },
      { id:                 { $exists: true, $type: 'string' } },
      { name:               { $exists: true, $type: 'string' } },
      { help_text:          { $type: 'string' } },
      { status:             { $exists: true, $type: 'string' } },
      { sort_order:         { $exists: true, $type: 'int' } },
      { active:             { $exists: true, $type: 'bool' } },
      { group_id:           { $type: 'string' } },
      { updated_at:         { $exists: true, $type: 'timestamp' } }
    ]
  };

  await db.createCollection('components', {
    validator: componentValidator
  });

  db.collection('components').createIndex({ id: 1 }, { unique: true });


  // component groups collection
  const componentGroupsValidator = {
    $and: [
      { created_at:           { $exists: true, $type: 'timestamp' } },
      { id:                   { $exists: true, $type: 'string' } },
      { name:                 { $exists: true, $type: 'string' } },
      { help_text:            { $type: 'string' } },
      { status:               { $exists: true, $type: 'string' } },
      { sort_order:           { $exists: true, $type: 'int' } },
      { active:               { $exists: true, $type: 'bool' } },
      { updated_at:           { $exists: true, $type: 'timestamp' } }
    ]
  };

  await db.createCollection('componentgroups', {
    validator: componentGroupsValidator
  });

  db.collection('componentgroups').createIndex({ id: 1 }, { unique: true });

  /* eslint-enable key-spacing */

}
