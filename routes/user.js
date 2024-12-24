const express=require("express");
const router=express.Router();
const usermodel=require("../models/user");
const isloggedin=require("../middlewares/isloggedin")
const cookieParser=require("cookie-parser");
const multer=require("multer");
const path=require("path");
const crypto=require("crypto");
const bcrypt=require("bcrypt");
const jwt=require("../utils/jwt");
const postmodel=require("../models/post");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/images/uploads'));
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(12, (err, bytes) => {
            const fn = bytes.toString("hex") + path.extname(file.originalname);
            cb(null, fn);
        });
    }
});
const upload = multer({ storage: storage })


const poststorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Define the folder where the files will be uploaded
        cb(null, path.join(__dirname, '../public/images/postupload'));
    },
    filename: function (req, file, cb) {
        // Generate a unique file name to avoid overwriting
        crypto.randomBytes(12, (err, bytes) => {
            const fn = bytes.toString("hex") + path.extname(file.originalname);
            cb(null, fn);
        });
    }
});

// Initialize multer with the storage configuration
const postupload = multer({ storage: poststorage });



router.get("/profile",isloggedin,async(req,res)=>{
    await req.user.populate("posts");
    res.render("profile",{user:req.user});
})

router.get("/editprofile/:id",isloggedin,async(req,res)=>{
    const user=await usermodel.findOne({_id:req.params.id});
    const error = req.query.error || ""; // Get error message from query params if available
    res.render("editprofile", { user: user, error: error });
    
})



router.post("/edit/:id", upload.single("profilePic"), isloggedin, async (req, res) => {
    const { opassword, username, email, password, cpassword } = req.body;

    try {
        // Find the user by ID
        const user = await usermodel.findById(req.params.id);
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Compare the old password (mandatory for any update)
        const passwordMatch = await bcrypt.compare(opassword, user.password);
        if (!passwordMatch) {
            return res.redirect(`/user/editprofile/${req.params.id}?error=original Pawword Incorrect`);
        }

        // Update profile picture if provided
        if (req.file) {
            user.photo = `/images/uploads/${req.file.filename}`;
        }

        // Update username if provided
        if (username) {
            user.username = username.trim();
        }

        // Update email if provided
        if (email && email !== user.email) {
            const existingUser = await usermodel.findOne({ email: email });
            if (existingUser) {
                return res.redirect(`/user/editprofile/${req.params.id}?error=User Already Exists`);
            }
            user.email = email;
        }

        // Update password if provided and both password and cpassword match
        if (password) {
            if (cpassword && password === cpassword) {
                const hashedPassword = await bcrypt.hash(password, 12);
                user.password = hashedPassword;
                user.cpassword=hashedPassword;
            } else {
                return res.redirect(`/user/editprofile/${req.params.id}?error=Password and confirm password does not match`);
            }
        }

        // Save the updated user data
        await user.save();

        // Generate a new JWT token after the user is updated (if necessary)
        const token = jwt(user);
        res.cookie("token", token); // Set the updated token as a cookie

        // Redirect to the profile page after a successful update
        return res.redirect("/user/profile");

    } catch (err) {
        console.error(err);
        return res.status(500).send("Something went wrong");
    }
});



router.get("/createpost/:id",isloggedin,async(req,res)=>{
    const user=await usermodel.findOne({_id:req.params.id});
    res.render("makepost",{user:user});
})

router.post("/create/:id", postupload.fields([{ name: 'photo', maxCount: 1 },{ name: 'video', maxCount: 1 }]), isloggedin, async (req, res) => {
    try {
        if (req.body.content === "") {
            return res.redirect(`/user/createpost/${req.params.id}`);
        }

        const post = new postmodel({
            content: req.body.content,
            user: req.params.id
        });

        if (req.files['photo']) {
            post.image = `/images/postupload/${req.files['photo'][0].filename}`;
        }

        if (req.files['video']) {
            post.video = `/images/postupload/${req.files['video'][0].filename}`;
        }

        await post.save();

        const postuser=await usermodel.findOne({_id:req.params.id});
        postuser.posts.push(post._id);
        await postuser.save();

        res.redirect("/user/profile");
    } catch (err) {
        console.log("Something went wrong", err);
        res.status(500).send("Something went wrong");
    }
});

router.get("/like/:pid/:uid", isloggedin, async (req, res) => {
    try {
        const post = await postmodel.findOne({ _id: req.params.pid });

        if (post.likes.indexOf(req.params.uid) === -1) {
            post.likes.push(req.params.uid);
        } else {
            // Remove the user if already liked
            post.likes.splice(post.likes.indexOf(req.params.uid), 1);
        }

        await post.save();

        // Redirect back to the referring page
        const referer = req.get('Referer');
        res.redirect(referer || '/user/profile'); // Default to /user/profile if no referer
    } catch (err) {
        console.error(err);
        res.redirect('/user/profile'); // Redirect to profile in case of error
    }
});


router.get("/editpost/:pid", isloggedin, async (req, res) => {
    try {
        const post = await postmodel.findOne({ _id: req.params.pid });
        if (!post) {
            return res.status(404).send("Post not found"); // Handle case where post is not found
        }
        res.render("editpost", { post });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong");
    }
});

router.post("/editposts/:pid",postupload.fields([{name:"photo",maxCount:1},{name:"video",maxCount:1}]),isloggedin,async(req,res)=>{
    const post=await postmodel.findOne({_id:req.params.pid});
    post.content=req.body.content;

    if(req.files['photo']){
        post.image=`/images/postupload/${req.files['photo'][0].filename}`;

    }
    if(req.files['video']){
        post.video=`/images/postupload/${req.files['video'][0].filename}`;
    }
    await post.save();
    res.redirect("/user/profile");
})

router.get("/delete/:pid",async(req,res)=>{
    try{
        const post=await postmodel.findOneAndDelete({_id:req.params.pid});
        const user=await usermodel.findOne({_id:post.user});
        user.posts.splice(user.posts.indexOf(post._id),1);
        await user.save();
        res.redirect("/user/profile");
    }
    catch(err){
        console.log(err);
    }
})

router.get("/seeposts/:uid",async(req,res)=>{
    const user=await usermodel.findOne({_id:req.params.uid});
    const posts=await postmodel.find();
    res.render("seeposts",{user:user,posts:posts});
})


router.get("/logout",isloggedin,(req,res)=>{
    res.cookie("token","");
    res.redirect("/");
})

module.exports=router;