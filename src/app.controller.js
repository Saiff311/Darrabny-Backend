// import { createHandler } from "graphql-http/lib/use/express"
// import connectDB from "./DB/connectionDB.js"
// import authRouter from "./modules/auth/auth.controller.js"
// import companyRouter from "./modules/company/company.controller.js"
// import userRouter from "./modules/user/user.controller.js"
// import chatRouter from "./modules/chat/chat.controller.js"
// import adminRouter from "./modules/Admin/regularApis/admin.controller.js"
// import { globalErrorHandler } from "./utils/globalErrorHandling.js"
// import { rateLimiter } from "./utils/security/rateLimit.js"
// import cors from 'cors'
// import path from 'path'
// import { adminGraphQLSchema } from "./modules/Admin/graphql/admin.graphql.js"
// import collegeRouter from "./modules/college/college.controller.js"
// import internshipRouter from "./modules/internship/internship.controller.js"

// const bootstrap = (app,express)=>{
//     app.use(express.json())
//     //home route
//     app.get("/",(req,res)=>{
//         res.status(200).json({message: "Welcome to Internship App"})
//     })

//     connectDB()

//     // app.use(rateLimiter)
//     app.use(cors())
//     app.use("/uploads",express.static(path.resolve("src/uploads")))

//     app.use("/auth",authRouter)
//     app.use("/user",userRouter)
//     app.use("/company",companyRouter)
//     app.use("/internship",internshipRouter)
//     app.use("/college",collegeRouter)
//     app.use("/admin",adminRouter)
//     app.use("/chat",chatRouter)

//     app.use("/graphql",createHandler({
//         schema: adminGraphQLSchema,
//         context: (req)=>({req})
//     }))

//     app.use(globalErrorHandler)

//     app.use("*",(req, res)=>{
//         return res.status(404).json({msg: "404 page not found!"})

//     })
// }

// export default bootstrap

import { createHandler } from "graphql-http/lib/use/express";
import connectDB from "./DB/connectionDB.js";
import authRouter from "./modules/auth/auth.controller.js";
import companyRouter from "./modules/company/company.controller.js";
import userRouter from "./modules/user/user.controller.js";
import studentRouter from "./modules/student/student.controller.js"; // Etoo
import chatRouter from "./modules/chat/chat.controller.js";
import adminRouter from "./modules/Admin/regularApis/admin.controller.js";
import { globalErrorHandler } from "./utils/globalErrorHandling.js";
import { rateLimiter } from "./utils/security/rateLimit.js";
import cors from "cors";
import path from "path";
import { adminGraphQLSchema } from "./modules/Admin/graphql/admin.graphql.js";
import internshipRouter from "./modules/internship/internship.controller.js";

const bootstrap = (app, express) => {
  connectDB();
  app.use(express.json());
  app.use(rateLimiter);
  app.use(cors());
  app.use("/uploads", express.static(path.resolve("src/uploads")));

  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/student", studentRouter);
  app.use("/company", companyRouter);
  app.use("/internship", internshipRouter);
  app.use("/admin", adminRouter);
  app.use("/chat", chatRouter);
  app.use("/internship", internshipRouter);

  app.use(
    "/graphql",
    createHandler({
      schema: adminGraphQLSchema,
      context: (req) => ({ req }),
    }),
  );

  app.use(globalErrorHandler);

  app.use("*", (req, res) => {
    return res.status(404).json({ msg: "404 page not found!" });
  });
};

export default bootstrap;
