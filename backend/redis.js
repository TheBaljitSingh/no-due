import Redis from "ioredis";
import dotenv from "dotenv"
import { getIo } from "./socket/index.js";
dotenv.config({ path: '.env.development.local' })

const REDIS_URL = process.env.REDIS_URL;


let redisSub;


export function initRedisSubscriber(io) {
  redisSub = new Redis(REDIS_URL);

  redisSub.subscribe("whatsapp.events");

  redisSub.on("message", (channel, message) => {
    try {
      const payload = JSON.parse(message);

      console.log("Whatsapp data:", payload);


      // emmit to client side
      if (payload.customerId) {
        io.to(`customer:${payload.customerId}`).emit("new_message", payload);
      }
    } catch (err) {
      console.error("Redis message error", err);
    }
  });
}
