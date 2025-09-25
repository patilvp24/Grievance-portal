const express = require("express");
const app = express();
const path = require("path");
const mysql = require("mysql2");


app.use(express.urlencoded({extended:true}));
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"/views"));
app.use(express.static('public'));

const connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    database : 'complaint',
    password : 'veetrag'
});

connection.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL');
});

app.listen(3001,()=>{
    console.log("Sertver is running");
})

app.get("/",(req,res)=>{
    res.render("profession");
});

app.get("/citizen_login",(req,res)=>{
    res.render("citizen_login");
});

app.post("/citizen_login",(req,res)=>{
    const {email, password} = req.body;
    let q=`SELECT * FROM citizen WHERE email = ?`;
    connection.query(q,[email] , (err, result)=>{
        if (err) throw err;
        if (result.length > 0) {
            const citizen = result[0];
            if(password == citizen.password){
                res.redirect(`/citizen/${citizen.cid}`);
            }
            else{
                res.render("login");
            }
        } else {
            res.render("login");
        }
    })
});

app.get("/citizen_signin",(req,res)=>{
    res.render("citizen_signin");
});

app.post("/citizen_signin",(req,res)=>{
    const {email, password} = req.body;
    let insert_citizen = `INSERT INTO citizen(email,password) VALUE(?,?)`
    connection.query(insert_citizen,[email,password],(err,result_inserted)=>{
        if (err) throw err;
        res.redirect(`/citizen_login`);
    })
});

app.get("/citizen/:cid", (req, res) => {
    const { cid } = req.params;

    const get_citizen = `SELECT * FROM citizen WHERE cid = ?`;
    const get_complaints = `SELECT * FROM complaint WHERE cid = ?`;

    connection.query(get_citizen, [cid], (err, result_citizen) => {
        if (err) throw err;

        if (result_citizen.length > 0) {
            const citizen = result_citizen[0];

            connection.query(get_complaints, [cid], (err, complaints) => {
                if (err) throw err;

                res.render("citizen_home", { citizen, complaints });
            });
        } else {
            res.send("Citizen not found");
        }
    });
});


app.get("/citizen/:cid/new_complaint",(req,res)=>{
    const {cid} = req.params;
    res.render("new_complaint",{cid});
});

const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
app.post("/citizen/:cid/new_complaint", upload.single('photo'), (req, res) => {
    const { cid } = req.params;
    const { complaint, location } = req.body;
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

    let insertQuery = `INSERT INTO complaint (cid, complaint, location, photo) VALUES (?, ?, ?, ?)`;

    connection.query(insertQuery, [cid, complaint, location, photoPath], (err, result) => {
        if (err) throw err;
        res.redirect(`/citizen/${cid}`);
    });
});

app.get("/authority_login",(req,res)=>{
    res.render("authority_login");
});

app.post("/authority_login",(req,res)=>{
    const {email, password} = req.body;
    let q=`SELECT * FROM authority WHERE email = ?`;
    connection.query(q,[email] , (err, result)=>{
        if (err) throw err;
        if (result.length > 0) {
            const authority = result[0];
            if(password == authority.password){
                res.redirect(`/authority/${authority.aid}`);
            }
            else{
                res.render("authority_login");
            }
        } else {
            res.render("authority_login");
        }
    })
});

app.get("/authority_signin",(req,res)=>{
    res.render("authority_signin");
});

app.post("/authority_signin",(req,res)=>{
    const {email, password} = req.body;
    let insert_authority = `INSERT INTO authority(email,password) VALUE(?,?)`
    connection.query(insert_authority,[email,password],(err,result_inserted)=>{
        if (err) throw err;
        res.redirect(`/authority_login`);
    })
});

app.get("/authority/:aid",(req,res)=>{
    const { aid } = req.params;

    const get_authority = `SELECT * FROM authority WHERE aid = ?`;
    const get_complaints = `SELECT * FROM complaint `;

    connection.query(get_authority, [aid], (err, result_authority) => {
        if (err) throw err;

        if (result_authority.length > 0) {
            const authority = result_authority[0];

            connection.query(get_complaints, [aid], (err, complaints) => {
                if (err) throw err;

                res.render("authority_home", { authority, complaints });
            });
        } else {
            res.send("Authority not found");
        }
    });
});

app.post("/authority/:aid/complaint/:id/solve", (req, res) => {
    const { aid,id } = req.params;

    const updateQuery = `UPDATE complaint SET status = 'Solved' WHERE id = ?`;

    connection.query(updateQuery, [id], (err, result) => {
        if (err) throw err;
        res.redirect(`/authority/${aid}`);  // Redirects back to the same page
    });
});
