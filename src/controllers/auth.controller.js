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
     const newuser = await usermodel.create
     ({
        username,
        email,
        password: hashedpassword
     }); 
     await newuser.save();

    const accessToken = jwt.sign({
        id: newuser._id,
    },config.JWT_SECRET, {
        expiresIn: "15m"
    }
)
    const refreshToken = jwt.sign({
        id: newuser._id,
    },config.JWT_SECRET, {
        expiresIn: "7d"
    })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    // const newRefreshToken = jwt.sign({
    //     id: newuser._id,
    // },config.JWT_SECRET, {
    //     expiresIn: "7d"
    // })
    // res.cookie("refreshToken", newRefreshToken, {
    //     httpOnly: true,
    //     secure:false,
    //     sameSite: "lax",
    //     maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    // })  

    res.status(201).json({
        message: "User registered successfully",
        usermodel: {
            id: newuser._id,
            username: newuser.username,
            email: newuser.email
        },
        accessToken,
    })
}

export async function getMe(req,res) {
    const token = req.headers.authorization?.split(" ")[1];
    if(!token) {
        return res.status(401).json({ message: "token not found" });
    }
    const decoded = jwt.verify(token, config.JWT_SECRET)
    const user=await usermodel.findById(decoded.id)
    res.status(200).json({
        message: "User fetched successfully",
        user: {
            username: user.username,
            email: user.email
        }
    })
}

export async function refreshToken(req,res) {
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) {
        return res.status(401).json({
             message: "Refresh token not found" 
            })
    }
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)
    const accessToken = jwt.sign({
        id: decoded.id,
    },config.JWT_SECRET, {
        expiresIn: "15m"
    })
    const newRefreshToken = jwt.sign({
        id: decoded.id,
    },config.JWT_SECRET, {
        expiresIn: "7d"
    })
    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure:false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    res.status(200).json({
        message: "Access token refreshed successfully",
        accessToken
    })
}