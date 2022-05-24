//este archivo es para tener una conexion a una base de datos, y será utilizado por index.js
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/notes-db-app', {
    //useCreateIndex: true,
    useNewUrlParser: true,
    //useFindAndModify: false
})
    .then(db => console.log('DB is connected'))
    .catch(err => console.error(err));