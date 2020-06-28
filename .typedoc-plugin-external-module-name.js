module.exports = function customMappingFunction(explicit, implicit) {
  return implicit === 'lib' ? 'index' : implicit.replace('lib/', '');
};
