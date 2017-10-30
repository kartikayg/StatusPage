/**
 * @fileoverview
 */

/**
 *
 */
const init = (dao) => {

  if (dao.name !== 'componentgroups') {
    throw new Error(`Invalid DAO passed to this repo. Passed dao name: ${dao.name}`);
  }

  /**
   * Make sure the component id exists in the backend
   * @param {string} id
   * @return {Promise} 
   *  if fulfilled, true or false
   *  if rejected, Error
   */
  const doesIdExists = async (id) => {
    const cnt = await dao.count({ id });
    return cnt === 1;
  };

  return Object.create({
    name: dao.name,
    doesIdExists
  });

};

export default Object.create({ init });
