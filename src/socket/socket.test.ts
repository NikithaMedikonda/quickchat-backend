import Client, { Socket as ClientSocket } from "socket.io-client";
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { app } from "../../server";
import { setupSocket } from "./socket";


let io: SocketIOServer;
let httpServer: HttpServer;
let clientSocket: ClientSocket;
let clientA: ClientSocket;
let clientB: ClientSocket;

const TEST_PORT = 5001;
const SERVER_URL = `http://localhost:${TEST_PORT}`;

beforeAll((done) => {
  httpServer = app.listen(TEST_PORT, () => {
    io = new SocketIOServer(httpServer);
    setupSocket(io);
    done();
  });
});

afterAll(() => {
  io.close();
  httpServer.close();
  if (clientSocket.connected) {
    clientSocket.disconnect();
  }
  if (clientA.connected) clientA.disconnect();
  if (clientB.connected) clientB.disconnect();
});

test("should connect and receive a message", (done) => {
  clientSocket = Client(SERVER_URL);

  clientSocket.on("connect", () => {
    clientSocket.emit("join", { userId: "123" });

    clientSocket.emit("send_message", { message: "Hello World" });

    clientSocket.on("receive_message", (msg) => {
      expect(msg).toBe("Hello World");
      done();
    });
  });
},5000);

test("should send a private message from one user to another", (done) => {
  const fromUserId = 1;
  const toUserId = 2;
  const message = "Hello privately!";
  const timestamp = new Date().toISOString();

  clientA = Client(SERVER_URL);
  clientB = Client(SERVER_URL);

  let clientBReady = false;
  function sendPrivateMessageIfReady() {
    clientA.emit("send_private_message", {
      toUserId,
      fromUserId,
      message,
      timestamp,
    });
  }
  clientB.on("connect", () => {
    clientB.emit("join", { userId: toUserId });

    clientB.on("receive_private_message", (data) => {
      expect(data).toEqual({
        fromUserId,
        message,
        timestamp,
      });
      done();
    });

    clientBReady = true;

    if (clientA.connected) {
      sendPrivateMessageIfReady();
    }
  });

  clientA.on("connect", () => {
    clientA.emit("join", { userId: fromUserId });

    if (clientBReady) {
      sendPrivateMessageIfReady();
    }
  });

 
},5000);
