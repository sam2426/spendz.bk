require('dotenv').config();

const nodemailer=require('nodemailer');

let mail=(mailId,name,passcode,cb)=>{
    let transporter=nodemailer.createTransport({
        //host: "smtp.gmail.com", this also works.
        service:'Gmail',
        auth:{
            user:process.env.EMAIL,
            pass:process.env.PASSWORD
        }
    });

    let mailOptions={
        from:'appmaker5689@gmail.com',
        to:mailId,
        subject:'OTP for resetting Password at ToDoApp',
        text:`Hello Dear ${name},\nPlease enter the OTP in the website to reset your password : ${passcode}`
    };

    transporter.sendMail(mailOptions,(err, data)=>{
        if(err){
            cb(err,null);
        }else{
            cb(null,data);
        }
    });

}

module.exports={
    mail:mail
}



