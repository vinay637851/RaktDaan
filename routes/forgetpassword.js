let express = require('express');
let router = express.Router({mergeParams:true});
let bcrypt = require('bcryptjs');
let path = require('path');
let flash = require('connect-flash');
let connection = require('../database.js');
let ejs = require('ejs');

let nodemailer=require('nodemailer');

router.use(express.static(path.join(__dirname, "../public")));
router.use(flash());

router.get("/",function(req,res){
    res.render("forgetpassword.ejs");
})
router.post("/sendlink",async function(req,res){
    try{
        let {role,email}=req.body;
        let sql='';
        console.log(role,email)
        if(role=='bank_admin')
            sql=`SELECT * FROM ${role} WHERE username=?`
        else
            sql=`SELECT * FROM ${role} WHERE email=?`;
        let existUser=await new Promise(function(resolve,reject){
            connection.query(sql,[email],async function (err, result) {
                if (err) reject(err);
                else resolve(result);
            });
        })
        console.log(existUser)
        if(existUser.length==0)
            return res.render('forgetpassword.ejs');
        if(existUser.length>0){
            let transporter=nodemailer.createTransport({
                service:'gmail',
                auth:{
                    user:'useremail3000@gmail.com',
                    pass:'owllpztgpzpyeben'
                }
            });
            let arr=['a','b','c','d','e','f','g','h','j','k','m','n','p','q','r','s','t','u','v','w','x','y','z','0','1','2','3','4','5','6','7','8','9'];
            let random_string='';
            for(let i=0;i<6;i++){
                random_string+=arr[Math.floor(Math.random()*arr.length)];
            }
            let email='';
            let emailHTML = await ejs.renderFile(path.join(__dirname, '../views/resetemail.ejs'), { randomPassword: random_string });
            console.log(random_string)
            if(role=='bank_admin')
                email=existUser[0].username;
            else
                email=existUser[0].email;
            let mailOption={
                from:'useremail3000@gmail.com',
                to:email,
                subject:'Reset Password for Rakt Daan',
                html:emailHTML
            }
            random_string=await bcrypt.hash(random_string,10);
            sql=`update ${role} set password='${random_string}' where id=?`
            connection.query(sql,[existUser[0].id],function(err,result){
                if(err||result.length===0) 
                    throw err;
            })
            transporter.sendMail(mailOption,function(err,info){
                if(err)
                    throw err;
                console.log('Email sent: ', info);
            })
        }
        res.redirect("/user");
    }
    catch(err){
        req.flash("message","no account exists here")
        res.render("forgetpassword.ejs")
    }
})
module.exports=router;