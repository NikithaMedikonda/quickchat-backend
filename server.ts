import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { sequelizeInstance } from "./src/connection/dbconnection";

dotenv.config();
export const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());

const startServer = async () => {
  if(!sequelizeInstance){
    console.error("Sequelize Instance is not defined!");
    return;
  }
  await sequelizeInstance.authenticate();
  console.log("Database connected successfully!");
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};
startServer();
