const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const time=require('./../libs/timeLib');

const history=new Schema({
    actionTaken:{
        type:String,
        required:true,
    },
    actionOwner:{
        type:String,
        required:true,
    },
    timeExecuted:{
        type:time,
        required:true,
    },
})

const historySchema=new Schema({
    hId:{
        type:String,
        required:true
    },
    expenseId:{
        type:String,
        required:true,
    },
    actionTaken:{
        type:[history],
        required:true,
    }
})

module.exports=mongoose.model('History',historySchema);