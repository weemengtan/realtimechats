const socket = io()

//declare index html elements
const $message = document.querySelector('#messages')

//declare templates
//const messagetemplates = document.querySelector('#message-template').innerHTML
const messagetemplates = document.querySelector('#message-template').innerHTML
const mylocationtemplate = document.querySelector('#mylocation-template').innerHTML
const sidebartemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


socket.on('roomdata', (msg) => {
    console.log(msg);
    const html = Mustache.render(sidebartemplate, {
        room: msg.room,
        users: msg.users
    })
    document.querySelector('#sidebar').innerHTML = html
})

const autoscroll = () => {
    // new message element
    const $newmessage = $message.lastElementChild

    //height of new message
    const newMessageStyle = getComputedStyle($newmessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newmessage.offsetHeight + newMessageMargin
    console.log(newMessageStyle);
    console.log(newMessageHeight);

    //visible height
    const visibleHeight = $message.offsetHeight

    //heigh of message container
    const containerHeight = $message.scrollHeight

    //how far have i scrolled
    const scrolloffset = $message.scrollTop + visibleHeight
    if (containerHeight - newMessageHeight <= scrolloffset) {
        $message.scrollTop = $message.scrollHeight
    }

}

socket.on('message', (msg) => {
    console.log('Chat server established ', msg);
    const html = Mustache.render(messagetemplates, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm:ss a')
    })
    $message.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on('geolocationmessage', (msg) => {
    console.log(msg);
    const html = Mustache.render(mylocationtemplate, {
        username: msg.username,
        geolocationmessage: msg.url,
        createdAt: moment(msg.createdAt).format('h:mm:ss a')
    })
    $message.insertAdjacentHTML("beforeend", html)
    autoscroll
})

const chatform = document.querySelector('form')
const chatinput = chatform.querySelector('input')
const chatbutton = chatform.querySelector('button')

//const chatinput = document.querySelector('input')
chatform.addEventListener('submit', (e) => {
    e.preventDefault() //default action of page refresh each time you click
    chatbutton.setAttribute('disabled', 'disabled') //disable button right after send message
    const chatinput = e.target.elements.message //look for element name="message"
    console.log(`sending chat ${chatinput.value}.`);
    socket.emit('sendchat', chatinput.value, (callbackerror) => {
        chatbutton.removeAttribute('disabled') //enable button
        chatinput.value = ''
        chatinput.focus()
        if (callbackerror) {
            return console.log('Send Error', callbackerror)
        }
        console.log(`Message reached server successfully`);
    })
})

const sendlocationbutton = document.querySelector("#sendlocation")

sendlocationbutton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert("Geo-location is not supported")
    }
    sendlocationbutton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position);
        console.log('longitude', position.coords.longitude);
        console.log('latitude', position.coords.latitude);
        //        socket.emit('sendlocation', `My current longitude is ${position.coords.longitude} and my latitude is ${position.coords.latitude}.`)
        socket.emit('sendlocation', `${position.coords.latitude},${position.coords.longitude}`, (callbackmessage) => {
            if (callbackmessage) {
                console.log('Location Shared', callbackmessage);
                sendlocationbutton.removeAttribute('disabled')

            }
        })
    })
})

socket.emit('join', { username, room }, callbackerror => {
    if (callbackerror) {
        alert(`Oops..${callbackerror}, you will be redirected back.`);
        location.href = '/';
    }
})