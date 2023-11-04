const mongoose = require("mongoose");
const hbs = require("hbs");
const jwt = require("jsonwebtoken");
const csvDataSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: false,
    },
    Type: {
        type: String,
        required: false,
    },
    District: {
        type: String,
        required: false,
    },
    Address_of_Hospital: {
        type: String,
        required: false,
    },
    latitude: {
        type: String,
        required: false,
    },
    longitude: {
        type: String,
        required: false,
    }

});

const hospitalData = new mongoose.Schema({

    name: {
        type: String,
        required: true,

    },
    username:{
        type: String,
        required: true,

    },
    type: {
        type: String,
        required: true,

    },
    address: {
        type: String,
        required: true,

    },
    district: {
        type: String,
        required: true,

    },
    pincode: {
        type: String,
        required: true,

    },
    services: {
        type: [String], // Define services as an array of strings
        required: true
    },
    message:{
        type: String,
       
    },
    password:{
        type: String,
        required: true,
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
})

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username :{
        type: String,
        required: true
    },
    org: {
        type: String,
        required: true
    },
    qualifications: {
        type: String,
        required: true
    },
    specialization: {
        type: String,
        required: true
    },
    images: [String], // Assuming you store image paths as strings
    documents: [String], // Assuming you store document paths as strings
    experience: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,

    },
    phone: {
        type: String,
        required: true
    },
    message :{
        type: String,
       
    },
    password :{
        type: String,
        required: true
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],


})


const labform = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    hospitalInput: {
        type: String,
        required: true,
    },
    username :{
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    district: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true,
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],

})


const labtest = new mongoose.Schema({
    name: {
        type: String,
        required: true,

    },
    labType: {
        type: String,
        required: true,

    },
    labTestName: {
        type: String,
        required: true,

    },
    extraInfo: {
        type: String,
       
    },
    price:{
        type : String,
        required:true,
    }

})

const appointmentForm = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    meetType: {
        type: String,
        required: true,
    },
    doctorName: {
        type: String,
        required: true,
    },
    doctorOrg: {
        type: String,
        required: true,
    },
    doctorPhone: {
        type: String,
        required: true,
    }
})


const booktestForm = new mongoose.Schema({

    name :{
        type : String,
        required : true,
    },
    phone :{
        type : String,
        required : true,
    },
    date :{
        type : Date,
        required : true,
    },
    meetType: {
        type: String,
        enum: ['Home Service', 'Visit in Hospital/Laboratory'],
        required: true,
    },
    laboName: {
        type: String,
        required: true,
    },
    labotestName: {
        type: String,
        required: true,
    },
    documents: [String], // Assuming you store document paths as strings
})







const blogs = new mongoose.Schema({
    topic:{
        type : String,
        required : true,
    },
    subtopic:{
        type : String,
        required : true,
    },
    post:{
        type : String,
        required : true,
    },
    blogimages: {
        type: [String], 
    },
    blogvideos: {
        type: [String], 
    },
    doctorName :{
        type : String,
        required : true,
    },
    doctorOrg :{
        type : String,
        required : true,
    },
    doctorPhone :{
        type : String,
        required : true,
    },
})

//when a new user hospital register then a token will be generated ....now we will write code how to create/generate token
hospitalData.methods.generateAuthToken = async function () {
    try {
        // console.log(this._id);
       
        const token = await jwt.sign({ _id: this._id.toHexString() }, process.env.SECRET_KEY);
          this.tokens = this.tokens.concat({ token: token });
        //save the token in database
         await this.save();
        // console.log(token);
        return token;
    } catch (err) {
        console.log(err);
    }
}


//when a new doctor register then a token will be generated ....now we will write code how to create/generate token
doctorSchema.methods.generateAuthToken = async function () {
    try {
        // console.log(this._id);
        const token = await jwt.sign({ _id: this._id.toString() }, process.env.SECRET_KEY);
          this.tokens = this.tokens.concat({ token: token });
        //save the token in database
         await this.save();
        // console.log(token);
        return token;
    } catch (err) {
        console.log(err);
    }
}



//when a new laboratory / hospitals register then a token will be generated ....now we will write code how to create/generate token
labform.methods.generateAuthToken = async function () {
    try {
        // console.log(this._id);
        const token = await jwt.sign({ _id: this._id.toString() }, process.env.SECRET_KEY);
          this.tokens = this.tokens.concat({ token: token });
        //save the token in database
         await this.save();
        // console.log(token);
        return token;
    } catch (err) {
        console.log(err);
    }
}













const HospitalData = mongoose.model('HospitalData', csvDataSchema);
const Hospitals = mongoose.model("Hospitals", hospitalData);
const Doctors = mongoose.model("Doctors", doctorSchema);
const LabForm = mongoose.model("LabForm", labform);
const Labdata = mongoose.model("Labdata", labtest)
const Appointment = mongoose.model("Appointment", appointmentForm);
const BooktestForm = mongoose.model("BooktestForm", booktestForm)
const Blog = mongoose.model("Blog", blogs)

module.exports = { HospitalData, Hospitals, Doctors, LabForm, Labdata, Appointment,BooktestForm ,Blog};
