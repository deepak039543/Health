const jwt = require("jsonwebtoken");
const {LabForm} = require("../model/schema.js");
const { registerHelper } = require("hbs");

const labAuth = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    const verifyuser = jwt.verify(token, process.env.SECRET_KEY);
    // console.log(`this is the : ${verifyuser._id}`)
    // console.log(verifyuser);
    // console.log(verifyuser._id);
    // console.log(typeof(verifyuser._id));
    // Convert the ID to ObjectId
    // const userId = mongoose.Types.ObjectId(verifyuser._id);
      const user = await LabForm.findById(verifyuser._id);
      // console.log(`geting this :${user}`)
    // const user = await Hospitals.find({}).catch((err) => {
    //   console.error("Error querying the database:", err);
    // });
    
    // console.log(user);
    req.token = token;
    // console.log(req.token);
    req.user = user;
    next();
  } catch (err) {
    res.status(400).send(err);
  }
}

module.exports = labAuth;