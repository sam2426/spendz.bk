const express=require('express');
const appConfig=require('./../../config/appConfig');
const expenseController=require('./../controllers/expenseController');


module.exports.setRouter=(app)=>{

    let baseUrl=`${appConfig.apiVersion}/expenses`;

    app.post(`${baseUrl}/createGroup`,expenseController.createExpenseGroup);

    app.post(`${baseUrl}/addGroupMember`,expenseController.addGroupMember);

    app.post(`${baseUrl}/getExpense`,expenseController.getExpenses);

    app.post(`${baseUrl}/createExpense`,expenseController.createExpense);

    app.post(`${baseUrl}/editExpense`,expenseController.editExpense);

    app.get(`${baseUrl}/:userId/getGroup`,expenseController.getGroup);
}