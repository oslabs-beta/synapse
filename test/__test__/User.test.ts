/* eslint-disable no-undef */
const request = require("supertest");
const mongoose = require("mongoose");

const server = require("../index");

describe("HTTP requests", () => {
  afterAll(async (done) => {
    try {
      await mongoose.disconnect();
    } catch (error) {
      console.log("Could not disconnect from db *sadface*");
    }
  });

  describe("GET / ", () => {
    it("Should respond with 200 status", async () => {
      const response = await request(server).get("/");
      expect(response.statusCode).toBe(200);
    });
  });
  describe("GET /api/user ", () => {
    it("Should respond with an array of users", async () => {
      const response = await request(server).get("/api/user");
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    it("Response body array should contain objects of users", async () => {
      const response = await request(server).get("/api/user");
      expect(response.statusCode).toBe(200);
      response.body.forEach((element) => {
        expect(typeof element).toBe("object");
        expect(Array.isArray(element)).toBe(false);
        expect(element).toBeTruthy();
      });
    });
  });
  describe("POST /api/user ", () => {
    it("Should successfully add another user", async () => {
      const responseBefore = await request(server).get("/api/user");
      const postResponse = await request(server)
        .post("/api/user")
        .send({ username: "Testing", password: "testtesttest", email: "test@gmail.com" });
      const responseAfter = await request(server).get("/api/user");
      const { _id, username, email } = postResponse;

      expect(responseBefore.statusCode).toBe(200);
      expect(postResponse.statusCode).toBe(201);
      expect(responseAfter.statusCode).toBe(200);
      expect(responseAfter.body.length).toEqual(responseBefore.body.length + 1);
      expect(typeof responseAfter).toBe("object");
      expect(username).toEqual("testing");
      expect(email).toEqual("test@gmail.com");
      expect(_id).toBeTruthy();

      await request(server).delete(`/api/user/${_id}`);
    });
    it("Should not update with bad body", async () => {
      const body1 = {
        username: "!te*s t",
        password: "123",
        email: "testing.gmail.com",
      };
      const body2 = {
        username: "noPassword",
      };
      const body3 = {
        password: "noUsername",
      };
      const body4 = {
        email: "nobodyorpass@gmail.com",
      };
      const res1 = await request(server).post("/api/user").send(body1);
      const res2 = await request(server).post("/api/user").send(body2);
      const res3 = await request(server).post("/api/user").send(body4);
      const res4 = await request(server).post("/api/user").send(body4);
      expect(res1.statusCode).toBe(400);
      expect(Object.prototype.hasOwnProperty.call(res1.body, "username")).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(res1.body, "password")).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(res1.body, "email")).toBeTruthy();
      expect(res2.statusCode).toBe(400);
      expect(Object.prototype.hasOwnProperty.call(res2.body, "password")).toBeTruthy();
      expect(res3.statusCode).toBe(400);
      expect(Object.prototype.hasOwnProperty.call(res3.body, "username")).toBeTruthy();
      expect(res4.statusCode).toBe(400);
      expect(Object.prototype.hasOwnProperty.call(res4.body, "username")).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(res4.body, "password")).toBeTruthy();
    });
  });
  describe("PATCH /api/user ", async () => {
    const body = {
      username: "validUser",
      password: "1234567",
      email: "validemail@gmail.com",
    };
    const userPost = await request(server).post("/api/user").send(body);
    const { _id } = userPost.body;
    it("Should update a property on user object", async () => {
      const userUpdate = {
        username: "anotherValidUser",
        email: "diffvalidemail@gmail.com",
      };
      const updatedUser = await request(server).patch(`/api/user${_id}`).send(userUpdate);
      expect(updatedUser.statusCode).toBe(200);
      expect(updatedUser.body.username).toBe("anothervaliduser");
      expect(updatedUser.body.email).toBe("diffvalidemail@gmail.com");
    });
    it("Should not update with bad body", async () => {
      const invalidUpdate = {
        username: "asd",
        email: "badrequest.com",
      };
      const invalidUser = await request(server).patch(`/api/user${_id}`).send(invalidUpdate);
      expect(invalidUser.statusCode).toBe(400);
      expect(Object.prototype.hasOwnProperty.call(invalidUser.body, "username")).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(invalidUser.body, "email")).toBeTruthy();
    });
    afterAll(async (done) => {
      try {
        await request(server).delete(`/api/user/${_id}`);
      } catch (error) {
        console.log("Could not delete user *sadface*");
      }
    });
  });
  xdescribe("PUT /api/user ", async () => {
    const body = {
      username: "validuser",
      password: "validpassword",
      email: "valid@gmail.com",
    };
    const user = await request(server).post(`/api/user`).send(body);
    const { _id } = user.body;
    const updateBody = {
      username: "newname",
      password: "differentpassword",
      email: "diffvalid@gmail.com",
    };
    const missingProps = {
      email: "newvalidmail@gmail.com",
    };
    const invalidProps = {
      username: "@notvalid",
      password: "1",
      email: "test.test.com",
    };
    it("Should update all properties of user object", async () => {
      const updatedUser = await request(server).put(`/api/user/${_id}`).send(updateBody);
      expect(updatedUser.statusCode).toBe(200);
      const { username, email, password } = updatedUser.body;
      expect(username).toBe("newname");
      expect(email).toBe("diffvalid@gmail.com");
      expect(password).toBeTruthy();
    });
    it("Should not update with missing props", async () => {
      const userMissingProps = await request(server).put(`/api/user/${_id}`).send(missingProps);
      expect(userMissingProps.statusCode).toBe(400);
    });
    it("Should not update if props are not valid", async () => {
      const userInvalidProps = await request(server).put(`/api/user/${_id}`).send(invalidProps);
      expect(userInvalidProps.statusCode).toBe(400);
    });
    afterAll(async (done) => {
      try {
        await request(server).delete(`/api/user/${_id}`);
      } catch (error) {
        console.log("Could not delete user *sadface*");
      }
    });
  });
  xdescribe("DELETE /api/user ", async () => {
    const body = {
      username: "validuser",
      password: "validpassword",
      email: "valid@gmail.com",
    };
    const user = await request(server).post(`/api/user`).send(body);
    const { _id } = user.body;
    it("Should successfully delete user", async () => {
      const userGetBefore = await request(server).get(`/api/user`);
      const deleteUser = await request(server).delete(`/api/user/${_id}`);
      const userGetAfter = await request(server).get("/api/user");
      const getDeletedUser = await request(server).get(`/api/user/${_id}`);
      expect(userGetBefore.body.length).toBe(userGetAfter.body.length + 1);
      expect(deleteUser.statusCode).toBe(200);
      expect(getDeletedUser.statusCode).toBe(404);
    });
    xit("Should respond with 404 with nonexistant user", async () => {
      const deleteAgain = await request(server).delete(`/api/user/${_id}`);
      expect(deleteAgain.statusCode).toBe(404);
    });
  });
});
