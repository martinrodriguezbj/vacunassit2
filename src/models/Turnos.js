const mongoose = require('mongoose');
const { Schema } = mongoose;

const TurnosSchema = new Schema({
    sede: { type: String, required: false},
    vaccineName: { type: String, required: true},
    date: { type: Date, default: Date.now}, 
    user: {type: mongoose.Types.ObjectId},
    appointed: {type: Boolean},
    attended: {type: Boolean},
    applied: {type: Boolean},
    orderDate: {type: Date},
    vaccinator: {type: String}
})

module.exports = mongoose.model('Turnos', TurnosSchema)