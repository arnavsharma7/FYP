import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientPkg from "@prisma/client";
const { PrismaClient } = prismaClientPkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const globalForPrisma = globalThis;
const prismaLogLevels =
  process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];

const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: prismaLogLevels,
  });
};

const getPrismaClient = () => {
  if (!globalForPrisma.__prisma__) {
    globalForPrisma.__prisma__ = createPrismaClient();
  }

  return globalForPrisma.__prisma__;
};

const connectPrisma = async () => {
  const client = getPrismaClient();
  await client.$connect();
  return client;
};

const disconnectPrisma = async () => {
  if (globalForPrisma.__prisma__) {
    await globalForPrisma.__prisma__.$disconnect();
    globalForPrisma.__prisma__ = undefined;
  }
};

const prisma = getPrismaClient();

export default prisma;
export { connectPrisma, disconnectPrisma, getPrismaClient };
