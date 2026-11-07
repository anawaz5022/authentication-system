import mongoose from "mongoose";
import config from "../src/config/config.js";
import userModel from "../src/models/user.model.js";

const email = process.argv[2]?.trim();

if (!email) {
    console.error("Usage: npm run promote-admin -- <email>");
    process.exitCode = 1;
} else {
    try {
        await mongoose.connect(config.MONGO_URI);

        const user = await userModel.findOne({ email });
        if (!user) {
            throw new Error(`No user found with email "${email}"`);
        }

        const backfill = await userModel.updateMany(
            { role: { $exists: false } },
            { $set: { role: "user" } }
        );

        user.role = "admin";
        await user.save();

        console.log(`Promoted ${user.email} to admin.`);
        console.log(`Assigned the user role to ${backfill.modifiedCount} existing account(s).`);
    } catch (error) {
        console.error("Could not promote admin:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}
