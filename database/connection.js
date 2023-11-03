const mongoose = require("mongoose");
require('dotenv').config();

mongoose.connect(process.env.MYDB,{
    useNewUrlParser: true,
    
        useUnifiedTopology: true,
}).then(()=>{
    console.log("connection with mongoose..");
}).catch((err)=>{
    console.log(err);
})