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



router.get("/profile",isloggedin,(req,res)=>{
    req.user.populate("posts");
    res.render("profile",{user:req.user});
})

router.get("/editprofile/:id",isloggedin,async(req,res)=>{
    const user=await usermodel.findOne({_id:req.params.id});
    res.render("editprofile",{user:user});
})



router.post("/edit/:id", upload.single("profilePic"), isloggedin, async (req, res) => {
    const { opassword, username, email, password, cpassword } = req.body;
    try {
        // Find the user by ID
        const user = await usermodel.findOne({ _id: req.params.id });

        // Compare the old password
        const passwordMatch = await bcrypt.compare(opassword, user.password);
        if (!passwordMatch) {
            return res.redirect(`/user/editprofile/${req.params.id}`); // If the old password is incorrect
        }

        // Update username and email if provided
        if (username) user.username = username;
        if (email) {
            const existingUser = await usermodel.findOne({ email: email });
            if (existingUser) {
                return res.redirect(`/user/editprofile/${req.params.id}`); // If email is already taken
            }
            user.email = email;
        }

        // Handle profile picture upload
        if (req.file) {
            user.photo = `/images/uploads/${req.file.filename}`;
        }

        // Update password if provided and matches
        if (password) {
            if (cpassword && password === cpassword) {
                const hashedPassword = await bcrypt.hash(password, 12); // Hash the new password asynchronously
                user.password = hashedPassword;
                user.cpassword = hashedPassword; // Assuming you store cpassword as well
            } else {
                return res.redirect(`/user/editprofile/${req.params.id}`); // If passwords don't match
            }
        }

        // Save the updated user data
        await user.save();

        // Generate a new JWT token after the user is updated
        const token = jwt(user);
        res.cookie("token", token); // Set the updated token as a cookie

        // Redirect to the profile page after successful update
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
            post.photo = `/images/postupload/${req.files['photo'][0].filename}`;
        }

        if (req.files['video']) {
            post.video = `/images/postupload/${req.files['video'][0].filename}`;
        }

        await post.save();
        res.redirect("/user/profile");
    } catch (err) {
        console.log("Something went wrong", err);
        res.status(500).send("Something went wrong");
    }
});

router.get("/logout",isloggedin,(req,res)=>{
    res.cookie("token","");
    res.redirect("/");
})

module.exports=router;