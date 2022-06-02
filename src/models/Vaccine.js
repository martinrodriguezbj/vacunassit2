const mongoose = require('mongoose');
const { Schema } = mongoose;

const VaccineSchema = new Schema({
    name: { type: String, required: true },                                  
    labName: { type: String, required: false },
    place: { type: String, required: false },
    date: { type: Date, required: false },
    lot: { type: Number, required: false },
    user: {type: String, required: false}
})

module.exports = mongoose.model('Vaccine', VaccineSchema)