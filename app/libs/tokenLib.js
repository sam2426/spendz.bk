const jwt = require('jsonwebtoken');
const shortid=require('shortid');
const secretKey='thisIsAnRandomSecretKey';
const time=require('./../libs/timeLib');

let generateToken=(data,cb)=>{
    try{
        let claims={
            jwtid:shortid.generate(),
            iat:Date.now(),
            exp:Math.floor(time.now() / 1000)+(60*60*24),
            sub:'authToken', //subject
            iss:'edChat', // issuer
            data:data
        }
        let tokenDetails={
            token:jwt.sign(claims,secretKey),
            tokenSecret:secretKey
        }
        cb(null,tokenDetails)
    } catch(err){
        console.log(err);
        cb(err,null);
    }
}


let verifyClaim=(token,secretKey,cb)=>{
    //verify a token symmetric
    jwt.verify(token,secretKey,function(err,decoded){
        if(err){
            console.log("error while verifing token");
            console.log(err);
            cb(err,null);
        }else{
            console.log("user verified");
            console.log(decoded);
            cb(null,decoded);
        }
    });
}

let verifyClaimWithoutSecret = (token,cb) => {
    // verify a token symmetric
    jwt.verify(token, secretKey, function (err, decoded) {
      if(err){
        console.log("error while verify token");
        console.log(err);
        cb(err,null);
      }
      else{
        console.log("user verified");
        cb (null,decoded)
      }  
   
   
    });
  
  
  }// end verify claim 

module.exports={
    generateToken:generateToken,
    verifyClaim:verifyClaim,
    verifyClaimWithoutSecret:verifyClaimWithoutSecret
}