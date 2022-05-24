const express = require('express');
const router = express.Router();

const { isAuthenticated } = require('../helpers/auth');
const User = require('../models/User');

const passport = require('passport');
const { PACIENTE } = require('../helpers/Roles');

router.get('/users/signin', (req, res) => {
    res.render('users/signin')
});

router.post('/users/signin', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/signin', 
    failureFlash: true
})
);

router.get('/users/signup', (req, res) => {
    res.render('users/signup')
});

router.post('/users/signup', async  (req, res) => {
    const { name,surname, email, password, confirm_password, dni, address } = req.body;
    const errors = [];
    if (name.length <= 0){
        errors.push({text: 'Por favor ingresar un nombre'});
    }
    if (surname.length <= 0){
        errors.push({text: 'Por favor ingresar un apellido'});
    }
    if (password != confirm_password) {
        errors.push({text: 'Las contraseñas no coinciden'});
    }
    if (password.length < 6){
        errors.push({text: 'La contaseña debe ser mayor a 6 caracteres'})
    }
    if(errors.length > 0){
        res.render('users/signup', {errors, name, email, password, confirm_password});
    } else {
        const dniUser = await User.findOne({dni : dni});  
        if (dniUser){
            req.flash('error_msg', 'El dni se encuentra en uso');
            res.redirect('/users/signup');
        } else {
        const newUser = new User({ name,surname, email, password, dni, address, role: PACIENTE});
        newUser.password = await newUser.encryptPassword(password);
        await newUser.save();
        req.flash('success_msg', 'Te has registrado');
        res.redirect('/users/signin');
        }
    }
});

router.get('/users/logout', (req, res) => {
    req.logout();
    res.redirect('/')
});

//editado por mi
router.get('/users/miperfil', async (req, res) => {
    const usuarios = await User.find({dni: req.user.dni}).lean();
    //console.log(usuarios);
    res.render('users/miperfil', {usuarios});
});

router.get('/users/miperfil/edit/:id', isAuthenticated, async (req, res) => {
    const usuari = await User.findById(req.params.id).lean();
    console.log(req.params.id);
    res.render('users/edit', {usuari});
})

router.put('/users/miperfil/edit/:id', isAuthenticated, async (req, res) => {
    const { name, surname, dni, address, email }= req.body;
    const us = await User.findByIdAndUpdate(req.params.id, {name, surname, dni, address, email });
    //console.log({name});
    req.flash('success_msg', 'Datos actualizados correctamente');
    res.redirect('/users/miperfil');
})
//hasta acá

//comprobante

router.get('/users/signup', (req, res) => {
    res.render('users/signup')
});

module.exports = router;