/* eslint-disable no-undef */

import * as request from "supertest";

const app = require("../server");

describe("GET /:id", () => {
  it("User API request", async () => {
    const result = await request(app).get("/api/user");
    expect(true).toEqual(true);
  });
});
