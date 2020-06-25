/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */

import Router from '../control/Router';
import { parseEndpoint } from '../utility';
import State from '../State';

/**
 * Creates an ```express``` middleware function to handle HTTP requests
 */
export default (router: Router, callback: Function): Function => {
  return async (req: any, res: any) => {
    const { method } = parseEndpoint(req.method);

    let result;
    if (method === 'options') {
      const options = await router.options(req.path);
      if (Array.isArray(options)) {
        res.set('Allow', options.join(','));
        result = State.NO_CONTENT();
      }
    } else {
      const args = { ...req.cookies, ...req.query, ...req.body, ...req.params };
      result = await router.request(method, req.path, args);
    }

    return callback(req, Object.assign(res, { locals: result }));
  };
};
