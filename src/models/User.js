const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcryptjs');
const {USER_ROLES} = require('../helpers/Roles');

const UserSchema = new Schema({
    name: { type: String, required: true} ,
    surname: { type: String, required: true}, 
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: {type: String, enum: USER_ROLES},
    date: { type: Date, default: Date.now},
    dni: {type: String, required: true},
    edad:{type:Number,required:true},
    riesgo:{type:String,required:true},
    address: {type: String, required: false}, 
    secretWord: {type: String, required:true}, 
    contra: {type: String, required: false} //hay que eliminiarla 
   
})

UserSchema.methods.encryptPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  };

UserSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
};

module.exports = mongoose.model('User', UserSchema);