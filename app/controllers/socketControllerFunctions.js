const UserModel = require('./../models/User');
const AuthModel = require('./../models/auth');
const friendsController = require('./../controllers/friendsController')

let getOtherUsers=(userId)=>{

    let friends= (userId) => {
        return new Promise((resolve, reject) => {
            friendsController.usersFriend(userId, (err, response) => {
                if (err) {
                    reject('friends not found', err.message, 'friendControllerSocket:getUsers', 10);
                }
                else {
                    let arr = response.concat(userId);
                    resolve(arr);
                }
            })
        })
    }

    let findUsers = (arr) => {
        return new Promise((resolve, reject) => {
            UserModel.find({ 'userId': { $nin: arr } })
                .select(' -__v -_id -password -otp -otpExpiry')
                .populate('friendList')
                .lean()
                .exec((err, result) => {
                    if (err) {
                        reject('Failed To Find User Details', err, 'User Controller: getAllUser', 10);
                    } else if (check.isEmpty(result)) {
                        reject('No User Found', 'No User Found', 'User Controller: getAllUser', 10)
                        // let result={};
                        // resolve(result);
                    } else {
                        resolve(result);
                    }
                })
        })
    }
    friends(userId)
                .then(findUsers)
                .then((result) => {
                    let apiResponse = response.generate(false, 'All User Details Found', 200, result)
                    // console.log(apiResponse);
                    socket.emit(id, apiResponse);
                })
                .catch((err, msg, origin, imp) => {
                    logger.error(msg, origin, imp);
                    console.log("request failed");
                    if(err=='No User Found'){
                        console.log('No users are there');
                        let result={};
                        let apiResponse = response.generate(false, 'No More Records', 300, result)
                        socket.emit(id, apiResponse);
                    }else{
                        let apiResponse = response.generate(true, 'Error Occured', 400, null);
                        socket.emit(id, apiResponse);
                    }
                })
}

module.exports={
    getOtherUsers:getOtherUsers,
}