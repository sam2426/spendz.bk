// (async function () {
            //     const promises = membersId.map(async (M) => {
            //         console.log(M);
            //         UserModel.findOne({ userId: M }, (err, response) => {
            //             if (err) {
            //                 console.log(err);
            //                 reject(err, 'Group not saved', 'AddMembersToGroup', 20);
            //             } else if (check.isEmpty(response)) {
            //                 reject(err, 'Group not saved', 'AddMembersToGroup', 20);
            //             } else {
            //                 if (!response.groups.includes(groupData._id)) {
            //                     response.groups.push(groupData._id)
            //                     response.save((err, data) => {
            //                         if (err) {
            //                             console.log(err);
            //                             reject(err);
            //                         } else {
            //                             console.log(data);
            //                         }
            //                     })
            //                 }
            //             }
            //         })
            //     }

            //     );
            //     await Promise.all(promises);

            //     console.log('Finished!');
            //     resolve(groupData,'Members Added','AddMembersToGroup',00);
            // })()

            // for(M in membersId){
            //     console.log(membersId[M]);
            //     UserModel.findOne({userId:membersId[M]},(err,response)=>{
            //         if(err){
            //             console.log(err);
            //             reject(err,'Group not saved', 'AddMembersToGroup', 20);
            //         }else if(check.isEmpty(response)){
            //             reject(err,'Group not saved', 'AddMembersToGroup', 20);
            //         }else{
            //             if(!response.groups.includes(groupData._id)){
            //                 response.groups.push(groupData._id)
            //                 response.save((err,data)=>{
            //                 if(err){
            //                     console.log(err);
            //                     reject(err);
            //                 }else{
            //                  console.log(data);   
            //                 }
            //             })
            //             }
            //         }
            //     })
            // }
            // resolve(groupData,'Members Added','AddMembersToGroup',00);


membersId=["U-ZCIwZGvW", "U-MbyAVxXf", "U-Gbe9RhGu"];

let updateUserData=(groupData)=>{
    console.log('userdata starts');
    return new Promise((resolve,reject)=>{
        console.log("userdata ",membersId);
        for(M in membersId){
            console.log(membersId[M]);
            UserModel.findOne({userId:membersId[M]},(err,response)=>{
                if(err){
                    console.log(err);
                    reject(err,'Group not saved', 'AddMembersToGroup', 20);
                }else if(check.isEmpty(response)){
                    reject(err,'Group not saved', 'AddMembersToGroup', 20);
                }else{
                    if(!response.groups.includes(groupData._id)){
                        response.groups.push(groupData._id)
                        response.save((err,data)=>{
                        if(err){
                            console.log(err);
                            reject(err);
                        }else{
                         console.log(data);   
                        }
                    })
                    }
                }
            })
        }
        resolve(groupData,'Members Added','AddMembersToGroup',00);
    })
}

let updateUserData = (groupData) => {
    return new Promise((resolve, reject) => {

        async function getTodos() {
            for (const M of membersId) {
                    await UserModel.findOne({ userId: M }, (err, response) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else if (check.isEmpty(response)) {
                        reject("Id not found");
                    } else {
                        if (!response.groups.includes(groupData._id)) {
                            response.groups.push(groupData._id)
                            response.save((err, data) => {
                                if (err) {
                                    console.log(err);
                                    reject(err);
                                } else {
                                    console.log(data);
                                }
                            })
                        }
                    }
                })
            }
          
            console.log('Finished!');
            resolve(groupData,'Members Added','AddMembersToGroup',00);
          }
          
          getTodos();
    })
}



membersId=["U-ZCIwZGvW", "U-MbyAVxXf", "U-Gbe9RhGu"];

async function getUserData(userId){
    result={}

    var promises=[]
    for (var i=0;i<userId.length;i++){
        user=userId[i]
        try{
            responsePromise=await UserModel.findOne({userId:user})
            promises.push(responsePromise);
        }
        catch(e){
            return null;
        }
    }
    return promises
}
promises=getUserData(membersId)
Promise.all(promises)
.then(()=>{

})

// async function getUserData(){
            //     let promises=[];
            //     for(let i=0;i<membersId.length;i++){
            //         user=membersId[i];
            //         try{
            //             let responsePromise=await UserModel.findOne({userId:user});
            //             promises.push(responsePromise);
            //             if(!responsePromise.groups.includes(groupData._id)){
            //                 responsePromise.groups.push(groupData._id);
            //                 let savePromise=await responsePromise.save();
            //                 promises.push(savePromise); 
            //             }
            //         }
            //         catch(e){
            //             return e;
            //         }
            //     }
            //     return promises
            // }

            // function getUserData(){
            //         let promises=[];
            //         for(let i=0;i<membersId.length;i++){
            //             user=membersId[i];
            //             try{
            //                 let responsePromise=UserModel.findOne({userId:user})
            //                 .then(res=>{
            //                     if(!res.groups.includes(groupData._id)){
            //                         res.groups.push(groupData._id);
            //                         return res.save();
            //                     }
            //                 })
                            
            //                 promises.push(responsePromise)
            //             }
            //             catch(e){
            //                 return e;
            //             }
            //         }
            //         return promises
            //     }

            // let updateUserData=(groupData)=>{
    //     console.log('userdata starts');
    //     return new Promise((resolve,reject)=>{
    //         console.log("userdata ",membersId);
    //         for(M in membersId){
    //             console.log(membersId[M]);
    //             UserModel.findOne({userId:membersId[M]},(err,response)=>{
    //                 if(err){
    //                     console.log(err);
    //                     reject(err,'Group not saved', 'AddMembersToGroup', 20);
    //                 }else if(check.isEmpty(response)){
    //                     reject(err,'Group not saved', 'AddMembersToGroup', 20);
    //                 }else{
    //                     if(!response.groups.includes(groupData._id)){
    //                         response.groups.push(groupData._id)
    //                         response.save((err,data)=>{
    //                         if(err){
    //                             console.log(err);
    //                             reject(err);
    //                         }else{
    //                          console.log(data);   
    //                         }
    //                     })
    //                     }
    //                 }
    //             })
    //         }
    //         resolve(groupData,'Members Added','AddMembersToGroup',00);
    //     })
    // }

    // let updateUserData = (groupData) => {
    //     console.log('userdata starts');
    //     return new Promise((resolve, reject) => {
    //         console.log("userdata ", membersId);

    //         async function getTodos() {
    //             for (const M of membersId) {
    //                 // const add = await UserModel.findOne({ userId: M }, (err, response) => {
    //                     await UserModel.findOne({ userId: M }, (err, response) => {
    //                     if (err) {
    //                         console.log(err);
    //                         reject(err, 'Group not saved', 'AddMembersToGroup', 20);
    //                     } else if (check.isEmpty(response)) {
    //                         reject(err, 'Group not saved', 'AddMembersToGroup', 20);
    //                     } else {
    //                         if (!response.groups.includes(groupData._id)) {
    //                             response.groups.push(groupData._id)
    //                             response.save((err, data) => {
    //                                 if (err) {
    //                                     console.log(err);
    //                                     reject(err);
    //                                 } else {
    //                                     console.log(data);
    //                                 }
    //                             })
    //                         }
    //                     }
    //                 })
    //                 // console.log(`Received Todo ${idx + 1}:`, add);
    //             }
              
    //             console.log('Finished!');
    //             resolve(groupData,'Members Added','AddMembersToGroup',00);
    //           }
              
    //           getTodos();

            
    //     })
    // }
