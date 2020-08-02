module.exports = function customMappingFunction(explicit, implicit) {
  return implicit === 'lib' ? 'synapse' : implicit.replace('lib/', '');
};
