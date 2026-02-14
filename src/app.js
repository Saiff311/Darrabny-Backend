// import express from "express";
// import dotenv from "dotenv";
// import bootstrap from "./app.controller.js";
// dotenv.config();

// const app = express();

// // Routes سريعة قبل أي 404
// app.get("/", (_req, res) => res.send("✅ Express on Vercel is running"));
// // app.get("/api/health", (_req, res) => res.json({ ok: true }));

// // سجل الراوترات واتصال DB
// await bootstrap(app, express);

// // 404 (آخر حاجة)
// app.use((req, res) => {
//   return res.status(404).json({
//     message: "Route not found",
//     method: req.method,
//     path: req.originalUrl, // ← كان فيها typo
//   });
// });

// export default app;
