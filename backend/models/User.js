const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ["User", "Admin", "Manager", "Staff-ChknChop", "Staff-VardaBurger", "Staff-GoodJuice", "Staff-GoodNoodles", "Staff-NRB", "Staff-PUP", "Staff-STJude", "Staff-Intramuros"], 
        default: "User" 
    }
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
