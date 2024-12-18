let express = require('express');
let router = express.Router({mergeParams: true });
let bcrypt = require('bcryptjs');
let passport = require('passport');
let localpassport = require('passport-local').Strategy;
let path = require('path');
let connection = require('../database.js');

router.use(express.static(path.join(__dirname, "../public")));

passport.use('login-local', new localpassport(
    {
        usernameField: 'username',
        passwordField: 'password', 
        passReqToCallback: true   
    },
    async function (req,username, password, done) {
        try {
            let sql="";
            let {role}=req.body;
            if(role=='donor')
                sql=`SELECT * FROM donor WHERE email = ?`
            else if(role=='admin')
                sql=`SELECT * FROM admin WHERE username = ?`
            else
            sql=`SELECT * FROM bank_admin WHERE username = ?`
        connection.query(sql, [username], async function (err, result) {
            if (err) throw err;
            if (result.length == 0) return done(null, false);
            
            let user = result[0];
            let match = await bcrypt.compare(password, user.password);
            console.log(role,username,match);
            if (match) 
                return done(null, user)
            else return done(null, false);
        });
        } catch (err) {
            console.log("errorin passport authenication ");
            return done(err);
        }
    }
));
router.get("/",function(req,res){
    res.render("login.ejs");
})

router.get("/login", function (req, res) {
    if(!req.user)
        res.render("login.ejs")
    else if (req.isAuthenticated()&& req.user.role === 'donor') 
        res.redirect('/donor/dashboard')
    else if(req.isAuthenticated()&& req.user.role === 'admin')
        res.redirect('/admin/dashboard')
    else if(req.isAuthenticated()&& req.user.role === 'bank_admin')
        res.redirect('/bank/dashboard')
    else 
        res.render("login.ejs");
});

router.post("/login", passport.authenticate('login-local', {
    successRedirect: "/user/login",
    failureRedirect: "/user",
    failureFlash: true
}));

router.get('/logout', function (req, res) {
    req.logout(function (err) {
        if (err) console.log(err);
        res.redirect('/');
    });
});

module.exports = router;