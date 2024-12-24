const express=require("express");
const router=express.Router();
const usermodel=require("../models/user");
const isloggedin=require("../middlewares/isloggedin")

router.get("/profile",isloggedin,(req,res)=>{
    req.user.populate("posts")
    res.render("profile",{user:req.user});
})

router.post("/profile/eidtprofile/:id",async(req,res)=>{
    
})

module.exports=router;