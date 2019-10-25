const express=require('express');
const appConfig=require('./../../config/appConfig');
const expenseController=require('./../controllers/expenseController');


module.exports.setRouter=(app)=>{

    let baseUrl=`${appConfig.apiVersion}/expenses`;

    app.post(`${baseUrl}/createGroup`,expenseController.createExpenseGroup);

    app.get(`${baseUrl}/:userId/getGroup`,expenseController.getGroup);

    app.post(`${baseUrl}/addGroupMember`,expenseController.addGroupMember);

    app.get(`${baseUrl}/:groupId/getExpense`,expenseController.getExpenses);

    app.post(`${baseUrl}/createExpense`,expenseController.createExpense);

    app.post(`${baseUrl}/editExpense`,expenseController.editExpense);

}