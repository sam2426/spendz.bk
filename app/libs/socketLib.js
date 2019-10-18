const socketio = require('socket.io');
const mongoose = require('mongoose');
const shortid = require('shortid');
const logger = require('./loggerLib.js');
const events = require('events');
const eventEmitter = new events.EventEmitter();

const UserModel = require('./../models/User');
const friendsController = require('./../controllers/friendsController');

const tokenLib = require("./tokenLib.js");
const check = require("./checkLib.js");
const response = require('./responseLib')

let setServer = (server) => {

    // let allOnlineUsers = []

    let io = socketio.listen(server);

    let myIo = io.of('');

    myIo.on('connection',(socket) => {

        console.log("on connection--functions are ready");

        // socket.emit("verifyUser", "");

        socket.on('getFriends',(userId)=>{
            console.log('getFriends running');
            let friends=(userId)=>{
                return new Promise((resolve,reject)=>{
                    friendsController.usersFriend(userId,(err,response)=>{
                        if(err){
                            console.log("here it is "+err);
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
                    // let include='$in'
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
        
            friends(userId)
            .then(findFriends)
            .then((result)=>{
                let apiResponse = response.generate(false, 'All Friends Details Found', 200, result)
                // res.send(apiResponse);
                socket.emit("FriendListSuccess",apiResponse);
            })
            .catch((err, msg, origin, imp) => {
                logger.error(msg, origin, imp);
                let apiResponse = response.generate(true, err, 400, null);
                // res.send(apiResponse);
                socket.emit("FriendListFailure",apiResponse);
            })
        })

        socket.on('getUsers',(userId)=>{
            let friends=(userId)=>{
                return new Promise((resolve,reject)=>{
                    friendsController.usersFriend(userId,(err,response)=>{
                        if(err){
                            reject('friends not found',err.message, 'userController:getUserDetails', 10);
                        }
                        else{
                            let arr=response.concat(userId);
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
        
            friends(userId)
            .then(findUsers)
            .then((result)=>{
                let apiResponse = response.generate(false, 'All User Details Found', 200, result)
                console.log(apiResponse);
                socket.emit("UsersListSuccess",apiResponse);
            })
            .catch((err, msg, origin, imp) => {
                logger.error(msg, origin, imp);
                let apiResponse = response.generate(true, err, 400, null);
                socket.emit("UsersListFailure",apiResponse);
            })
        })

    });

}

module.exports = {
    setServer: setServer
}