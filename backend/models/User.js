const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: [ "User",
                "Admin",
                "Manager-Laguna-ChknChop", "Manager-Laguna-VardaBurger", "Manager-Laguna-TheGoodJuice", "Manager-Laguna-TheGoodNoodleBar",
                "Manager-Lipa-ChknChop", "Manager-Lipa-VardaBurger", "Manager-Lipa-Silog", "Manager-Lipa-NRB", "Manager-Lipa-Beverage",
                "Manager-Lipa-Bread", "Manager-PUPMain-ChknChop", "Manager-PUPMain-VardaBurger", "Manager-PUPMain", 
                "Manager-MAPUAIntramuros-VardaBurger", "Manager-MAPUAIntramuros-TheGoodJuice", "Manager-MAPUAMakati-ChknChop", 
                "Manager-MAPUAMakati-VardaBurger", "Manager-STJudeManila-ChknChop", "Manager-STJudeManila-VardaBurger",
                "Manager-ADMU-VardaBurger",
                "Staff-Laguna-ChknChop", "Staff-Laguna-VardaBurger", "Staff-Laguna-TheGoodJuice", "Staff-Laguna-TheGoodNoodleBar",
                "Staff-Lipa-ChknChop", "Staff-Lipa-VardaBurger", "Staff-Lipa-Silog", "Staff-Lipa-NRB", "Staff-Lipa-Beverage", "Staff-Lipa-Bread",
                "Staff-PUPMain-ChknChop", "Staff-PUPMain-VardaBurger", "Staff-PUPMain",
                "Staff-MAPUAIntramuros-VardaBurger", "Staff-MAPUAIntramuros-TheGoodJuice",
                "Staff-MAPUAMakati-ChknChop", "Staff-MAPUAMakati-VardaBurger",
                "Staff-STJudeManila-ChknChop", "Staff-STJudeManila-VardaBurger",
                "Staff-ADMU-VardaBurger"
              ], 
        default: "User" 
    }
});

const User = mongoose.model("User", UserSchema);
module.exports = User;