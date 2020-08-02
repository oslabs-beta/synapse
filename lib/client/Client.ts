export interface Response {
  message: string;
  payload: any;
  query: string;
  status: number;
  type: string;
}

export default class Client {
  private ws: WebSocket;

  private index: number;

  private callbacks: object;

  static async connect(uri: string, onClose: Function = null) {
    return new Promise((resolve, reject) => {
      const instance = new Client();

      const ws = new WebSocket(uri);
      ws.onopen = () => {
        resolve(instance);
      };
      ws.onerror = reject;
      ws.onclose = <any>onClose || undefined;
      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        Object.entries(data).forEach(([req, res]) => {
          instance.callbacks[req](res);
        });
      };

      instance.ws = ws;
      instance.index = 0;
      instance.callbacks = {};
    });
  }

  async request(method: string, path: string, args: object = {}) {
    return new Promise((resolve, reject) => {
      const req = `${method} ${path} ${this.index++}`;
      this.callbacks[req] = (res) => {
        delete this.callbacks[req];
        resolve(res);
      };
      this.ws.send(JSON.stringify({ [req]: args }));
    });
  }

  async get(path: string, args: object = {}) {
    return this.request('GET', path, args);
  }

  async post(path: string, args: object = {}) {
    return this.request('POST', path, args);
  }

  async put(path: string, args: object = {}) {
    return this.request('PUT', path, args);
  }

  async patch(path: string, args: object = {}) {
    return this.request('PATCH', path, args);
  }

  async delete(path: string, args: object = {}) {
    return this.request('DELETE', path, args);
  }

  async options(path: string, args: object = {}) {
    return this.request('OPTIONS', path, args);
  }

  async subscribe(path: string, args: object = {}, onChange: Function = null) {
    return this.request('SUBSCRIBE', path, args).then((res: Response) => {
      if (res.status.toString()[0] !== '2') {
        return Promise.reject(res);
      }

      this.callbacks[res.query] = (state: any) => {
        if (onChange) {
          onChange(state, res.query);
        }
      };

      return res;
    });
  }

  async unsubscribe(query: string) {
    this.request('UNSUBSCRIBE', query).then((res: Response) => {
      if (res.status.toString()[0] !== '2') {
        return Promise.reject(res)
      }
      delete this.callbacks[res.query];
      return res;
    });
  }

  disconnect() {
    this.ws.close();
  }
}
