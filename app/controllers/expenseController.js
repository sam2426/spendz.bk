const ExpenseModel =require('./../models/GroupList');
const UserModel=require('./../models/User');
const HistoryModel=require('./../models/expenseHistory');

const shortid = require('shortid');

const response = require('./../libs/responseLib');
const time = require('./../libs/timeLib');
const check = require('../libs/checkLib');
const logger = require('./../libs/loggerLib');

let createExpenseGroup=(req,res)=>{
    if(check.isEmpty(req.body.groupName)){
        logger.error('Group not named', 'createExpenseGroup', 70);
        let apiResponse = response.generate(true, 'GroupName not entered', 400, null);
        res.send(apiResponse);
    }
    else{
        let newGroup= new ExpenseModel({
            groupId:'G-'+shortid.generate(),
            groupName:req.body.groupName,
            contributors:req.body.userId,
            timeCreated:time.now(),
            creator:req.body.userId
        })
        newGroup.save((err,group)=>{
            if(err){
                logger.error('Group not saved', 'createExpenseGroup', 20);
                let apiResponse = response.generate(true, 'Group not saved', 400, null);
                res.send(apiResponse);
            }else{
                logger.info('Group created', 'createExpenseGroup', 00);
                let apiResponse = response.generate(false, 'Group created', 200, group);
                res.send(apiResponse);
            }
        })
    }
}

let addMembersToGroup=(req,res)=>{
    let findGroup = ()=>{
        return new Promise((resolve,reject)=>{
            ExpenseModel.findOne({groupId:req.body.groupId}, (err,groupDetail)=>{
                if (err){
                    reject('Request Failed', err, 'expenseController:findGroup', 10);
                }else{
                    resolve(groupDetail);
                }
            })
        })
    }

    let addMember=(groupDetail)=>{
        return new Promise((resolve,reject)=>{
            groupDetail.contributors.push(req.body.userId)
            groupDetail.save((err,group)=>{
                if(err){
                    reject('Group not saved','Group not saved', 'createExpenseGroup', 20);
                }else{
                    resolve(group, 'Member Added', 'addGroupMember', 00);
                }
            })
        })
    }

    findGroup(req,res)
    .then(addMember)
    .then((resolve,msg,origin,imp) => {
        logger.info(msg,origin,imp);
        let apiResponse = response.generate(false, msg, 200, resolve);
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

module.exports={
    createExpenseGroup:createExpenseGroup,
    addGroupMember:addMembersToGroup,
    getExpenses:getExpenseGroup,
    createExpense:createExpense,
    editExpense:editExpense
}
