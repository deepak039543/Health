const express = require("express")
const app = express();
const path = require("path")
const hbs = require("hbs");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const hospitalAuth = require("./middleware/hospitalAuth.js");
const doctorAuth = require("./middleware/doctorAuth.js");
const labAuth = require("./middleware/labAuth.js");



app.use(cookieParser());

// Define the path to your public folder
const publicDirectoryPath = path.join(__dirname, './public/');
// Use express.static middleware to serve static files (like CSS)
app.use(express.static(publicDirectoryPath));

const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/doctorsUploads/'); // Specify the upload directory
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use the original file name
    },
});
const upload = multer({ storage: storage });






const port = 3000;

require("./database/connection.js");
const { HospitalData, Hospitals, Doctors, LabForm, Labdata, Appointment, Blog, BooktestForm } = require("./model/schema.js");


//use json file
app.use(express.json());
//use cookie parser as a middleware
// app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));

//set all the static files in public directory
// app.use('/css', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'css')));
// app.use('/css', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'js')));
// app.use('/static', express.static(path.join(__dirname, './public/')));


//set template engine
app.set("view engine", "hbs");


//render the home page to user
app.get("/", (req, res) => {
    res.render("Home");
})


//render statically hospital list which is working under MA AMRUTAM SEVA
app.get("/findDoctors", async (req, res) => {
    const details = await HospitalData.find({});
    // console.log(details);
    res.render("findDoctors", { details });
})








// <---------------- hospital section (first registration -> show his/her doctor activities like profile and appointment )-------->

//when hospitals first time visit by hospital page
app.get("/forHospitals", (req, res) => {
    res.render("forHospitals");
})
//handle the hospitals data and saved in mongodb
app.post("/forHospitals", async (req, res) => {

    //  console.log(req.body);
    try {

        const { name, type, address, district, pincode, services, username, message, password } = req.body;
        if (!req.body.name) {
            return res.render('forHospitals', { error: '*please enter name' });
        }
        if (!req.body.username) {
            return res.render('forHospitals', { error: '*please enter username' });
        }
        if (!req.body.type) {
            return res.render('forHospitals', { error: '*please select hospital type' });
        }
        if (!req.body.address) {
            return res.render('forHospitals', { error: '*please enter address' });
        }
        if (!req.body.district) {
            return res.render('forHospitals', { error: '*please enter district' });
        }
        if (!req.body.pincode) {
            return res.render('forHospitals', { error: '*please enter pincode' });
        }
        if (req.body.pincode.length > 6) {
            return res.render('forHospitals', { error: '*please enter valid pincode' });
        }
        if (!req.body.services) {
            return res.render('forHospitals', { error: '*please select services' });
        }
        if (!req.body.password) {
            return res.render('forHospitals', { error: '*please enter password' });
        }
        const existUsername = await Hospitals.findOne({ username: req.body.username });
        if (existUsername) {
            return res.render('forHospitals', { error: '*username is already in use' });
        }
        const hospital = new Hospitals({
            name,
            type,
            address,
            district,
            pincode,
            services: Array.isArray(services) ? services : [services],
            username,
            message,
            password,
        });
        //create a token 
        const token = await hospital.generateAuthToken();

        //save token in cookies
        res.cookie("jwt", token);

        await hospital.save();
        //  res.send('Data saved successfully');
        res.redirect("/hospitalDashboard");
    } catch (err) {
        console.log(err);
    }

})

//when hospital already registered and click to login page then render login page
app.get("/hospitalLogin", (req, res) => {
    res.render("loginHospital");
})
//check user already registered or not if not then render registeration page otherwise send success response 
app.post("/hospitalLogin", async (req, res) => {
    try {

        const user = req.body.username;
        if (!user) {
            return res.render('loginHospital', { error: '*please enter username' });
        }
        //  console.log(user);
        const pass = req.body.password;
        if (!pass) {
            return res.render('loginHospital', { error: '*please enter password' });
        }
        //   console.log(pass);
        //  console.log(`${user} and password is ${pass}`);
        const userName = await Hospitals.findOne({ username: user });

        if (!userName) {
            return res.render('loginHospital', { error: '*Username not found. Please register before logging in.' });
        }

        // console.log(userName.username)
        // const loginDate = new Date();
        //  if (userName.password === pass) {
        //     res.status(200).render("regist");
        // }else{
        //     res.send("invalid details!")
        //  }



        //now we compare hash password with the already hashed password that is present in database
        // const isMatch = await bcrypt.compare(pass, userName.password)
        //match the token and login
        // const token = userName.generateAuthToken();
        // console.log(token);

        if (userName.password === pass) {
            const token = await userName.generateAuthToken();


            //save the token in cookies
            res.cookie("jwt", token);

            //check the token stores in cookies
            //  console.log(req.cookies.jwt);

            // console.log(token);

            //save the last date and time when user login 
            // userName.lastLoginDate = loginDate;
            await userName.save();


            // res.status(200).send("successfully login");
            res.redirect("/hospitalDashboard");
        } else {
            res.render('loginHospital', { error: '*Invalid password!' });
        }
    } catch (err) {
        console.error("Error saving document:", err);
        res.status(400).send(err);
    }
})
//render the registered hospital which is active on this application
app.get("/registeredHospitals", async (req, res) => {
    try {
        const details = await Hospitals.find({});
        // console.log(details);
        res.render("registeredHospital", { details });
    } catch (err) {
        console.log(err);
    }
})
//here render the hospiptal dashboard for every hospitals and show all the doctors name when click to find doctors
app.get("/hospitalDashboard", hospitalAuth, async (req, res) => {

    try {
        const hospital = req.user;
        //  console.log(hospital);
        const details = await Doctors.find({ org: hospital.name });
        // console.log(details);
        res.render("hospitalDashboard", { hospital, details });
    } catch (err) {
        console.log(err);
    }
})

















// <---------------- doctor section (first registration -> show appointment )-------->



//when doctors first time visit in by doctors page
app.get("/forDoctors", async (req, res) => {
    const hospitals = await Hospitals.find({});
    // console.log(hospitals);
    res.render("forDoctors", { hospitals });
})
//handle doctors data and saved in mongodb
app.post("/submit_info", upload.fields([{ name: 'images', maxCount: 1 }, { name: 'documents', maxCount: 5 }]), async (req, res) => {



    const hospitals = await Hospitals.find({});
    // console.log(req.files);
    if (!req.body.name) {
        return res.render('forDoctors', { error: '*please enter name', hospitals });
    }
    if (!req.body.username) {
        return res.render('forDoctors', { error: '*please enter username', hospitals });
    }
    if (!req.body.org) {
        return res.render('forDoctors', { error: '*please enter hospital name', hospitals });
    }
    if (!req.body.qualifications) {
        return res.render('forDoctors', { error: '*please write about your qualifications', hospitals });
    }
    if (!req.body.specialization) {
        return res.render('forDoctors', { error: '*please write about your specialization', hospitals });
    }
    if (!req.body.experience) {
        return res.render('forDoctors', { error: '*please write about your experience', hospitals });
    }
    if (!req.files.images) {
        return res.render('forDoctors', { error: '* Please upload a profile image', hospitals });
    }
    if (!req.files.documents) {
        return res.render('forDoctors', { error: '* Please upload documents', hospitals });
    }
    if (!req.body.email) {
        return res.render('forDoctors', { error: '*please enter email', hospitals });
    }
    if (!req.body.phone) {
        return res.render('forDoctors', { error: '*please enter phone number', hospitals });
    }
    if (req.body.phone.length > 10) {
        return res.render('forHospitals', { error: '*please enter valid phone number', hospitals });
    }
    if (!req.body.password) {
        return res.render('forDoctors', { error: '*please enter password', hospitals });
    }
    const existUsername = await Doctors.findOne({ username: req.body.username });
    if (existUsername) {
        return res.render('forDoctors', { error: '*username is already in use', hospitals });
    }
    try {
        const doctorData = new Doctors({
            name: req.body.name,
            username: req.body.username,
            org: req.body.org,
            qualifications: req.body.qualifications,
            specialization: req.body.specialization,
            experience: req.body.experience,
            email: req.body.email,
            phone: req.body.phone,
            images: req.files && req.files['images'] ? req.files['images'].map(file => path.basename(file.path)) : [],
            documents: req.files && req.files['documents'] ? req.files['documents'].map(file => path.basename(file.path)) : [],
            message: req.body.message,
            password: req.body.password,
        });
        // console.log(doctorData);
        //create a token 
        const token = await doctorData.generateAuthToken();

        //save token in cookies
        res.cookie("jwt", token);

         await doctorData.save();

        // res.send("Doctor's data saved successfully.");
         res.redirect("/doctorDashboard");
    } catch (error) {
        // console.log(error);
        res.render("forDoctors", { hospitals });

    }

})
//when doctor already registered and click to login link then render the login page
app.get("/loginDoctor", (req, res) => {
    res.render("loginDoctor");
})
//now check doctor data is in mongodb or not if yes then send success response otherwise render registration page
app.post("/loginDoctor", async (req, res) => {
    try {
        const user = req.body.username;
        if (!user) {
            return res.render('loginDoctor', { error: '*please enter username' });
        }
        //  console.log(user);
        const pass = req.body.password;
        if (!pass) {
            return res.render('loginDoctor', { error: '*please enter password' });
        }
        //   console.log(pass);
        //  console.log(`${user} and password is ${pass}`);
        const userName = await Doctors.findOne({ username: user });

        if (!userName) {
            return res.render('loginDoctor', { error: '*Username not found. Please register before logging in.' });
        }

        // console.log(userName.username)
        // const loginDate = new Date();
        //  if (userName.password === pass) {
        //     res.status(200).render("regist");
        // }else{
        //     res.send("invalid details!")
        //  }



        //now we compare hash password with the already hashed password that is present in database
        // const isMatch = await bcrypt.compare(pass, userName.password)
        //match the token and login
        // const token = userName.generateAuthToken();
        // console.log(token);

        if (userName.password === pass) {
            const token = await userName.generateAuthToken();


            //save the token in cookies
            res.cookie("jwt", token);

            // res.status(200).send("successfully login");
            res.redirect("/doctorDashboard");
        } else {
            res.render('loginDoctor', { error: '*Invalid password!' });
        }
    } catch (err) {
        console.error("Error saving document:", err);
        res.status(400).send(err);
    }
})
app.get("/doctorDashboard", doctorAuth, async (req, res) => {
    try {
        const doctor = req.user;
        // console.log(doctor);
        const details = await Doctors.findById(doctor._id)
        // Use the doctor's _id to query the Appointment collection
        const appointment = await Appointment.find({ doctorName: doctor.name, doctorOrg: doctor.org, doctorPhone: doctor.phone });
        //  console.log(appointment);
        res.render("doctorDashboard", { details, appointment });
    } catch (err) {
        console.log(err);
    }

})
















// <----------------patient section (select hospital -> select doctors -> make an appointment)-------->


//when patient click to any "show doctors" button to any specific hospital
app.get("/doctorData/:hospitalName", async (req, res) => {

    try {
        const hospitalName = req.params.hospitalName;
        // console.log(hospitalName);

        const foundDoctors = await Doctors.find({ org: hospitalName });
        //  console.log(foundDoctors);
        // Convert the _id to a hexadecimal string
        foundDoctors.forEach(doctor => {
            doctor._id = doctor._id.toHexString();
        });
        // console.log(foundDoctors);
        res.render("doctorData", { doctors: foundDoctors });
    } catch (err) {
        console.log(err);
    }
})
//when patient click to "make an appointment" button then show the form with doctor object id
app.get("/appointment/:_id", async (req, res) => {

    try {
        const doctorID = req.params._id;
        //   console.log(doctorID);
        //  console.log(typeof(doctorID));
        const foundDoctors = await Doctors.findById(doctorID);
        //  console.log(foundDoctors);
        // console.log(foundDoctors.name);
        res.render("appointment", { doctorID });
        // res.render("doctorData", { doctors: foundDoctors });
    } catch (err) {
        console.log(err);
    }
})
//now submit the appointment form when patient fill the details and click to submit button
app.post("/appointment/:doctorID", async (req, res) => {

    try {
        const doctorID = req.params.doctorID;
        //  console.log(typeof(doctorID));
        //  console.log(doctorID);
        const foundDoctors = await Doctors.findById(doctorID);
        // console.log(foundDoctors);
        //  const {name,phone,date,meetType }= req.body;
        if (!req.body.name) {
            return res.render('appointment', { error: '* Please enter name', doctorID });
        }
        if (!req.body.phone) {
            return res.render('appointment', { error: '* Please enter phone number', doctorID });
        }
        if (!req.body.date) {
            return res.render('appointment', { error: '* Please enter date', doctorID });
        }
        if (!req.body.meetType) {
            return res.render('appointment', { error: '* Please select meet type', doctorID });
        }
        const appointmentdetails = new Appointment({
            name: req.body.name,
            phone: req.body.phone,
            date: req.body.date,
            meetType: req.body.meetType,
            doctorName: foundDoctors.name,
            doctorOrg: foundDoctors.org,
            doctorPhone: foundDoctors.phone,
        });


        //  console.log(appointmentdetails);
        await appointmentdetails.save();
        res.redirect("/registeredHospitals");
        // res.render("doctorData", { doctors: foundDoctors });
    } catch (err) {
        console.log(err);
    }
})
















// <---------------- lab section (fill registration -> add manually lab test packeges )-------->



//when laboratory or hospital first time registered in By laboratory page
app.get("/labForm", (req, res) => {
    res.render("forLabtest");
})
//handle the laboratory/hospital data and saved in mongodb
app.post("/labForm", async (req, res) => {
    try {
        const { type, hospitalInput, address, state, district, pincode, username, password } = req.body;
        if (req.body.type !== "hospital" || req.body.type !== "Laboratory") {
            return res.render('forLabtest', { error: '*please select hospital/laboratory' });
        }
        if (!req.body.username) {
            return res.render('forLabtest', { error: '*please enter username' });
        }
        if (!req.body.hospitalInput) {
            return res.render('forLabtest', { error: '*please enter hospital/laboratory name' });
        }
        if (!req.body.address) {
            return res.render('forLabtest', { error: '*please enter address' });
        }
        if (!req.body.district) {
            return res.render('forLabtest', { error: '*please enter district' });
        }
        if (!req.body.state) {
            return res.render('forLabtest', { error: '*please enter state' });
        }
        if (!req.body.pincode) {
            return res.render('forLabtest', { error: '*please enter pincode' });
        }
        if (req.body.pincode.length > 6) {
            return res.render('forLabtest', { error: '*please enter valid pincode' });
        }
        if (!req.body.password) {
            return res.render('forLabtest', { error: '*please enter password' });
        }
        const existUsername = await LabForm.findOne({ username: req.body.username });
        if (existUsername) {
            return res.render('forLabtest', { error: '*username is already in use' });
        }
        const labDetails = new LabForm({
            type,
            hospitalInput,
            username,
            address,
            state,
            district,
            pincode,
            password,
        })
        //create a token 
        const token = await labDetails.generateAuthToken();

        //save token in cookies
        res.cookie("jwt", token);
        // console.log(labDetails);
        await labDetails.save();
        // res.send("details added successfully..!");
        res.redirect("/labTest");
    } catch (err) {
        console.log(err);
    }

})
app.get("/loginLab", (req, res) => {
    res.render("loginLab");
})
app.post("/loginLab", async (req, res) => {
    try {
        const user = req.body.username;
        //  console.log(user);
        if (!user) {
            return res.render('loginLab', { error: '*please enter username' });
        }
        const pass = req.body.password;
        //   console.log(pass);
        if (!pass) {
            return res.render('loginLab', { error: '*please enter password' });
        }
        //  console.log(`${user} and password is ${pass}`);
        const userName = await LabForm.findOne({ username: user });

        if (!userName) {
            return res.render('loginLab', { error: '*Username not found. Please register before logging in.' });
        }

        // console.log(userName.username)

        if (userName.password === pass) {
            const token = await userName.generateAuthToken();


            //save the token in cookies
            res.cookie("jwt", token);

            // res.status(200).send("successfully login");
            res.redirect("/labTest");
        } else {
            res.render('loginLab', { error: '*Invalid password!' });
        }
    } catch (err) {
        console.error("Error saving document:", err);
        res.status(400).send(err);
    }
})

// for uploading lab test packages manually for laboratory / hospitals
app.get("/labTest", labAuth, async (req, res) => {
    try {
        const labuser = req.user;
        // console.log(labuser.hospitalInput);
        const cards = await Labdata.find({ name: labuser.hospitalInput });
        res.render("fillLabdetails", { cards, labuser });
    } catch (err) {
        console.log(err);
    }
})

// Handle the POST request
app.post('/fill_lab_test', labAuth, async (req, res) => {
    const labuser = req.user;
    // console.log(labuser.hospitalInput);
    const cards = await Labdata.find({ name: labuser.hospitalInput });
    try {
        const labTest = new Labdata(req.body);
        // console.log(labTest);
        const savedLabTest = await labTest.save();
        // console.log(savedLabTest);
        // res.json(savedLabTest); // Send a response if needed

        // Fetch all lab tests from MongoDB
        //  const allLabTests = await Labdata.find({});

        // Render the page with the updated data
        res.redirect('/labTest');
    } catch (error) {
        console.error(error);
        // res.status(500).send('Error saving data to MongoDB');
        res.render("fillLabdetails", { cards, labuser, error: "*server error" });
    }
});
//here laboratory/hospitals can see booked lab test
app.get("/labDashboard", labAuth, async (req, res) => {
    try {
        const labo = req.user;
        // console.log(labo);
        const labappointment = await BooktestForm.find({
            laboName: labo.hospitalInput
        });
        // console.log(labappointment);
        res.render("bookedLabTest", { labo, labappointment });
    } catch (err) {
        console.log(err);
    }
})
// app.post("/login", (req, res) => {
//     res.status(201).send("success..!")
// })
























// <------------ articles section (write articles ) and show that articles to everyone ------------>

app.get("/writeBlogs", doctorAuth, (req, res) => {
    // console.log(req.user);
    res.render("writeBlogs");
})
app.post("/writeBlogs", doctorAuth, upload.fields([{ name: 'blogimages', maxCount: 5 }, { name: 'blogvideos', maxCount: 2 }]), async (req, res) => {
    try {
        const doctor = req.user;
        if (!req.body.topic) {
            return res.render('writeBlogs', { error: '*please enter topic name' });
        }
        if (!req.body.subtopic) {
            return res.render('writeBlogs', { error: '*please enter sub topic name' });
        }
        if (!req.body.post) {
            return res.render('writeBlogs', { error: '*please write the post ' });
        }
        if (!req.files.blogimages) {
            return res.render('writeBlogs', { error: '*please attach image  ' });
        }
        if (!req.files.blogvideos) {
            return res.render('writeBlogs', { error: '*please attach video' });
        }

        const details = new Blog({
            topic: req.body.topic,
            subtopic: req.body.subtopic,
            post: req.body.post,
            blogimages: req.files && req.files['blogimages'] ? req.files['blogimages'].map(file => path.basename(file.path)) : [],
            blogvideos: req.files && req.files['blogvideos'] ? req.files['blogvideos'].map(file => path.basename(file.path)) : [],
            doctorName: doctor.name,
            doctorOrg: doctor.org,
            doctorPhone: doctor.phone,
        })
        //    console.log(details)
        await details.save();
        // res.send("blog submitted successfully..");
        res.redirect("/showBlogs");
    }
    catch (err) {
        console.log(err);
    }
})
//show all the blogs to everyone
app.get("/showBlogs", async (req, res) => {
    try {
        const blogs = await Blog.find({});

        res.render('showBlogs', { blogs });
    } catch (err) {
        console.log(err);
    }

})
//when click to read full articles then show the full content of that articles
app.get("/fullBlog/:blogId", async (req, res) => {
    try {
        const blogID = req.params.blogId;
        const blog = await Blog.findById(blogID);
        // console.log(blog);
        res.render("fullBlog", { blog });
    } catch (err) {
        console.log(err)
    }

})

















// <------------ book lab test section for patient (show active laboratory / hospital  --> see perticular laboratory test  --> book lab test )  ------------>




//when patient visit on book lab test page then show the active laboratory or hospital name
app.get("/registeredLab", async (req, res) => {
    try {
        const details = await LabForm.find({});
        // console.log(details);
        res.render("registeredLab", { details })
    } catch (err) {
        console.log(err);
    }
})
//when patient click to show lab packages button on any perticular laboratory or hospital row
app.get("/laboData/:laboName", async (req, res) => {

    try {
        const laboName = req.params.laboName;
        //  console.log(laboName);

        const foundLabPackage = await Labdata.find({ name: laboName });
        //  console.log(foundLabPackage);
        // Convert the _id to a hexadecimal string
        // foundLabPackage.forEach(doctor => {
        //     doctor._id = doctor._id.toHexString();
        // });
        // console.log(foundDoctors);
        res.render("showlabPackage", { packages: foundLabPackage });
    } catch (err) {
        console.log(err);
    }
})
//when patient click to any lab test packeges then open a form for booking
app.get("/bookTest/:testId", async (req, res) => {
    try {
        const testId = req.params.testId;
        //    console.log(testId);
        const book = await Labdata.find({ _id: testId });
        //    console.log(book);
        res.render("bookTestForm", { testId });
    } catch (err) {
        console.log(err);
    }
})
app.post("/bookTest/:testId", upload.fields([{ name: 'documents', maxCount: 5 }]), async (req, res) => {
    try {
        const testId = req.params.testId;
        //   console.log(testId);
        const labdetails = await Labdata.findById(testId);
        //   console.log(labdetails);
        if (!req.body.name) {
            return res.render('bookTestForm', {testId , error: '*please enter your name' });
        }
        if (!req.body.phone) {
            return res.render('bookTestForm', { testId , error: '*please enter phone number' });
        }
        if (!req.body.date) {
            return res.render('bookTestForm', { testId , error: '*please enter appointment date' });
        }
        if (!req.body.meetType) {
            return res.render('bookTestForm', { testId , error: '*please select meet type' });
        }
        if (!req.files.documents) {
            return res.render('bookTestForm', { testId ,error: '*please upload doctor prescription' });
        }
        const form = new BooktestForm({
            name: req.body.name,
            phone: req.body.phone,
            date: req.body.date,
            meetType: req.body.meetType,
            laboName: labdetails.name,
            labotestName: labdetails.labTestName,
            documents: req.files && req.files['documents'] ? req.files['documents'].map(file => path.basename(file.path)) : [],

        })

        console.log(form);
        await form.save();
        // res.send("success!");
        res.redirect("/registeredLab");
    } catch (err) {
        console.log(err);
    }
})


app.get("/insurance", (req, res) => {
    res.render("insurance");
})




app.listen(port, () => {
    console.log(`server is listening at ${port}`);
})