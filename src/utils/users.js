const users = []
    // add user, remove user, get user, get user room

const adduser = ({ id, username, room }) => {
    //clean data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    //validate data
    if (!username || !room) {
        return ({ error: 'User name and Room are required' })
    }

    //check for existing user
    const existinguser = users.find((user) => {
        return user.room === room && user.username === username
    })
    if (existinguser) {
        return ({ error: 'user name already in use' })
    }

    //store user
    const user = { id, username, room }
    users.push(user)
    console.log(users);
    return { user }
}

const removeUser = (id) => {
    //use findindex method because function will stop once match is found;
    //filter will continue running till the end of array
    const index = users.findIndex((user) => {
        return user.id === id
    })
    if (index !== -1) {
        return users.splice(index, 1)[0] //remove 1 item by index
    }
}

const getUser = (id) => { return users.find((user) => user.id === id) }
const getUsersInRoom = (room) => { return users.filter((user) => user.room === room) }

module.exports = {
    adduser,
    getUser,
    removeUser,
    getUsersInRoom
}