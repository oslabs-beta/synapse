/* eslint-disable no-undef */
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");

const dbUrl = "test";

beforeAll(async () => {
  const url = dbUrl;
  await mongoose.connect(url, { useNewUrlParser: true });
});

async function removeAll() {
  db.getCollectionNames().forEach((collection) => {
    db[collection].drop();
  });
}

afterEach(async () => {
  await removeAll();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("GET /:id", () => {
  it("User API request", async () => {
    const result = await request(app).get("/api/user");
    expect(result.text).toEqual("forbidden");
    expect(result.status).toEqual(403);
  });
});

describe("Basic operations", () => {
  it("Should post user to database", async () => {
    const result = await request(app).post("/api/user").send({
      name: "bob",
      password: "123",
      email: "testing@gmail.com",
    });
    expect(result.status).toEqual(200);
    expect(result.text).toEqual("OK");
  });
  it("Should find user in db", async () => {
    const result = await request(app).post("/api/user").send({
      name: "billy",
      password: "456",
      email: "testing2@gmail.com",
    });
    const user = await db.findOne({ name: "billy" });
    expect(user.name).toBeTruthy();
    expect(user.password).toBeTruthy();
    expect(user.email).toBeTruthy();
  });
  it("Should delete user by id", async () => {
    const result = await db.deleteOne({ id: id });
    expect(result.status).toEqual(200);
  });
  it("Should update an id", async () => {
    const result = await db.updateOne(
      { id: id },
      { name: "timmy" },
      { password: "789" },
      { email: "testing3@gmail.com" }
    );
    expect(result.name).toEqual("timmy");
    expect(result.password).toEqual("789");
    expect(result.email).toEqual("testing3@gmail.com");
  });
});
