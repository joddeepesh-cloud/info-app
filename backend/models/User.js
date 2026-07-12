const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
{
    username:{
        type:String,
        required:true,
        unique:true
    },

    password:{
        type:String,
        required:true
    },

    fullName:{
        type:String,
        default:""
    },

    email:{
        type:String,
        default:""
    },

    phone:{
        type:String,
        default:""
    },

    employeeId:{
        type:String,
        default:""
    },

    department:{
        type:String,
        default:"Development"
    },

    designation:{
        type:String,
        default:"Software Engineer"
    },

    avatar:{
        type:String,
        default:""
    },

    bio:{
        type:String,
        default:""
    },

    status:{
        type:String,
        enum:["Online","Away","Busy","Offline"],
        default:"Offline"
    },

    lastSeen:{
        type:Date,
        default:Date.now
    },

    role:{
        type:String,
        enum:["admin","manager","employee"],
        default:"employee"
    }

},{
    timestamps:true
});

module.exports = mongoose.model("User",UserSchema);