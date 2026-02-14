// // api/index.js
// import app from "../src/app.js";

// export default function handler(req, res) {
//   try {
//     return app(req, res); // Express app هو نفسه request handler
//   } catch (err) {
//     console.error("Handler error:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// }
