require("dotenv").config();
const express=require("express");
const home=require("./routes/home");
const user=require("./routes/user");
const db=require("./config/connection");
const cookieParser=require("cookie-parser");

const app=express();

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use("/user",user);
app.use("/",home);



app.listen(3000);