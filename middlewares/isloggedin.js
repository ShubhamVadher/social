const express = require("express");
const jwt = require("jsonwebtoken");
const usermodel = require("../models/user");

const isloggedin = async (req, res, next) => {
    
    try{
        if(!req.cookies.token||req.cookies.token==""){
            return res.render("index", { error: "You need to login first" });
        }
        else{
            const details = jwt.verify(req.cookies.token, process.env.JWT_KEY);
            const user = await usermodel.findOne({ email: details.email });
            req.user = user;
            next();
        }
    }
    catch(err){
        res.send("Something went wrong");
    }

};

module.exports = isloggedin;
