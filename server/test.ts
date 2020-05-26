import * as request from 'supertest';
import app from './server.ts';

describe('GET /:id', () => {
  it('User API request', async () => {
    const result = await request(app).get('/api/user');
    expect(result.text).toEqual('forbidden');
    expect(result.status).toEqual(403);
  });
});
