let appConfig={};

appConfig.port=3000;
appConfig.allowedCorsOrigin="*";
appConfig.env="dev";
appConfig.db={
    uri:'mongodb://127.0.0.1:27017/spendzDB'
}
appConfig.apiVersion='/api/v1';

module.exports={
    port: appConfig.port,
    allowedCorsOrigin: appConfig.allowedCorsOrigin,
    environment: appConfig.env,
    db :appConfig.db,
    apiVersion : appConfig.apiVersion
}

/*
* run sudo mongod in ubuntu shell to start the service
* then run mongodb to access the db from shell
*/