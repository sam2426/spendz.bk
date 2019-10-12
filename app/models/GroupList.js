const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const time= require('./../libs/timeLib');

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
    time:{
        type:time,
        default:'',
    }
})

module.exports = mongoose.model('SpendGrp', groupSchema);

// module.exports={
//     todoSchema:todoSchema,
// }