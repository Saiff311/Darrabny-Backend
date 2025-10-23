import { GraphQLBoolean, GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";

const numberOfEmployeesType = new GraphQLObjectType({
    name: "numberOfEmployees",
    fields:{
        from:{type: GraphQLInt},
        to:{type: GraphQLInt}
    }
})

const picType = new GraphQLObjectType({
    name: "pic",
    fields:{
        secure_url:{type: GraphQLString},
        public_id:{type: GraphQLString}
    }
})


export const userType = new GraphQLObjectType ({
    name: "User",
    fields: () => ({
        _id: { type: GraphQLID },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        userName: { type: GraphQLString },
        email: { type: GraphQLString },
        gender: {type: GraphQLString},
        DOB: {type: GraphQLString},
        mobileNumber: {type: GraphQLString},
        changeCredentialTime: {type: GraphQLString},
        bannedAt: {type: GraphQLString},
        deletedAt: {type: GraphQLString},
        isDeleted: {type: GraphQLBoolean},
        isConfirmed: {type: GraphQLBoolean},
        updatedBy: {type: userType},
        profilePic: {type: picType},
        coverPic: {type: picType},
        role: { type: GraphQLString }
    })
})

export const companyType = new GraphQLObjectType ({
    name: "company",
    fields: () => ({
        _id: { type: GraphQLID },
        companyName: { type: GraphQLString },
        description: { type: GraphQLString },
        industry: { type: GraphQLString },
        address: { type: GraphQLString },
        numberOfEmployees:{type: numberOfEmployeesType},
        companyEmail: { type: GraphQLString },
        createdBy: {type: userType},
        logo: {type: picType},
        coverPic: {type: picType},
        HRs: {type: new GraphQLList(userType)},
        bannedAt: {type: GraphQLString},
        deletedAt: {type: GraphQLString},
        legalAttachment: {type: picType},
        approvedByAdmin: { type: GraphQLBoolean },
    })
})

export const allData = new GraphQLObjectType ({
    name: "allData",
    fields: () => ({
        users: { type: new GraphQLList(userType) },
        companies: { type: new GraphQLList(companyType) }
    })
})

