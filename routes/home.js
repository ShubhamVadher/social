const express=require("express");
const router=express.Router();
const {register,login}=require("../controllers/authcontrol");
const isloggedin=require("../middlewares/isloggedin")

router.get("/",(req,res)=>{
    res.render("index",{error:""});
})

router.post("/register",register);

router.post("/login",login);







module.exports=router;