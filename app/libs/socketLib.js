const socketio = require('socket.io');
const mongoose = require('mongoose');
const shortid = require('shortid');
const logger = require('./loggerLib.js');
const events = require('events');
const eventEmitter = new events.EventEmitter();

const UserModel = require('./../models/User');
const FriendsModel = require('./../models/FriendList');
const friendsController = require('./../controllers/friendsController');

const tokenLib = require("./tokenLib.js");
const check = require("./checkLib.js");
const response = require('./responseLib')

let setServer = (server) => {

    // let allOnlineUsers = []

    let io = socketio.listen(server);

    let myIo = io.of('');

    myIo.on('connection', (socket) => {

        console.log("on connection--functions are ready");

        // socket.emit("verifyUser", "");

        socket.on('getUsers', (userId) => {
            eventEmitter.emit('findUsersEvent',userId);
        })

        //eventEmitter to get the users who are not friends
        eventEmitter.on('findUsersEvent',(userId)=>{
            let friends = (userId) => {
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
                    socket.emit("UsersListSuccess", apiResponse);
                })
                .catch((err, msg, origin, imp) => {
                    logger.error(msg, origin, imp);
                    console.log("request failed");
                    if(err=='No User Found'){
                        console.log('No users are there');
                        let result={};
                        let apiResponse = response.generate(false, 'No More Records', 300, result)
                        socket.emit("UsersListSuccess", apiResponse);
                    }else{
                        let apiResponse = response.generate(true, 'Error Occured', 400, null);
                        socket.emit("UsersListSuccess", apiResponse);
                    }
                })
        })

        //friend request from user starts
        socket.on('sendFriendRequest',(data)=>{

            let updateSenderRecords = () => {
                return new Promise((resolve, reject) => {
                    updateRecord(data.senderId, data.receiverId, 'send', (err, reresponse) => {
                        if (err) {
                            reject('Request Failed', err, 'friendController:addRecord', 10);
                        } else {
                            resolve();
                        }
                    })
                })
            }
        
            let updateReceiverRecords = () => {
                return new Promise((resolve, reject) => {
                    updateRecord(data.receiverId, data.senderId, 'received', (err, reresponse) => {
                        if (err) {
                            reject('Request Failed', err, 'friendController:addRecord', 10);
                        } else {
                            myIo.emit(data.receiverId,'Friend Request Received');
                            resolve();
                        }
                    })
                })
            }
        
            let updateRecord = (id1, id2, request, cb) => {
                FriendsModel.findOne({ userId: id1 }, (err, userDetails) => {
                    if (err) {
                        return cb(err, null);
                    }
                    else if (check.isEmpty(userDetails)) {
                        return cb('Id invalid', null);
                    }
                    else {
                        let obj = userDetails.allFriends.find(obj => obj.friendId == id2);
                        if (check.isEmpty(obj)) {
                            UserModel.findOne({ 'userId': id2 })
                                .select('_id')
                                .lean()
                                .exec((err, receiverObjectId) => {
                                    if (err) {
                                        return cb('Failed To Find Details', null);
                                    } else {
                                        let requestSent = false;
                                        let requestReceived = false;
                                        (request == 'send') ? (requestSent = true) : (requestReceived = true)
                                        let finalObject = {
                                            friendObject: receiverObjectId,
                                            friendId: id2,
                                            requestSent: requestSent,
                                            requestReceived: requestReceived,
                                        }
                                        userDetails.allFriends.push(finalObject);
                                        userDetails.save((err, newRecord) => {
                                            if (err) {
                                                cb(err, null);
                                            } else {
                                                return cb(null, 'Request Sent');
                                            }
                                        });
                                    }
                                });
                        }
                        else {
                            return cb('Request already sent', null);
                        }
                    }
                })
            }
        
            updateSenderRecords(data)
                .then(updateReceiverRecords)
                .then(() => {
                    // let apiResponse = response.generate(false, 'Request Sent', 200, null);
                    // res.send(apiResponse);
                    // eventEmitter.emit('findUsers',userId);
                    console.log("friend request processed")
                })
                .catch((err, msg, origin, imp) => {
                    // logger.error(msg, origin, imp);
                    // let apiResponse = response.generate(true, err, 400, null);
                    // res.send(apiResponse);
                    console.log("friend request error");
                });
        
        })

        socket.on('getFriends', (userId) => {
            console.log('getFriends running');
            let friends = (userId) => {
                return new Promise((resolve, reject) => {
                    friendsController.usersFriend(userId, (err, response) => {
                        if (err) {
                            console.log("here it is " + err);
                            reject('friends not found', err, 'friendsControllerSocket:getFriends', 10);
                        }
                        else {
                            // console.log("pass 1");
                            resolve(response);
                        }
                    })
                })
            }
            let findFriends = (arr) => {
                return new Promise((resolve, reject) => {
                    // let include='$in'
                    UserModel.find({ 'userId': { $in: arr } })
                        .select(' -__v -_id -password -otp -otpExpiry')
                        .populate('friendList')
                        .lean()
                        .exec((err, result) => {
                            if (err) {
                                reject('Failed To Find User Details', err, 'User Controller: getAllUser', 10);
                            } else if (check.isEmpty(result)) {
                                reject('No User Found', 'No User Found', 'User Controller: getAllUser', 10)
                            } else {
                                resolve(result);
                            }
                        })
                })
            }

            friends(userId)
                .then(findFriends)
                .then((result) => {
                    let apiResponse = response.generate(false, 'All Friends Details Found', 200, result)
                    // res.send(apiResponse);
                    console.log('friendListSuccess gtyuij');
                    socket.emit("FriendListSuccess", apiResponse);
                })
                .catch((err, msg, origin, imp) => {
                    logger.error(msg, origin, imp);
                    console.log("request failed");
                    // if(err=='No User Found'){
                    //     let apiResponse = response.generate(true, err, 300, null);
                    //     socket.emit("UsersListSuccess", apiResponse);
                    // }else{
                    //     socket.emit("failureResponse", apiResponse);
                    // }
                    if(err=='No User Found'){
                        console.log('No users are there');
                        let result={};
                        let apiResponse = response.generate(false, 'No More Records', 300, result);
                        socket.emit("FriendListSuccess", apiResponse);
                    }else{
                        let apiResponse = response.generate(true, 'Error Occured', 400, null);
                        socket.emit("FriendListSuccess", apiResponse);
                    }
                    
                })
        })

        

    });

}

module.exports = {
    setServer: setServer
}