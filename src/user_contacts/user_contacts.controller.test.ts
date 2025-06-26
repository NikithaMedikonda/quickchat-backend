import jwt from "jsonwebtoken";
import { Sequelize } from "sequelize";
import request from "supertest";
import { app } from "../../server";
import { SequelizeConnection } from "../connection/dbconnection";
import { User } from "../user/user.model";
import { UserContacts } from "./user_contacts.model";
import { getSavedName } from "./user_contacts.controller"; 
describe("User Contacts Controller", () => {
  let testInstance: Sequelize;
  let accessToken: string;

  const ownerPhoneNumber = "+911234567890";
  const contactPhoneNumber = "+919876543210";

beforeAll(async () => {
  testInstance = SequelizeConnection()!;
  await User.sync({ force: true });
  await UserContacts.sync({ force: true });

  // Create owner user
  await User.create({
    phoneNumber: ownerPhoneNumber,
    firstName: "Test",
    lastName: "User",
    email: "testuser@example.com",
    password: "Test@1234",
    isDeleted: false,
    publicKey: "",
    privateKey: "",
    socketId: "",
    isLogin: false,
    deviceId: "testDeviceId",
  });

  // Create contact user (this is missing in your current setup)
  await User.create({
    phoneNumber: contactPhoneNumber,
    firstName: "Contact",
    lastName: "User",
    email: "contactuser@example.com",
    password: "Contact@1234",
    isDeleted: false,
    publicKey: "",
    privateKey: "",
    socketId: "",
    isLogin: false,
    deviceId: "contactDeviceId",
  });

  const secretKey = process.env.JSON_WEB_SECRET || "quick_chat_secret";
  accessToken = jwt.sign({ phoneNumber: ownerPhoneNumber }, secretKey, {
    expiresIn: "7d",
  });
});

  afterAll(async () => {
    await UserContacts.truncate({ cascade: true });
    await User.truncate({ cascade: true });
    await testInstance?.close();
  });

  test("should return 400 if required fields are missing", async () => {
    const res = await request(app)
      .post("/api/user/contacts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.text).toBe("Missing required fields");
  });

  test("should insert a contact successfully", async () => {
    const contactDetails = [{ phoneNumber: contactPhoneNumber, savedAs: "Nikki" }];
    const res = await request(app)
      .post("/api/user/contacts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ownerPhoneNumber, contactDetails });
    expect(res.status).toBe(200);
    expect(res.text).toBe("Success");

    const contact = await UserContacts.findOne({
      where: { ownerPhoneNumber, contactPhoneNumber },
    });
    expect(contact).not.toBeNull();
    expect(contact?.savedAs).toBe("Nikki");
  });

  test("should update savedAs if contact already exists", async () => {
    const contactDetails = [{ phoneNumber: contactPhoneNumber, savedAs: "Updated Nikki" }];
    const res = await request(app)
      .post("/api/user/contacts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ownerPhoneNumber, contactDetails });
    expect(res.status).toBe(200);
    expect(res.text).toBe("Success");

    const updatedContact = await UserContacts.findOne({
      where: { ownerPhoneNumber, contactPhoneNumber },
    });
    expect(updatedContact?.savedAs).toBe("Updated Nikki");
  });

  test("should return 401 if no auth token is provided", async () => {
    const res = await request(app)
      .post("/api/user/contacts")
      .send({ ownerPhoneNumber, contactDetails: [{ phoneNumber: contactPhoneNumber, savedAs: "Test" }] });
    expect(res.status).toBe(401);
  });

  test("should return 404 if getSavedName contact not found", async () => {
    const res = await request(app)
      .get("/api/user/getsavedname")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ ownerPhoneNumber, contactPhoneNumber: "+911111111111" });
    expect(res.status).toBe(404);
    expect(res.body.savedAs).toBeUndefined();
  });

test("should return saved name for getSavedName when contact exists", async () => {
  // Insert the contact using the API
  const contactDetails = [{ phoneNumber: contactPhoneNumber, savedAs: "Updated Nikki" }];
  await request(app)
    .post("/api/user/contacts")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ ownerPhoneNumber, contactDetails });

  // Now call the function directly
  const savedAs = await getSavedName(ownerPhoneNumber, contactPhoneNumber);

  expect(savedAs).toBe("Updated Nikki");
});
  test("should handle empty contactDetails array gracefully", async () => {
    const res = await request(app)
      .post("/api/user/contacts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ownerPhoneNumber, contactDetails: [] });
    expect(res.status).toBe(200);
    expect(res.text).toBe("Success");
  });

  test("should return 400 if ownerPhoneNumber is missing", async () => {
    const res = await request(app)
      .post("/api/user/contacts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ contactDetails: [{ phoneNumber: contactPhoneNumber, savedAs: "Test" }] });
    expect(res.status).toBe(400);
    expect(res.text).toBe("Missing required fields");
  });

  test("should return 400 if contactDetails is missing", async () => {
    const res = await request(app)
      .post("/api/user/contacts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ownerPhoneNumber });
    expect(res.status).toBe(400);
    expect(res.text).toBe("Missing required fields");
  });
});