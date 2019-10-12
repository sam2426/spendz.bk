const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const time= require('./../libs/timeLib');

const friendListSchema=new Schema({
    friendObject:{
        type:Schema.Types.ObjectId,
        ref:'User',
    },
    friendId:{
        type:String,
        default:'',
    },
    requestSent:{
        type:Boolean,
        default:false,
    },
    requestReceived:{
        type:Boolean,
        default:false,
    },
    friendSince:{
        type:time,
        default:'',
    }
})

const friendsSchema=new Schema({
    userObject:{
        type:Schema.Types.ObjectId,
        ref:'User',
        unique:true,
    },
    userId:{
        type:String,
        default:'',
        unique:true,
    },
    friendCount:{
        type:Number,
        default:0,
    },
    allFriends:{
        type:[friendListSchema]
    }
})

module.exports = mongoose.model('Friends', friendsSchema);