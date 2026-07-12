const User = require("../models/User");

// Get All Users
exports.getUsers = async (req,res)=>{
    const users = await User.find().select("-password");
    res.json(users);
};

// Get One User
exports.getUser = async(req,res)=>{
    const user = await User.findById(req.params.id).select("-password");

    if(!user)
        return res.status(404).json({
            success:false,
            message:"User not found"
        });

    res.json(user);
};

// Update User
exports.updateUser = async(req,res)=>{

    const user = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        {new:true}
    ).select("-password");

    res.json(user);
};

// Delete User
exports.deleteUser = async(req,res)=>{

    await User.findByIdAndDelete(req.params.id);

    res.json({
        success:true,
        message:"User Deleted"
    });

};