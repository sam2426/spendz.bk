const express=require('express');
const appConfig=require('./../../config/appConfig');
const userController=require('./../controllers/userController');
const FriendsController=require('./../controllers/friendsController');

module.exports.setRouter=(app)=>{

    let baseUrl=`${appConfig.apiVersion}/users`;

    app.post(`${baseUrl}/signup`,userController.signUpFunction);

    app.post(`${baseUrl}/login`,userController.loginFunction);

    app.get(`${baseUrl}/:userId/details`, userController.getSingleUser);

    // app.get(`${baseUrl}/:userId/allUsers`, userController.getAllUser);

    // app.get(`${baseUrl}/:userId/allFriends`, userController.getAllFriends);

    app.put(`${baseUrl}/:userId/edit`, userController.editUser);

    // app.post(`${baseUrl}/:userId/delete`, userController.deleteUser);

    app.post(`${baseUrl}/logout`, userController.logout);

    app.post(`${baseUrl}/forgetPassword`, userController.forgetPassword);

    app.post(`${baseUrl}/resetPassword`, userController.resetPassword);

    app.post(`${baseUrl}/uploadImage`, userController.uploadImage);

    app.post(`${baseUrl}/addFriend`, FriendsController.addFriendRecord);

    app.post(`${baseUrl}/delReq`,FriendsController.deleteRequest);

    app.post(`${baseUrl}/acceptReq`,FriendsController.acceptFriendRequest);
}