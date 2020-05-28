/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const request = require("supertest");
const mongoose = require("mongoose");
const UserDB = require("../database")("User");
const { MONGO_URI } = require("../secrets");
const app = require("../server");

const DBUrl = MONGO_URI;

beforeAll(async () => {
  const url = DBUrl;
  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(() => {
  mongoose.connection.close();
});

describe("Basic operations", () => {
  let id;
  it("Should post user to database", async () => {
    const result = await request(app).post("/api/user").send({
      username: "bob",
      password: "123456",
      email: "testing@gmail.com",
    });
    id = result.body._id;
    expect(result).toBeTruthy();
    expect(result.status).toEqual(201);
  });
  it("Should return an instance of User", async () => {
    const result = await request(app).get(`/api/user/${id}`);
    expect(result.body.username).toEqual("bob");
    expect(result.body.email).toEqual("testing@gmail.com");
    expect(result.status).toEqual(200);
  });
  it("Returns with a Reply when the an improper email is used", async () => {
    const result = await request(app).post("/api/user").send({
      username: "jack",
      password: "qweerr",
      email: "testing3",
    });
    expect(result.text).toBeTruthy();
    expect(result.status).toEqual(400);
    expect(result.res.statusMessage).toBeTruthy();
  });
  it("Returns with a Reply when the id cannot be found", async () => {
    const result = await request(app).get("/api/user/qwertyqwertyqwertyqwerty");
    expect(result.status).toEqual(400);
    expect(result.res.statusMessage).toBeTruthy();
  });
});
