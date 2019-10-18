const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const time= require('./../libs/timeLib');

const expenseMemberSchema=new Schema({
    memberId:{
        type:String,
        required:true,
    },
    memberName:{
        type:String,
        required:true,
    },
    amountOwed:{
        type:Number,
        required:true,
        default:0,
    },
    amountPaid:{
        type:Number,
        default:0
    }

})

const expenseSchema=new Schema({
    expenseId:{
        type:String,
        required:true,
    },
    expenseName:{
        type:String,
        required:true,
    },
    expenseAmount:{
        type:Number,
        required:true,
    },
    expenseOwner:{
        type:String,
        required:true
    },
    createdBy:{
        type:String,
        required:true,
    },
    expenseInitAt:{
        type:time,
    },
    members:{
        type:[expenseMemberSchema]
    }
})

const groupSchema=new Schema({
    groupId:{
        type:String,
        default:'',
        required:true,
    },
    groupName:{
        type:String,
        default:'',
    },
    contributors:{
        type:[],
        required:true,
    },
    timeCreated:{
        type:time,
        default:'',
    },
    creator:{
        type:String,
        required:true,
    },
    expenses:{
        type:[expenseSchema]
    }
})

module.exports = mongoose.model('SpendGrp', groupSchema);

// module.exports={
//     todoSchema:todoSchema,
// }