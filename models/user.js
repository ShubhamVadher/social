const mongoose=require("mongoose");

const userschema=mongoose.Schema({
    username:{
        type:String,
        require:true,
    },
    photo:{
        type:String,
        default:"/images/default.png",
    },
    email:{
        type:String,
        require:true,
    },
    password:{
        type:String,
        require:true,
    },
    cpassword:{
        type:String,
        require:true,
    },
    posts:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"post",
    }]
})

module.exports=mongoose.model("user",userschema);