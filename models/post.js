const mongoose=require("mongoose");

const postschema=mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    date:{
        type:Date,
        default:Date.now
    },
    content:String,
    image:String,
    video:String
})

module.exports=mongoose.model("post",postschema);