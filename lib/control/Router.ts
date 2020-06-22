/* eslint-disable lines-between-class-members */
/* eslint-disable import/extensions */
/* eslint-disable new-cap */
/* eslint-disable import/no-named-default */

import State from './State';
import Controller from './Controller';
import Router from '../utility/Router';

export default class iRouter {
  router: Router = new Router();

  attach(method: string, controller: Controller): void {
    this.router.declare(method, controller.pattern, controller.try);
  }

  async request(method: string, path: string, args: object = {}): Promise<State> {
    return this.router.request(method, path, args);
  }
}
