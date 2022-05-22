const mongoose = require('mongoose');
const { Schema } = mongoose;

const TurnosSchema = new Schema({
    sede: { type: String, required: false},
    vacuna: { type: String, required: true},
    date: { type: Date, default: Date.now},
    user: {type: String},
    turnoAsginado: {type: Boolean}
})

module.exports = mongoose.model('Turnos', TurnosSchema)