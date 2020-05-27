const request = require("supertest");

const app = require("../server");

describe("GET /:id", () => {
  it("User API request", async () => {
    const result = await request(app).get("/api/user");
    expect(result.text).toEqual("forbidden");
    expect(result.status).toEqual(403);
  });
});
