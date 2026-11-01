import usermodel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

export async function register(req,res) {
    const { username, email, password } = req.body;
    const isalreadyregistered = await usermodel.findOne({ 
        $or:[
            {username},
            {email}
        ]
     });
     if(isalreadyregistered) {
          return res.status(400).json({ 
            message: "Username or email already registered" 
        });
     }
     const hashedpassword = crypto.createHash("sha256").update(password).digest("hex");
     const newuser = new usermodel({
        username,
        email,
        password: hashedpassword
     });
     await newuser.save();
    const token = jwt.sign({
        id: newuser._id,
    },config.JWT_SECRET, {
        expiresIn: "1d"
    });
    res.status(201).json({
        message: "User registered successfully",
        usermodel: {
            id: newuser._id,
            username: newuser.username,
            email: newuser.email
        },
        token
    });
}

export async function getMe(req,res) {
    const token = req.headers.authorization?.split(" ")[1];
    if(!token) {
        return res.status(401).json({ message: "token not found" });
    }
    const decoded = jwt.verify(token, config.JWT_SECRET);
}