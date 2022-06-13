const express = require('express');
const fileUpload = require("express-fileupload");
const path = require("path");
const router = express.Router();
const { isAuthenticated } = require('../helpers/auth');
const User = require('../models/User');
const Vaccine = require('../models/Vaccine');
const Turnos = require('../models/Turnos');

const passport = require('passport');
const { PACIENTE, VACUNADOR, ADMINISTRADOR } = require('../helpers/Roles');
const { isNull } = require('util');

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
            const newUser = new User({ name, surname, email, password, dni, address, edad, riesgo, role: VACUNADOR, secretWord, validado: false});
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

router.get('/users/miperfil', isAuthenticated, async (req, res) => {
    const usuarios = await User.find({ dni: req.user.dni }).lean();
    res.render('users/miperfil', { usuarios });
});

router.get('/users/miperfil/edit/:id', isAuthenticated, async (req, res) => {
    const usuari = await User.findById(req.params.id).lean();
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
        res.render('./users/edit-pass', { u });
    }
    else {
        req.flash('error', 'Contraseña inválida');
        res.redirect('/users/miperfil');
    }
});

//validar identidad {SOLO SIMULACION}  FALTARÍA MODIFICAR EL USUARIO EN LA BD COMO "VALIDADO" ¿PUT,{:id}?

router.get('/users/valid-id', isAuthenticated, async (req, res) => {
    const usuari = await User.find({ dni: req.user.dni }).lean();
    res.render('users/valid-id', { usuari });
});

router.post('/users/validated', isAuthenticated, async (req, res) => {
    const usuario = req.user
    console.log(usuario);
    console.log({ files: req.files });
    const files = req.files;
    //control de que la identidad no haya sido previamente validada 
    if (usuario.validado == false){
        //caso en que no se sube ninguna foto
        if (files === null) { 
            req.flash('error', 'Validacion de ' + usuario.name + ' ' + usuario.surname + ' fallida. Debe cargar una foto.');
        } else {
            //si se sube un archivo
            const file = req.files.fname;
            if (file.name !== 'invalida.jpg') {
                //si el archivo no se llama invalida.jpg, se valida y se actualiza el campo "validado" del usuario a true.
                const us = await User.findByIdAndUpdate(usuario.id, { validado : true });
                req.flash('success_msg', 'Identidad de ' + usuario.name + ' ' + usuario.surname + ' validada.');
            } else {
                //Si se llama invalido, no se valida y se informa. 
                req.flash('error', 'Validacion de ' + usuario.name + ' ' + usuario.surname + ' fallida. Intente nuevamente.');
            }
        } 
    } else {
            req.flash('error', 'El usuario' + usuario.name + ' ' + usuario.surname + ' ya ha realizado la validación de identidad.');
    }
    

    res.redirect('/users/miperfil');
});

//certificado de vacunación
router.get('/users/micertificado', isAuthenticated, async (req, res) => {
    const usuario = await User.find({ dni: req.user.dni }).lean();
    let vacunas = await Vaccine.find({ user: req.user.id }).lean();

    // filtramos por las vacunas que tengan un laboratorio asociado
    vacunas = vacunas.filter(vacuna => vacuna.labName !== null);

    res.render('./users/micertificado', { usuario, vacunas });
});

//libreta sanitaria -> tiene todas las vacunas que registra en la app 
router.get('/users/pacientes/libreta-sanitaria', isAuthenticated, async (req, res) => {
    const usuario = await User.find({ dni: req.user.dni }).lean();
    let vacunas = await Vaccine.find({ user: req.user.id }).lean();

    res.render('users/pacientes/libreta-sanitaria', { usuario, vacunas });
});

//Buscar Paciente 
router.get('/users/vacunador/buscar-paciente', isAuthenticated, (req, res) => {
    res.render('./users/vacunador/buscarP');
});

router.post('/users/vacunador/buscarP', isAuthenticated, async (req, res) => {
    const paciente = await User.find(req.body).lean();
    if (Object.entries(paciente) == 0) {
        req.flash('error_msg', 'El DNI no se encuentra registrado');
        res.redirect('/users/vacunador/buscar-paciente');
    } else {
        if (paciente['0'].role === 'paciente' ){
            res.render('./users/vacunador/perfil-paciente', { paciente }); 
        }else{
            req.flash('error', "El DNI pertenece al personal del vacunatorio")
            res.redirect('/users/vacunador/buscar-paciente');
        }
    }
});

//Agregar a la lista de turnos
router.get('/users/vacunador/nuevo-turno/:id', isAuthenticated, async (req, res) => {
    res.render("./users/vacunador/asignar-turno", { id: req.params.id });
})

// Asignar turno a paciente
router.post('/users/vacunador/asignar-turno/:id', isAuthenticated, async (req, res) => {
    const { vaccineName, sede  } = req.body;
    const patientID = req.params.id;

    const vaccName = await Turnos.findOne( {vaccineName : vaccineName, user : patientID});
    const vaccAplied = await Vaccine.findOne({name : vaccineName, user : patientID})

    if (vaccName) {
        req.flash('error', 'El paciente ya tiene un turno para esta vacuna');
        res.redirect('/users/vacunador/buscar-paciente'); 
        return;
    }
    if (vaccAplied) {
        req.flash('error', 'El paciente ya tiene la vacuna asignada');
        res.redirect('/users/vacunador/buscar-paciente');
        return;
    }

    const turno = new Turnos({
        sede,
        vaccineName,
        date: new Date(),
        user: patientID,
        appointed: true,
        attended: false,
        orderDate: Date.now(),
    });

    await turno.save();
    req.flash('success_msg', 'Turno asignado');
    res.redirect('/users/vacunador/buscar-paciente');
})


//selector de sede
router.get('/users/vacunador/selector-sede', isAuthenticated,(req, res) => {
    res.render('./users/vacunador/selector-sede');
});

//agregar vacunas

//Agregar a la lista de turnos
router.get('/users/vacunador/agregar-vacuna/:id', isAuthenticated, async (req, res) => {
    res.render("./users/vacunador/asignar-turno", { id: req.params.id });
})


module.exports = router;