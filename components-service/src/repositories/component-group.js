/**
 * @fileoverview
 */

/**
 * 
 */
const init = (dao) => {

  if (dao.name !== 'component_groups') {
    throw new Error(`Invalid DAO passed to this repo. Passed dao name: ${dao.name}`);
  }

  const repo = {
    name: dao.name
  };

  /**
   * Checks whether the group id exists or not
   * @param {string} id
   * @return {Promise} 
   *  if fulfilled, true or false
   *  if rejected, Error
   */
  repo.doesIdExists = async (id) => {
    const cnt = await dao.count({ id });
    return cnt === 1;
  };



  return repo;

};

export default Object.create({ init });
