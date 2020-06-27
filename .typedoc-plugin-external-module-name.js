module.exports = function customMappingFunction(explicit, implicit) {
  return implicit === 'lib' ? 'main' : implicit.replace('lib/', '');
};
