const socket=io('http://localhost:3000');

let chatSocket=()=>{
    console.log("socket ready");
    socket.emit('getFriends',"U-Gbe9RhGu");

    socket.on('FriendListSuccess',(data)=>{
        console.log('function is ready');
        console.log(data);
    })

    socket.on('FriendListFailure',(data)=>{
        console.log('function is ready');
        console.log(data);
    })
}

chatSocket();