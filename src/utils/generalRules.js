import joi from 'joi'

export const generalRules = {
    id: joi.string().length(24).hex(),
    email : joi.string().email({tlds: {allow: true}, minDomainSegments: 2, maxDomainSegments: 5}),
    password : joi.string().regex(/^((?=\S*?[A-Z])(?=\S*?[a-z])(?=\S*?[0-9]).{6,})\S$/),
    headers : joi.object({
        authorization : joi.string().required(),
        'cache-control' : joi.string(),
        'postman-token' : joi.string(),
        'content-type' : joi.string(),
        'content-length' : joi.string(),
        host : joi.string(),
        'user-agent' : joi.string(),
        accept : joi.string(),
        'accept-encoding' : joi.string(),
        connection : joi.string()
    }),
    file: joi.object({
        size: joi.number().positive().required(),
        path: joi.string().required(),
        filename: joi.string().required(),
        destination: joi.string().required(),
        mimetype: joi.string().required(),
        encoding: joi.string().required(),
        originalname: joi.string().required(),
        fieldname: joi.string().required()
    }).messages({"any.required": "file is required"})
} 