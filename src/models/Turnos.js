const mongoose = require('mongoose');
const { Schema } = mongoose;

const TurnosSchema = new Schema({
    sede: { type: String, required: false},
    vaccineName: { type: String, required: true},
    date: { type: Date, default: Date.now},
    user: {type: String},
    appointed: {type: Boolean},
    attended: {type: Boolean},
    orderDate: {type: Date, required: false}
})

module.exports = mongoose.model('Turnos', TurnosSchema)