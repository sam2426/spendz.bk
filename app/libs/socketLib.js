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
            let id='UsersListSuccess'+userId;
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
                            let id='ReceiveRequest'+data.receiverId;
                            myIo.emit(id,'Friend Request Received');
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
            let id='FriendListSuccess'+userId;
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
                    socket.emit(id, apiResponse);
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
                        socket.emit(id, apiResponse);
                    }else{
                        let apiResponse = response.generate(true, 'Error Occured', 400, null);
                        socket.emit(id, apiResponse);
                    }
                    
                })
        })

        socket.on('deleteFriendRequest',(data)=>{
            
            let deleteFromReceiver = () => {
                return new Promise((resolve, reject) => {
                    deleteId(data.senderId, data.receiverId, (err, reresponse) => {
                        if (err) {
                            reject('Request not processed', err, 'friendController:dbDeleteRecord', 10);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        
            let deleteFromSender = () => {
                return new Promise((resolve, reject) => {
                    deleteId(data.receiverId, data.senderId, (err, reresponse) => {
                        if (err) {
                            reject('Request not processed', err, 'friendController:dbDeleteRecord', 10);
                        } else {
                            let id='DeleteRequest'+data.receiverId;
                            myIo.emit(id,'Friend delete Request Processed');
                            resolve();
                        }
                    });
                });
            }
        
            let deleteId = (id1, id2, cb) => {
                FriendsModel.findOne({ userId: id1 }, (err, userDetails) => {
                    if (err) {
                        return cb('Request not processed', null);
                    }
                    else {
                        userDetails.allFriends = remove(userDetails.allFriends, 'friendId', id2);
                        userDetails.save((err, updateResponse) => {
                            if (err) {
                                return cb(err, null);
                            } else {
                                return cb(null, updateResponse);
                            }
                        });
                    }
                });
            }
        
            let remove = (array, key, value) => {
                const index = array.findIndex(obj => obj[key] === value);
                //ternary operator returns sliced array with key value removed, else if not found returns whole array as 
                //at that time the index will be -1
                return index >= 0 ? [
                    ...array.slice(0, index),
                    ...array.slice(index + 1)
                ] : array;
            }
        
            deleteFromReceiver(data)
                .then(deleteFromSender)
                .then(() => {
                    // let apiResponse = response.generate(false, 'Request Deleted', 200, null);
                    // res.send(apiResponse)
                    let id='DeleteRequest'+data.senderId;
                    myIo.emit(id,'Friend delete Request Processed');
                    console.log("friend delete request processed");
                })
                .catch((err, msg, origin, imp) => {
                    // logger.error(msg, origin, imp);
                    // let apiResponse = response.generate(true, err, 400, null);
                    // res.send(apiResponse);
                    console.log("friend delete request error");
                })
        })

        socket.on('acceptFriendRequest',(data)=>{
            let acceptAtReceiver = (data) => {
                return new Promise((resolve, reject) => {
                    updateAcceptRequest(data.senderId, data.receiverId, (err, reresponse) => {
                        if (err) {
                            reject('Failed to process request', err, 'friendController:acceptRequest', 10);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        
            let acceptAtSender = () => {
                return new Promise((resolve, reject) => {
                    updateAcceptRequest(data.receiverId, data.senderId, (err, reresponse) => {
                        if (err) {
                            reject('Failed to process Request', err, 'friendController:acceptRequest', 10);
                        } else {
                            let id='AcceptRequest'+data.receiverId;
                            myIo.emit(id,'Friend delete Request Processed');
                            resolve();
                        }
                    });
                });
            }
        
            let updateAcceptRequest = (id1, id2, cb) => {
                FriendsModel.findOne({ userId: id1 }, (err, userDetails) => {
                    if (err) {
                        return cb('Failed To process request', null);
                    }
                    else if (check.isEmpty(userDetails)) {
                        return cb('Failed To process request', null);
                    }
                    else {
                        const index = userDetails.allFriends.findIndex(obj => obj['friendId'] === id2);
                        if (index >= 0) {
                            userDetails.allFriends[index].friendSince = time.now();
                            userDetails.save((err, updateResponse) => {
                                if (err) {
                                    return cb(err, null);
                                } else {
                                    return cb(null, updateResponse);
                                }
                            })
                        } else {
                            return cb('Unable to Process Request', null);
                        }
                    }
                });
            }
        
            acceptAtReceiver(data)
                .then(acceptAtSender)
                .then(() => {
                    // let apiResponse = response.generate(false, 'Request Processed', 200, null);
                    // res.send(apiResponse);
                    let id='AcceptRequest'+data.senderId;
                    myIo.emit(id,'Friend accept Request Processed');
                    console.log("friend accept request processed");
                })
                .catch((err, msg, origin, imp) => {
                    logger.error(msg, origin, imp);
                    // let apiResponse = response.generate(true, err, 400, null);
                    // res.send(apiResponse);
                    console.log("friend accept request error");
                });
        })

    });

}

module.exports = {
    setServer: setServer
}