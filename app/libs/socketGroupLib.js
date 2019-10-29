const socketio=require('socket.io');
const time = require('./../libs/timeLib');
const logger = require('./loggerLib.js');
const check = require("./checkLib.js");
const response = require('./responseLib');
const events = require('events');
const eventEmitter = new events.EventEmitter();

const UserModel = require('./../models/User');
const FriendsModel = require('./../models/FriendList');
const friendsController = require('./../controllers/friendsController');

let setServer