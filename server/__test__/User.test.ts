/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
import WS from "jest-websocket-mock";

const request = require("supertest");
const mongoose = require("mongoose");
const UserDB = require("../database")("User");
const { MONGO_URI } = require("../secrets");
const app = require("../server");

const DBUrl = MONGO_URI;

// beforeEach(async () => {
//   const testSocket = new WS("ws://localhost:3000/api");
//   await testSocket.connected;
//   testSocket.send("connected");
// });

beforeAll(async () => {
  const url = DBUrl;
  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(() => {
  WS.clean();
});

afterAll(() => {
  mongoose.connection.close();
});

xdescribe("Basic operations", () => {
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
xdescribe("websocket functionality", () => {
  it("websocket get request", async () => {
    const testId = "5ed185ade54a6632f9bce65b";
    const result = await request(WS).get(`/api/user/${testId}`);
    console.log("result from ws request", result.body);
    expect(result.status).toEqual(200);
    expect(result.body.username).toEqual("denis");
  });
});
describe("websocket testing", () => {
  it("Sending from mock server should be picked up by connected client", async () => {
    const server = new WS("ws://localhost:3000/api");
    const client = new WebSocket("ws://localhost:3000/api");

    await server.connected;
    client.send("hello");
    await expect(server).toReceiveMessage("hello");

    expect(server).toHaveReceivedMessages(["hello"]);
  });
  it("Mock server should sends errors to connected clients", async () => {
    const server = new WS("ws://localhost:3000/api");
    const client = new WebSocket("ws://localhost:3000/api");
    await server.connected;

    let disconnected = false;
    let error = null;
    client.onclose = () => {
      disconnected = true;
    };
    client.onerror = (e) => {
      error = e;
    };

    server.send("hello everyone");
    server.error();
    expect(disconnected).toBe(true);
    expect(error.origin).toBe("ws://localhost:3000/api");
    expect(error.type).toBe("error");
  });
});
