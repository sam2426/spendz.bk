const UserModel = require('./../models/User');
const AuthModel = require('./../models/auth');

const shortid = require('shortid');

const friendsController = require('./friendsController');

const check = require('../libs/checkLib');
const logger = require('./../libs/loggerLib');
const mailerLib = require('./../libs/mailerLib');
const passwordLib = require('./../libs/generatePasswordLib');
const profilePicUploadLib = require('./../libs/profilePicUploadLib');
const response = require('./../libs/responseLib');
const time = require('./../libs/timeLib');
const token = require('./../libs/tokenLib');
const validateInput = require('./../libs/paramsValidationLib');


let signUpFunction = (req, res) => {
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                if (!validateInput.Email(req.body.email)) {
                    reject("Email didn't meet the requirement", null, null, null);
                } else if (check.isEmpty(req.body.password)) {
                    reject('Please Enter Proper Password', null, null, null);
                } else if (!validateInput.Password(req.body.password)) {
                    reject('Password parameters are not met', null, null, null);
                } else {
                    resolve(req);
                }
            } else {
                reject('One or more parameter is missing', 'Input field missing in user creation', 'userController:validateUser', 10);
            }
        })
    } // end user validate function

    let createUser = () => {
        return new Promise((resolve, reject) => {
            UserModel.findOne({ email: req.body.email })
                .exec((err, retrievedUserdetails) => {
                    if (err) {
                        reject('failed to create user', err.message, 'userController:createUser', 10);
                    } else if (check.isEmpty(retrievedUserdetails)) {
                        console.log(req.body);
                        let newUser = new UserModel({
                            userId: 'U-' + shortid.generate(),
                            firstName: req.body.firstName,
                            lastName: req.body.lastName || '',
                            gender: req.body.gender,
                            email: req.body.email.toLowerCase(),
                            password: passwordLib.hashpassword(req.body.password),
                            mobileNumber: req.body.mobileNumber,
                            createdOn: time.now().format(),
                            profilePic: req.body.profilePic,
                        })
                        newUser.save((err, newUser) => {
                            if (err) {
                                reject('Account not Created', err.message, 'userController:dbSaveUser', 20);
                            } else {
                                let newUserObj = newUser.toObject();
                                resolve(newUserObj);
                            }
                        })
                    }
                    else {
                        reject('User record exists', 'User Cannot be created as user already present', 'userController:Createuser', 15);
                    }
                })
        })
    }//createUser function ends

    let insertIntoFriendList = (userObj) => {
        return new Promise((resolve, reject) => {
            friendsController.createRecords(userObj, (err, isCreated) => {
                if (err) {
                    reject('Failed to create friendList', err.message, 'insertIntoFriendList:dbCreateList', 10);
                } else {
                    UserModel.findByIdAndUpdate(userObj._id, { friendList: isCreated._id }, { new: true })
                        // an option that asks mongoose to return the updated version 
                        // of the document instead of the pre-updated one.
                        // {new: true}
                        .exec((err, retrieveddetails) => {
                            if (err) {
                                reject('failed to insert FriendListId', err.message, 'userController:insertListID', 10);
                            }
                            else {
                                let output = retrieveddetails.toObject();
                                resolve(output)
                            }
                        })
                    //here have to use isCreated object as a transport to pass the inherited object.
                    // isCreated.userObj=userObj; 
                    // resolve(isCreated);
                }
            })
        })
    }

    validateUserInput(req, res)
        .then(createUser)
        .then(insertIntoFriendList)
        .then((resolve) => {
            delete resolve.password;
            delete resolve._id;
            delete resolve.__v;
            delete resolve.friendList;
            delete resolve.otp;
            delete resolve.otpExpiry;
            logger.info('User Signed Up', 'UserController:SignUp', 00)
            let apiResponse = response.generate(false, 'user created', 200, resolve);
            res.send(apiResponse)
        })
        .catch((err, msg, origin, imp) => {
            logger.error(msg, origin, imp);
            let apiResponse = response.generate(true, err, 400, null);
            res.send(apiResponse);
        })
} // end of user signUp

// start of login function 
let loginFunction = (req, res) => {
    let findUser = () => {
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                // console.log("email is there in the body");
                // console.log(req.body);
                UserModel.findOne({ email: req.body.email }, (err, userDetails) => {
                    if (err) {
                        reject('Failed To Find User Details', 'Failed To Retrieve User Data', 'userController: findUser()', 10)
                    } else if (check.isEmpty(userDetails)) {
                        reject("User doesn't exist, Please SignUp", 'No User Found', 'userController: findUser()', 70);
                    } else {
                        logger.info('User Found', 'userController: findUser()', 00)
                        resolve(userDetails)
                    }
                });

            } else {
                reject("Please Enter Email", 'Email not entered by User', 'userController: findUser()', 70);
            }
        })
    }
    let validatePassword = (retrievedUserDetails) => {
        return new Promise((resolve, reject) => {
            passwordLib.comparePassword(req.body.password, retrievedUserDetails.password, (err, isMatch) => {
                if (err) {
                    reject('Login Failed', err.message, 'userController: validatePassword()', 75);
                } else if (isMatch) {
                    let retrievedUserDetailsObj = retrievedUserDetails.toObject();
                    delete retrievedUserDetailsObj.password;
                    
                    logger.info('Password validated', 'Password Hash Check', 00);
                    resolve(retrievedUserDetailsObj);
                } else {
                    reject('Wrong Password.Login Failed', 'Login Failed Due To Invalid Password', 'userController: validatePassword()', 70)
                }
            })
        })
    }

    let generateToken = (userDetails) => {
        return new Promise((resolve, reject) => {
            token.generateToken(userDetails, (err, tokenDetails) => {
                if (err) {
                    reject('Failed To Generate Token', 'Token not generated', 'userController:generateToken()', 75);
                } else {
                    tokenDetails.userId = userDetails.userId;
                    tokenDetails.userDetails = userDetails;
                    resolve(tokenDetails);
                }
            })
        })
    }

    let saveToken = (tokenDetails) => {
        return new Promise((resolve, reject) => {
            AuthModel.findOne({ userId: tokenDetails.userId }, (err, retrievedTokenDetails) => {
                if (err) {
                    reject('failed to generate token', err.message, 'userController:findToken', 10);
                } else if (check.isEmpty(retrievedTokenDetails)) {
                    let newAuthToken = new AuthModel({
                        userId: tokenDetails.userId,
                        authToken: tokenDetails.token,
                        tokenSecret: tokenDetails.tokenSecret,
                        tokenGenerationTime: time.now().format(),
                    })
                    newAuthToken.save((err, newTokenDetails) => {
                        if (err) {
                            reject('failed to generate token', err.message, 'userController:saveToken', 10);
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody);
                        }
                    })
                } else {
                    retrievedTokenDetails.authToken = tokenDetails.token;
                    retrievedTokenDetails.tokenSecret = tokenDetails.tokenSecret;
                    retrievedTokenDetails.tokenGenerationTime = time.now().format();
                    retrievedTokenDetails.save((err, newTokenDetails) => {
                        if (err) {
                            reject('failed to generate token', err.message, 'userController:saveToken', 10);
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody);
                        }
                    })
                }
            })
        })
    }

    findUser(req, res)
        .then(validatePassword)
        .then(generateToken)
        .then(saveToken)
        .then((resolve) => {
            delete resolve.userDetails._id;
            delete resolve.userDetails.__v;
            delete resolve.userDetails.createdOn;
            delete resolve.userDetails.modifiedOn;
            delete resolve.userDetails.friendList;
            delete resolve.userDetails.otp;
            delete resolve.userDetails.otpExpiry;
            delete resolve.userDetails.groups;

            let apiResponse = response.generate(false, 'Login Successful', 200, resolve);
            res.send(apiResponse)
        })
        .catch((err, msg, origin, imp) => {
            logger.error(msg, origin, imp);
            let apiResponse = response.generate(true, err, 400, null);
            res.send(apiResponse);
        })
}

const singleUpload = profilePicUploadLib.upload.single('image');
let uploadImage = (req, res) => {
    singleUpload(req, res, (err) => {
        if (err) {
            let apiResponse = response.generate(true, 'File Not Uploaded', 400, null);
            res.send(apiResponse);
        } else {
            let apiResponse = response.generate(false, 'File Uploaded', 200, req.file.location);
            res.send(apiResponse);
        }
    })
}

//revise once the concept of edit/update user
let editUser = (req, res) => {
    let options = req.body;
    UserModel.update({ 'userId': req.params.userId }, options).exec((err, result) => {
        if (err) {
            logger.error(err.message, 'User Controller:editUser', 10);
            let apiResponse = response.generate(true, 'Failed To edit user details', 500, null);
            res.send(apiResponse);
        } else if (check.isEmpty(result)) {
            logger.info('No User Found', 'User Controller: editUser',70);
            let apiResponse = response.generate(true, 'No User Found', 404, null);
            res.send(apiResponse);
        } else {
            let apiResponse = response.generate(false, 'User details edited', 200, result);
            res.send(apiResponse);
        }
    });// end user model update
}

//forget password functionality
let forgetPassword = (req, res) => {

    let validateUser = (req, res) => {
        return new Promise((resolve, reject) => {
            UserModel.findOne({ 'email': req.body.email }).exec((err, result) => {
                if (err) {
                    reject('Failed to find User', err.message, 'UserController:EmailNotFound()', 10);
                } else if (check.isEmpty(result)) {
                    reject('No User Found', 'No user Found', 'UserController:email search empty', 70);
                } else {
                    let output = {
                        result: result,
                        req: req
                    }
                    resolve(output);
                }
            })
        })
    }

    let setOtp = (input) => {
        return new Promise((resolve, reject) => {
            const randomNumber = Math.floor(Math.random() * 899999 + 100000); //generate a 6 digit random number
            console.log(time.now().format()); //this is how to get current time.
            let updateBody = {
                otp: randomNumber,
                otpExpiry: time.now().add(10, 'm').format(), // adding 10 minutes to the current time, marking otp expiry
            }
            //DeprecationWarning: collection.update is deprecated. Use updateOne, updateMany, or bulkWrite instead.
            UserModel.updateOne({ 'email': input.req.body.email }, updateBody).exec((err, results) => {
                if (err) {
                    reject('Failed to update otp', err.message, 'userController:dbSaveUser', 10);
                } else {
                    let output = {
                        randomNumber: randomNumber,
                        result: input.result
                    }
                    resolve(output);
                }
            })
        })
    }

    let mailer = (input) => {
        return new Promise((resolve, reject) => {
            mailerLib.mail(input.result.email, input.result.firstName, input.randomNumber, (err, mailResponse) => {
                if (err) {
                    reject('Failed to send mail', err.message, 'UserController:mailsend', 10);
                } else {
                    resolve(mailResponse);
                }
            })
        })
    }

    validateUser(req, res)
        .then(setOtp)
        .then(mailer)
        .then((mailResponse) => {
            let apiResponse = response.generate(false, 'OTP sent to email', 200, mailResponse);
            res.send(apiResponse)
        })
        .catch((err, msg, origin, imp) => {
            logger.error(msg, origin, imp);
            let apiResponse = response.generate(true, err, 400, null);
            res.send(apiResponse);
        })
}

let resetPassword = (req, res) => {

    let validateUser = (req, res) => {
        return new Promise((resolve, reject) => {
            let condition = { email: req.body.email, otp: req.body.otp, otpExpiry: { $gt: time.now().format() } }
            UserModel.findOne(condition, (err, result) => {
                if (err) {
                    reject('OTP Discarded', err.message, 'userController:validateOTP', 10);
                } else if (check.isEmpty(result)) {
                    reject('OTP Discarded', err.message, 'userController:validateOTP', 10);
                } else {
                    resolve(req)
                }
            })
        })
    }//end of validateUser

    let updatePassword = (req) => {
        return new Promise((resolve, reject) => {
            let condition = { 'email': req.body.email };
            let pass = {
                password: passwordLib.hashpassword(req.body.password),
                otp: 0
            }
            UserModel.updateOne(condition, pass).exec((err, result) => {
                if (err) {
                    reject('Password Not Updated', err.message, 'userController:updatePassword', 10);
                } else {
                    resolve(result)
                }
            })
        })
    }

    validateUser(req, res)
        .then(updatePassword)
        .then((result) => {
            let apiResponse = response.generate(false, 'Password Updated', 200, result);
            res.send(apiResponse);
        })
        .catch((err, msg, origin, imp) => {
            logger.error(msg, origin, imp);
            let apiResponse = response.generate(true, err, 400, null);
            res.send(apiResponse);
        })
}

/* Get all user Details except friends*/
let getAllUser = (req, res) => {
    let friends=()=>{
        return new Promise((resolve,reject)=>{
            friendsController.usersFriend(req.params.userId,(err,response)=>{
                if(err){
                    reject('friends not found',err.message, 'userController:getUserDetails', 10);
                }
                else{
                    let arr=response.concat(req.params.userId);
                    resolve(arr);
                }
            })
        })
    }
    let findUsers=(arr)=>{
        return new Promise((resolve,reject)=>{
        UserModel.find({'userId':{$nin:arr}})
        .select(' -__v -_id -password -otp -otpExpiry')
        .populate('friendList')
        .lean()
        .exec((err, result) => {
            if (err) {
                reject('Failed To Find User Details',err.message, 'User Controller: getAllUser', 10);
            } else if (check.isEmpty(result)) {
                reject('No User Found','No User Found', 'User Controller: getAllUser', 10)
            } else {
                resolve(result)
            }
        })
        })
    }

    friends(req,res)
    .then(findUsers)
    .then((result)=>{
        let apiResponse = response.generate(false, 'All User Details Found', 200, result)
        res.send(apiResponse);
    })
    .catch((err, msg, origin, imp) => {
        logger.error(msg, origin, imp);
        let apiResponse = response.generate(true, err, 400, null);
        res.send(apiResponse);
    })
}// end get all users

/* Get all Friend Details */
let getAllFriends= (req, res) => {
   
    let friends=()=>{
        return new Promise((resolve,reject)=>{
            friendsController.usersFriend(req.params.userId,(err,response)=>{
                if(err){
                    reject('friends not found',err.message, 'userController:getUserDetails', 10);
                }
                else{
                    resolve(response);
                }
            })
        })
    }
    let findFriends=(arr)=>{
        return new Promise((resolve,reject)=>{
            let include='$in'
        UserModel.find({'userId':{$in:arr}})
        .select(' -__v -_id -password -otp -otpExpiry')
        .populate('friendList')
        .lean()
        .exec((err, result) => {
            if (err) {
                reject('Failed To Find User Details',err.message, 'User Controller: getAllUser', 10);
            } else if (check.isEmpty(result)) {
                reject('No User Found','No User Found', 'User Controller: getAllUser', 10)
            } else {
                resolve(result);
            }
        })
        })
    }

    friends(req,res)
    .then(findFriends)
    .then((result)=>{
        let apiResponse = response.generate(false, 'All Friends Details Found', 200, result)
        res.send(apiResponse);
    })
    .catch((err, msg, origin, imp) => {
        logger.error(msg, origin, imp);
        let apiResponse = response.generate(true, err, 400, null);
        res.send(apiResponse);
    })
}// end get all users

/* Get single user details use it for profile view */
let getSingleUser = (req, res) => {
    console.log(req.params.userId);
    UserModel.findOne({ 'userId': req.params.userId })
        .select('-password -__v -_id -otp -otpExpiry')
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'User Controller: getSingleUser', 10)
                let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No User Found', 'User Controller:getSingleUser')
                let apiResponse = response.generate(true, 'No User Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'User Details Found', 200, result)
                res.send(apiResponse)
            }
        })
}// end get single user
/* Logout function */
let logout = (req, res) => {
    AuthModel.findOneAndRemove({ userId: req.user.userId }, (err, result) => {
        if (err) {
            logger.error(err.message, 'user Controller: logout', 10);
            let apiResponse = response.generate(true, `Unexpected Error Occurred`, 500, null);
            res.send(apiResponse);
        } else if (check.isEmpty(result)) {
            let apiResponse = response.generate(true, 'Already Logged Out or Invalid UserId', 404, null);
            res.send(apiResponse);
        } else {
            let apiResponse = response.generate(false, 'Logged Out Successfully', 200, null);
            res.send(apiResponse);
        }
    })
} // end of the logout function.

module.exports = {
    signUpFunction: signUpFunction,
    loginFunction: loginFunction,
    uploadImage: uploadImage,
    editUser: editUser,
    forgetPassword: forgetPassword,
    resetPassword: resetPassword,
    getAllUser: getAllUser,
    getAllFriends:getAllFriends,
    getSingleUser: getSingleUser,
    logout: logout,
}
