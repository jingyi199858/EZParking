const mongoose = require("mongoose")

const PinSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
    },
    street: {
        type: String,
        require: true,
        min: 3
    },
    desc: {
        type: String,
        reuiqre: true,
    },
    lat: {
        type: Number,
        require: true
    },
    long: {
        type: Number,
        require: true
    }
}, {timestamps: true});

module.exports = mongoose.model("Pin", PinSchema)