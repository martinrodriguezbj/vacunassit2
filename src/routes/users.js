const express = require('express');
const fileUpload = require("express-fileupload");
const path = require("path");
const router = express.Router();
const { isAuthenticated } = require('../helpers/auth');
const User = require('../models/User');
const Vaccine = require('../models/Vaccine');

const passport = require('passport');
const { PACIENTE } = require('../helpers/Roles');

router.get('/users/signin', (req, res) => {
    res.render('users/signin')
});

router.post('/users/signin', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/signin',
    failureFlash: true
}));

router.get('/users/signup', (req, res) => {
    res.render('users/signup')
});

router.post('/users/signup', async (req, res) => {
    const { name, surname, email, password, confirm_password, dni, edad, riesgo, address, secretWord } = req.body;
    const errors = [];
    if (name.length <= 0) {
        errors.push({ text: 'Por favor ingresar un nombre' });
    }
    if (surname.length <= 0) {
        errors.push({ text: 'Por favor ingresar un apellido' });
    }
    if (password != confirm_password) {
        errors.push({ text: 'Las contraseñas no coinciden' });
    }
    if (password.length < 6) {
        errors.push({ text: 'La contaseña debe ser mayor a 6 caracteres' })
    }
    if (errors.length > 0) {
        res.render('users/signup', { errors, name, email, password, confirm_password });
    } else {
        const dniUser = await User.findOne({ dni: dni });
        if (dniUser) {
            req.flash('error', 'El dni se encuentra en uso');
            res.redirect('/users/signup');
        } else {
            const newUser = new User({ name, surname, email, password, dni, address, edad, riesgo, role: PACIENTE, secretWord });
            newUser.contra = password;
            newUser.password = await newUser.encryptPassword(password);
            await newUser.save();
            req.flash('success_msg', 'Te has registrado');
            res.redirect('/users/signin');
        }
    }
});

router.get('/users/logout', isAuthenticated, (req, res) => {
    req.logout();
    res.redirect('/')
});

//editado por mi
router.get('/users/miperfil', isAuthenticated, async (req, res) => {
    const usuarios = await User.find({ dni: req.user.dni }).lean();
    //console.log(usuarios);
    res.render('users/miperfil', { usuarios });
});

router.get('/users/miperfil/edit/:id', isAuthenticated, async (req, res) => {
    const usuari = await User.findById(req.params.id).lean();
    // console.log(req.params.id);
    res.render('users/edit', { usuari });
})

router.put('/users/miperfil/edit/:id', isAuthenticated, async (req, res) => {
    const { name, surname, dni, address, email, edad, riesgo } = req.body;
    const userDni = await User.findOne({ dni: dni });
    if (userDni) {
        req.flash('error', 'El dni ya está registrado.');
        const us = await User.findByIdAndUpdate(req.params.id, { name, surname, address, email, edad, riesgo });
        res.redirect('/users/miperfil');
    }
    else {
        const us = await User.findByIdAndUpdate(req.params.id, { name, surname, dni, address, email, edad, riesgo });
        req.flash('success_msg', 'Datos actualizados correctamente');
        res.redirect('/users/miperfil');
    }
});


//Recuperar contraseña 
router.get('/users/pass-recovery', (req, res) => {
    res.render('./users/password-recovery');
});

router.post('/users/password-recovery', async (req, res) => {
    const user = await User.find(req.body);
    console.log(user);
    if (Object.entries(user) == 0) {
        req.flash('error_msg', 'DATOS INVALIDOS. Vuelva a intentarlo.');
        res.redirect('/users/signin');
    } else {
        const contra = user['0'].contra;
        req.flash('success_msg', 'Su contraseña es: ' + contra);
        res.redirect('/users/signin');
    }
});

//Cambiar contraseña

router.get('/users/edit-pass', isAuthenticated, async (req, res) => {
    const usuari = await User.findById(req.params.id).lean();
    res.render('./users/preEdit-pass', { usuari });
});

router.put('/users/edit-pass/:id', isAuthenticated, async (req, res) => {
    const { contra, repetirContra } = req.body;
    console.log('contra: ' + contra + ' RepContra: ' + repetirContra)
    const u = await User.findById(req.params.id);

    if (contra.length < 6) {
        req.flash('error_msg', 'debe ingresar, mínimo, 6 caracteres');
        res.redirect('/users/miperfil');
    }
    else {
        if (contra !== repetirContra) {
            req.flash('error_msg', 'Las contraseñas no coinciden');
            res.redirect('/users/miperfil');
        } else {
            await User.findByIdAndUpdate(req.params.id, { contra });
            const password = await u.encryptPassword(contra);
            await User.findByIdAndUpdate(req.params.id, { password });

            req.flash('success_msg', 'Contraseña actualizada');
            res.redirect('/users/miperfil');
        }
    }
});

//pedir la contraseña actual antes de actualizar
router.put('/users/preEdit-pass/:id', isAuthenticated, async (req, res) => {
    const { contra } = req.body;
    const u = await User.findById(req.params.id);

    if (contra === u.contra) {
        //redirigir a la ruta para actualizar la contraseña
        res.render('./users/edit-pass', { u });
    }
    else {
        //error y redirigir al perfil 
        req.flash('error', 'Contraseña inválida');
        res.redirect('/users/miperfil');
    }
});

//validar identidad ---- no funciona
router.get('/users/valid-id', isAuthenticated, async (req, res) => {
    const usuari = await User.find({ dni: req.user.dni }).lean();
    //console.log(req.file);

    //const message = 'Identidad de ' + usuari['0'].name + ' ' + usuari['0'].surname + ' validada.'
    //req.flash('error', message);
    //req.flash('success_msg', message);
    res.render('users/valid-id', { usuari });
    //res.redirect('/users/miperfil'); 
});

router.post('/users/validated', isAuthenticated, async (req, res) => {
    const usuario = req.user//await User.findById(req.params.id);
    console.log(usuario);
    console.log(req.files);
    if (!req.files) {
        return res.status(400).send("No files were uploaded.");
    }

    const file = req.files.fname;
    const path = "src/files" + file.name;

    file.mv(path, (err) => {
        if (err) {
            return res.status(500).send(err);
        }
        return res.send({ status: "success", path: path });
    });
    //res.json(req.file);
    //     const message = 'Identidad de ' + usuari['0'].name + ' ' + usuari['0'].surname + ' validada.'
    //     //req.flash('error', message);
    req.flash('success_msg', 'Identidad de ' + usuario.name + ' ' + usuario.surname + ' validada.');
    //     // window.alert(message);
    //     // res.render('users/edit', { usuari });
    res.redirect('/users/miperfil');
});

//certificado de vacunación
router.get('/users/micertificado', isAuthenticated, async (req, res) => {
    const usuario = await User.find({ dni: req.user.dni }).lean();
    const vacunas = await Vaccine.find({ user: req.user.id }).lean(); //quiero buscar las vacunas del usuario
    console.log(vacunas);
    res.render('users/micertificado', { usuario, vacunas });
});

module.exports = router;