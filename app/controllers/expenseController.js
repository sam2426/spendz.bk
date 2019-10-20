const ExpenseModel =require('./../models/GroupList');
const UserModel=require('./../models/User');
const HistoryModel=require('./../models/expenseHistory');

const shortid = require('shortid');

const response = require('./../libs/responseLib');
const time = require('./../libs/timeLib');
const check = require('../libs/checkLib');
const logger = require('./../libs/loggerLib');

let createExpenseGroup=(req,res)=>{

    let findUser=()=>{
        return new Promise((resolve,reject)=>{
            UserModel.findOne({'userId':req.body.userId})
            .exec((err,result)=>{
                if(err){
                    reject('Id not found');
                }else if(check.isEmpty(result)){
                    reject('Id Not Found');
                }else{
                    resolve(result._id);
                }
            })
        })
    }

    let createGroup=(userId)=>{
        return new Promise((resolve,reject)=>{
            if(check.isEmpty(req.body.groupName)){
                reject('Group already present');
            }
            else{
                let newGroup= new ExpenseModel({
                    groupId:'G-'+shortid.generate(),
                    groupName:req.body.groupName,
                    contributors:userId,
                    timeCreated:time.now(),
                    creator:userId
                })
                newGroup.save((err,group)=>{
                    if(err){
                        reject('Group Not Created');
                    }else{
                        resolve(group);
                    }
                })
            }
        })
    }

    let updateUserData=(groupData)=>{
        return new Promise((resolve,reject)=>{
            UserModel.findOne({userId:req.body.userId},(err,response)=>{
                if(err){
                    console.log(err);
                    reject('User not found');
                }else if(check.isEmpty(response)){
                    reject('User not found');
                }else{
                    response.groups.push(groupData._id)
                    response.save((err,data)=>{
                        if(err){
                            console.log(err);
                            reject(err);
                        }else{
                            resolve(groupData);
                        }
                    })
                }
            })
        })
    }
    findUser(req,res)
    .then(createGroup)
    .then(updateUserData)
    .then((resolve)=>{
        logger.info('Group created', 'createExpenseGroup', 00);
        let apiResponse = response.generate(false, 'Group created', 200, resolve);
        res.send(apiResponse);
    })
    .catch((err)=>{
        logger.error(err, 'createExpenseGroup', 20);
        let apiResponse = response.generate(true, 'Group not saved', 400, null);
        res.send(apiResponse);
    })
    
}

let addMembersToGroup=(req,res)=>{
    //first getting group details then adding multiple members to group
    let membersId=[];
    let findGroup = ()=>{
        return new Promise((resolve,reject)=>{
            ExpenseModel.findOne({groupId:req.body.groupId}, (err,groupDetail)=>{
                if (err){
                    reject('Request Failed', err, 'AddMembersToGroup:findGroup', 10);
                }else{
                    console.log(groupDetail);
                    resolve(groupDetail);
                }
            })
        })
    }

    let findUserId=(groupDetail)=>{
        return new Promise((resolve,reject)=>{
            membersId= req.body.members.split(',');//here an array of mebers is to be passed from frontend.
            UserModel.find({'userId':{'$in':membersId}})
            .select('_id').lean().exec((err,result)=>{
                if(err){
                    reject('Id not found','Group not saved', 'AddMembersToGroup:findUser', 20);
                }else{
                    console.log("this is result",result)
                    let pass={
                        groupDetail:groupDetail,
                        userId:result
                    }
                    resolve(pass);
                }
            })
        })
    }

    let addMember=(retrievedDetail)=>{
        return new Promise((resolve,reject)=>{
            let memberIds= retrievedDetail.userId;
            groupDetail=retrievedDetail.groupDetail;
            let membersToAdd=[];
            for(M in memberIds){
                if(!groupDetail.contributors.includes(memberIds[M]._id)){
                    console.log(memberIds[M]._id);
                    membersToAdd.push(memberIds[M]._id);
                }
            }
                console.log("memberto add ",membersToAdd);
                // groupDetail.contributors.push(membersId[M])
                
                groupDetail.contributors=groupDetail.contributors.concat(membersToAdd)
                groupDetail.save((err,group)=>{
                if(err){
                    reject('Group not saved',err, 'AddMembersToGroup', 20);
                }else{
                    console.log("group",group);
                    resolve(group);
                }
            })            
        })
    }
//fetch and update users who are in the array but, group.id is not associated with them. 
    let updateUserData=(groupData)=>{
        return new Promise((resolve,reject)=>{
            UserModel.updateMany({
                userId:{"$in":membersId}, 
                groups:{"$ne":groupData._id}
            },{
                $push:{groups:groupData._id}
            },(err,response)=>{
                if (err) {
                    reject('Group not saved', err, 'AddMembersToGroup', 20);
                } else if (response.nModified === 0){
                    resolve(groupData,'Id Not Found','AddMembersToGroup',20);
                } else {
                    resolve(groupData,'Members Added','AddMembersToGroup',00);
                }
            })
        })
    }

    findGroup(req,res)
    .then(findUserId)
    .then(addMember)
    .then(updateUserData)
    .then((data,msg,origin,imp) => {
        logger.info(msg,origin,imp);
        let apiResponse = response.generate(false,'user found',200,data);
        res.send(apiResponse);
    })
    .catch((err, msg, origin, imp) => {
        logger.error(msg, origin, imp);
        let apiResponse = response.generate(true, err, 400, null);
        res.send(apiResponse);
    });
    
}

let getExpenseGroup=(req,res)=>{
    ExpenseModel.find({userId:req.body.userId},(err,result)=>{
        if (err) {
            logger.error(err.message, 'expenseController: getexpenses', 10);
            let apiResponse = response.generate(true, `Unexpected Error Occurred`, 500, null);
            res.send(apiResponse);
        } else if (check.isEmpty(result)) {
            let apiResponse = response.generate(true, "No Expenses Created Yet", 404, null);
            res.send(apiResponse);
        } else {
            let apiResponse = response.generate(false, 'Expenses Found', 200, result);
            res.send(apiResponse);
        }
    })
}

let createExpense=(req,res)=>{

    let getMembers=()=>{
        return new Promise((resolve,reject)=>{
            let members=req.body.members.split(',');//here an array of mebers is to be passed from frontend.
            // let expmem=["U-Gbe9RhGu","U-MbyAVxXf","U-lctYDY7m"];
            // console.log(typeof expmem);
            // console.log(typeof members);
            let amountPerHead=(req.body.amount/members.length).toFixed(2);//here using only equal split between the members.
            let memberArray=[];
            for(M in members){
                console.log(members[M]);
                UserModel.findOne({'userId':members[M]})
                .select('userId firstName lastName')
                .lean().exec((err,result)=>{
                    if(err){
                        reject(err);
                    }else{
                        console.log(result);
                        // let Oresult=result.toObject();
                        let memberField={
                            memberId:result.userId,
                            memberName:result.firstName+" "+result.lastName,
                            amountOwed:amountPerHead,
                            amountPaid:0,
                        }
                        memberArray.push(memberField);
                    }
                    
                })
            }
            resolve(memberArray);
        })
    }
    let expenseId='';
    let createModel=(retrievedMember)=>{
        return new Promise((resolve,reject)=>{
            ExpenseModel.findOne({'groupId':req.body.groupId}).then(record=>{
                let newExpense={
                    expenseId:'E-'+shortid.generate(),
                    expenseName:req.body.expenseName,
                    expenseAmount:req.body.amount,
                    expenseOwner:req.body.ownerId,
                    createdBy:req.body.userId,
                    expenseInitAt:time.now(),
                    members:retrievedMember,
                    // createdBy:req.body.ownerId,
                }
                expenseId=newExpense.expenseId;
                record.expenses.push(newExpense);
        
                record.save((err,result)=>{
                    if(err){
                        reject(err)
                    }else{
                        resolve(result);
                    }
                })
            })

        })
    }

    let updateHistory=(retrievedResult)=>{
        return new Promise((resolve,reject)=>{
            let actionItem={
                actionTaken:'created',
                actionOwner:req.body.userId,
                timeExecuted:time.now(),
            }

            let newGroup= new HistoryModel({
                hId:'H-'+shortid.generate(),
                expenseId:expenseId,
                actionTaken:actionItem,
            })

            newGroup.save((err,result)=>{
                if(err){
                    reject(err);
                }else{
                    resolve(retrievedResult);
                }
            })
        })
        
    }

    getMembers(req,res)
    .then(createModel)
    .then(updateHistory)
    .then(resolve=>{
        let apiResponse=response.generate(false,'Expense Saved', 200, resolve)
        res.send(apiResponse);
    })
    .catch(err=>{
        let apiResponse=response.generate(true,'Expense Not Saved', 500, err)
        res.send(apiResponse);
    })
    
}


//revise once the concept of edit/update user
let editExpense = (req, res) => {
    let options = req.body;
    ExpenseModel.update({ 'groupId': req.body.groupId }, options).exec((err, result) => {
        if (err) {
            logger.error(err.message, 'User Controller:editUser', 10);
            let apiResponse = response.generate(true, 'Failed To edit user details', 500, null);
            res.send(apiResponse);
        } else if (check.isEmpty(result)) {
            logger.info('No User Found', 'User Controller: editUser',70);
            let apiResponse = response.generate(true, 'No group Found', 404, null);
            res.send(apiResponse);
        } else {
            let apiResponse = response.generate(false, 'User details edited', 200, result);
            res.send(apiResponse);
        }
    });// end user model update
}

let getUserGroup=(req,res)=>{

    UserModel.find({'userId':req.params.userId})
    .select('userId -_id')
    .populate('groups')
    .populate('contributors')
    .lean().exec((err,result)=>{
        if (err) {
            logger.error(err.message, 'ExpenseController: getGroups', 10);
            let apiResponse = response.generate(true, 'Failed To Find Groups', 400, null);
            res.send(apiResponse);
        } else if (check.isEmpty(result)) {
            logger.error("No Groups Found", 'ExpenseController: getGroups', 10);
            let apiResponse = response.generate(true, 'No Groups To Show', 400, null);
            res.send(apiResponse);
        } else {
            logger.info("No Groups Found", 'ExpenseController: getGroups', 10);
            let apiResponse = response.generate(false, 'Groups Populated', 200, result[0].groups);
            res.send(apiResponse);
        }
    })
}

module.exports={
    createExpenseGroup:createExpenseGroup,
    addGroupMember:addMembersToGroup,
    getExpenses:getExpenseGroup,
    createExpense:createExpense,
    editExpense:editExpense,
    getGroup:getUserGroup
}
