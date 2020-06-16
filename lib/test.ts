/* eslint-disable prefer-const */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */

const meta = (assign) => {
  return (target) => {
    for (let key in assign) {
      target[`$${key}`] = assign[key];
    }
  };
};

@meta({
  status: 200,
  test() {},
})
class Test {}

@meta({
  message: "hello",
  name() {},
})
class Deriv extends Test {}

console.log(Deriv);
