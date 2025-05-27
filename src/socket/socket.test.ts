import { Server as HttpServer } from "http";
import { Sequelize } from "sequelize";
import { Server as SocketIOServer } from "socket.io";
import Client, { Socket as ClientSocket } from "socket.io-client";
import { app } from "../../server";
import { SequelizeConnection } from "../connection/dbconnection";
import { User } from "../user/user.model";
import { setupSocket } from "./socket";

let io: SocketIOServer;
let httpServer: HttpServer;
let clientA: ClientSocket;
let clientB: ClientSocket;

const TEST_PORT = 5001;
const SERVER_URL = `http://localhost:${TEST_PORT}`;

let testInstance: Sequelize;

beforeAll((done) => {
  httpServer = app.listen(TEST_PORT, () => {
    io = new SocketIOServer(httpServer);
    setupSocket(io);
    done();
  });
  testInstance = SequelizeConnection();
});

afterAll(async () => {
  io.close();
  httpServer.close();
  if (clientA.connected) clientA.disconnect();
  if (clientB.connected) clientB.disconnect();
  await User.truncate({ cascade: true });
  await testInstance.close();
});

test("should create users to chat", async () => {
  const sender = {
    phoneNumber: "+919440058809",
    firstName: "Anoosha",
    lastName: "Sanugula",
    email: "anoosha@gmail.com",
    password: "Anu@1234",
    isDeleted: false,
    publicKey: "",
    privateKey: "",
    socketId: "socket1234",
    isLogin:false,
  };

  await User.create(sender);
  const receiver = {
    phoneNumber: "+919440058801",
    firstName: "Bingi",
    lastName: "S",
    email: "bingi@gmail.com",
    password: "Anu@1234",
    isDeleted: false,
    publicKey: "",
    privateKey: "",
    socketId: "socket123",
    isLogin:false,
  };
  await User.create(receiver);
});

test("should send a private message from one user to another", (done) => {
  const message = "Hello privately!";
  const timestamp = new Date().toISOString();

  const senderPhoneNumber = "+919440058809";
  const recipientPhoneNumber = "+919440058801";

  clientB = Client(SERVER_URL);
  clientB.on("connect", () => {
    clientB.emit("join", recipientPhoneNumber);

    clientB.on(`receive_private_message_${senderPhoneNumber}`, (data) => {
      expect(data).toEqual({
        recipientPhoneNumber,
        senderPhoneNumber,
        message,
        timestamp,
      });
      done();
    });

    clientA = Client(SERVER_URL);
    clientA.on("connect", () => {
      clientA.emit("join", senderPhoneNumber);
      clientA.emit("send_private_message", {
        recipientPhoneNumber,
        senderPhoneNumber,
        message,
        timestamp,
      });
    });
  });

},10000);
