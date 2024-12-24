const mongoose=require("mongoose");

mongoose.connect(`${process.env.mongoose_key}social`)
.then(()=>{
    console.log("Connected to DB");
})
.catch((err)=>{
    console.log("Could not connect to db",err.message);
})

module.exports=mongoose.connection;