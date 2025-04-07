const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: [ "User",
                "Admin",
                "Staff-Laguna-ChknChop", "Staff-Laguna-VardaBurger", "Staff-Laguna-TheGoodJuice", "Staff-Laguna-TheGoodNoodleBar",
                "Staff-Lipa-ChknChop", "Staff-Lipa-VardaBurger", "Staff-Lipa-Silog", "Staff-Lipa-NRB", "Staff-Lipa-Beverage", "Staff-Lipa-Bread",
                "Staff-PUPMain-ChknChop", "Staff-PUPMain-VardaBurger",
                "Staff-MAPUAIntramuros-VardaBurger", "Staff-MAPUAIntramuros-TheGoodJuice",
                "Staff-MAPUAMakati-ChknChop", "Staff-MAPUAMakati-VardaBurger",
                "Staff-STJudeManila-ChknChop", "Staff-STJudeManila-VardaBurger",
              ], 
        default: "User" 
    }
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
