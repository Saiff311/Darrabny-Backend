import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({path:path.resolve("./src/config/.env")})
import bootstrap from './src/app.controller.js'
import { runIo } from './src/modules/chat/chat.socket.js'


process.on("unhandledRejection", (reason, promise) => {
  console.error("❗ Unhandled Rejection:", reason);
});

const app = express()
const port = process.env.PORT

bootstrap(app,express)


const httpServer = app.listen(port, () => console.log(`App listening on port ${port}!`))

runIo(httpServer)