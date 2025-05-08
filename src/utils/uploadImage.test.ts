import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import { Sequelize } from "sequelize";
import { SequelizeConnection } from "../connection/dbconnection";
import { getProfileImageLink } from "./uploadImage";
import { base64 } from "../constants/example.base64";

describe("getProfileImageUrl", () => {
  let testInstance: Sequelize;
  const originalEnv = process.env;
  beforeEach(() => {
    process.env = { ...originalEnv };
  });
  afterEach(() => {
    process.env = originalEnv;
  });
  beforeAll(() => {
    testInstance = SequelizeConnection()!;
  });

  test("should return the error message when the image format is invalid", async () => {
    try {
      const response = await getProfileImageLink("base64stringofimage");
    } catch (error: any) {
      expect(error.message).toBe(
        "Error uploading the image to bucket: Invalid image format"
      );
    }
  });
  test("should return the image url upon successful upload", async() => {
    const image=base64;
       const response = await getProfileImageLink(image);
       expect(response).toBeTruthy();
    });
  test("should return the error when the error occurs during the storing", async () => {
    process.env.SUPABASE_URL = "changed _url";
    try {
      const response = await getProfileImageLink(
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AA"
      );
    } catch (error: any) {
      expect(error.message).toBe(
        "Error uploading the image to bucket: Invalid URL"
      );
    }
  });
  test("should return the error message when the supabase url, service key or bucket name is missing", async () => {
    delete process.env.BUCKET_NAME;
    try {
      const response = await getProfileImageLink("base64stringofimage");
    } catch (error: any) {
      expect(error.message).toBe(
        "Error uploading the image to bucket: Supabase url, service key and bucket name are required"
      );
    }
  });
});
