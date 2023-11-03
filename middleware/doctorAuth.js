const jwt = require("jsonwebtoken");
const {Doctors }= require("../model/schema.js");
const { registerHelper } = require("hbs");

const doctorAuth = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        const verifyuser = jwt.verify(token, process.env.SECRET_KEY);
      //  console.log(verifyuser);

        const user = await Doctors.findOne({ _id: verifyuser._id });
      //  console.log(user.username);
        req.token = token;
        req.user = user;
        next();
    } catch (err) {
        res.status(400).send(err);
    }
}

module.exports = doctorAuth;