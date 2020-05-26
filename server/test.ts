import * as request from 'supertest';
import User from './resources/User.ts';

describe('GET /:id', () => {
  it('User API request', async () => {
    const result = await request(User).get('/api/user');
    expect(result.text).toEqual('forbidden');
    expect(result.status).toEqual(403);
  });
});
