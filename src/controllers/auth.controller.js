import usermodel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";

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

     const refreshToken = jwt.sign({
        id: newuser._id,
    },config.JWT_SECRET, {
        expiresIn: "7d"
    })

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.create({
        user: newuser._id,
        refreshTokenHash,
        ip: req.ip,
        userAgent: req.get("User-Agent")
    });

    const accessToken = jwt.sign({
        id: newuser._id,
        sessionId: session._id
    },config.JWT_SECRET, {
        expiresIn: "15m"
    }
)
    
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
            email: newuser.email,
            role: newuser.role
        },
        accessToken,
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

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const session = await sessionModel.findOne(
        {
            refreshTokenHash,
            revoked: false
        }
    )
    if(!session) {
        return res.status(401).json({
            message: "Invalid refresh token"
        })
    }

    const accessToken = jwt.sign({
        id: decoded.id,
        sessionId: session._id
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

export async function logout(req,res) {
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) {
        return res.status(401).json({
             message: "Refresh token not found" 
            })
    }

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.findOne(
        {
            refreshTokenHash,
            revoked: false
        }
    )

    if(!session) {
        return res.status(401).json({
            message: "Invalid refresh token"
        })
    }

    session.revoked = true;
    await session.save();

    res.clearCookie("refreshToken");
    res.status(200).json({
        message: "User logged out successfully"
    })
}

export async function logoutAll(req,res) {
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) {
        return res.status(401).json({
             message: "Refresh token not found" 
            })
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)

    await sessionModel.updateMany(
        {
            user: decoded.id,
            revoked: false
        },
        {
            $set: { revoked: true }
        }
    )

    res.clearCookie("refreshToken");
    res.status(200).json({
        message: "User logged out from all sessions successfully"
    })
    
}

export async function login(req,res){

    const { email, password } = req.body;

    const user = await usermodel.findOne({email})

    if(!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    const hashedpassword = crypto.createHash("sha256").update(password).digest("hex");

    if(user.password !== hashedpassword) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    const refreshToken = jwt.sign({
        id: user._id,
    },config.JWT_SECRET, {
        expiresIn: "7d"
    })

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.create({
        user: user._id,
        refreshTokenHash,
        ip: req.ip,
        userAgent: req.get("User-Agent")
    });

    const accessToken = jwt.sign({
        id: user._id,
        sessionId: session._id
    },config.JWT_SECRET, {
        expiresIn: "15m"
    })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.status(200).json({
        message: "User logged in successfully",
        accessToken
    }) 
}