const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
require('dotenv').config();
 
aws.config.update({
    secretAccessKey:process.env.SECRET_KEY,
    accessKeyId:process.env.ACCESS_KEY_ID,
    region:'ap-south-1'
});


const s3 = new aws.S3({  });
 
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'app-profile-pics',
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
});


module.exports={
    upload:upload
}