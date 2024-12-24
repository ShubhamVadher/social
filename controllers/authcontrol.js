const express=require("express");
const jwt=require("../utils/jwt");
const bcrypt=require("bcrypt");
const usermodel=require("../models/user");

module.exports.register=async(req,res)=>{
    try{
        const {username,email,password,cpassword}=req.body;
        const user=await usermodel.findOne({email:email});
        if(user) return res.status(400).render("index", { error: "User Already exists" });
        else if(!username||!email||!password||!cpassword) return res.status(400).render("index", { error: "All fields are required" });
        else if(password!=cpassword) return res.status(400).render("index", { error: "Password and confirm password do not match" });
        else{
            bcrypt.genSalt(12,(err,salt)=>{
                bcrypt.hash(password,salt,async (err,hash)=>{
                    const user=await usermodel.create({
                        username,
                        email,
                        password:hash,
                        cpassword:hash
                    })
                    const token=jwt(user);
                    res.cookie("token",token);
                    res.redirect("/user/profile");
                })
            })   
        }
    }
    catch(err){
        res.send("Something went wrong");
    }
}

module.exports.login=async(req,res)=>{
    try{
        const{email,password}=req.body;
        const user=await usermodel.findOne({email:email});
        if(!user) return res.status(404).render("index",{error:"Email or password is wrong"});
        else if(!email||!password) return res.status(404).render("index",{error:"All fiels are required"});
        else{
            bcrypt.compare(password,user.password,(err,result)=>{
                if(result){
                    const token=jwt(user);
                    res.cookie("token",token);
                    res.redirect("/user/profile");
                }
                else{
                    return res.status(404).render("index",{error:"Email or password is wrong"});
                }
            })
        }
    }
    catch(err){
        res.send("Something went wrong");
    }
}