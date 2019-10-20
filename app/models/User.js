const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const time=require('./../libs/timeLib');

const userSchema = new Schema({
    userId: {
        type: String,
        default: '',
        index: true,
        unique: true
    },
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: '',
        unique: true,
        required: true
    },
    password: {
        type: String,
        default: 'password',
        required: true
    },
    mobileNumber: {
        type: Number,
        default: 0
    },
    createdOn: {
        type: time,
        default: ''
    },
    gender:{
        type:String,
        default:'Male'
    },
    profilePic:{
        type:String,
        default:''
    },
    otp: {
        type: Number,
        default: 0
    },
    otpExpiry: {
        type: time,
        default: ''
    },
    friendList:{
        type:Schema.Types.ObjectId,
        ref:'Friends',
        unique:true,
    },
    groups:[
        {
            type:Schema.Types.ObjectId,
            ref:'SpendGrp',
            unique:true
        }
    ]    
    //groups:{                              xxxxxx    this is wrong way to define schema of array of objects
    //     type:[Schema.Types.ObjectId],
    //     ref:'SpendGrp'
    // }
})


module.exports = mongoose.model('User', userSchema);