import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { allData } from "./admin.graphql.types.js";
import { auth } from "google-auth-library";
import { roles } from "../../../utils/enums.js";
import userModel from "../../../DB/models/user.model.js";
import companyModel from "../../../DB/models/company.model.js";


export const adminGraphQLSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: "query",
        fields: {
            allData:{
                type: allData,
                resolve: async(parent, args, context) => {
                    await auth(roles.admin)(context.req)

                    const users = await userModel.find().select('-password -otp -provider')

                    const companies = await companyModel.find()

                    return { users, companies }
                }
            }
        }
    })
})