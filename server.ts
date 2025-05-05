import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();
export const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());

const startServer  = async() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
startServer();