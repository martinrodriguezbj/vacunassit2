const express = require('express');
const res = require('express/lib/response');
const router = express.Router();

const Vaccine = require('../models/Vaccine');
const Turno = require('../models/Turnos');
const { isAuthenticated } = require('../helpers/auth');
const User = require('../models/User');
const { ADMINISTRADOR } = require('../helpers/Roles');

router.get('/vaccines/add', isAuthenticated, async (req, res) => {
    const user = await User.findById(req.user.id).lean();
    res.render('vaccines/new-vaccines', { isAdmin: user.role === ADMINISTRADOR });
});

router.post('/vaccines/new-vaccines', isAuthenticated, async (req, res) => {
    const { name, date } = req.body;
    const errors = [];

    // Compare if the date coming is not in the future
    const today = new Date();
    const dateToCompare = new Date(date);
    if (dateToCompare > today) {
        errors.push({ text: 'La fecha no puede ser mayor a la actual'});
    }

    // Si no envia name, error
    if (!name) {
        errors.push({ text: 'Debe elegir una vacuna' });
    }
    
    // Validar que la vacuna no haya sido registrada
    const vaccineName = await Vaccine.findOne({ name: name, user: req.user.id });
    if (vaccineName) {
        errors.push({ text: 'La vacuna ya se encuentra registrada' });
    }

    // Si hay errores, informalos
    if (errors.length > 0) {
        req.flash('error', errors.map(error => error.text).join(" y "));
        res.redirect('/vaccines');
        return;
    };

    // Si no hay errores, crear la vacuna
    const newVaccine = new Vaccine({ name, date });
    newVaccine.user = req.user.id;
    newVaccine.place = null;
    newVaccine.lot = null;
    newVaccine.labName = null;
    await newVaccine.save();
    req.flash('success_msg', 'Se ha registrado una nueva vacuna.');
    res.redirect('/vaccines');
});

router.get('/vaccines', isAuthenticated, async (req, res) => {
    const user = await User.findById(req.user.id).lean();
    if (user.role === ADMINISTRADOR) {
        const vaccines = await Vaccine.find({}).lean().sort({ date: 'desc' });
        return res.render('vaccines/all-vaccines', { vaccines });
    }
    const vaccines = await Vaccine.find({ user: req.user.id }).lean().sort({ date: 'desc' });
    res.render('vaccines/all-vaccines', { vaccines });
});

router.get('/users/miperfil', isAuthenticated, async (req, res) => {
    const usuarios = await User.find({ email: req.user.email }).lean();
    res.render('users/miperfil', { usuarios });
});

router.get('/users/miperfil/edit/:id', isAuthenticated, async (req, res) => {
    const usuari = await User.findById(req.params.id).lean();
    res.render('users/edit', { usuari });
});

router.put('/users/miperfil/edit/:id', isAuthenticated, async (req, res) => {
    const { name, email } = req.body;
    const us = await User.findByIdAndUpdate(req.params.id, { name, email });
    req.flash('success_msg', 'Datos actualizados correctamente');
    res.redirect('/users/miperfil');
});


router.get('/vaccines/edit/:id', isAuthenticated, async (req, res) => {
    const vaccine = await Vaccine.findById(req.params.id).lean();
    res.render('vaccines/edit-vaccine', { vaccine });
});

router.put('/vaccines/edit-vaccine/:id', isAuthenticated, async (req, res) => {
    const { date } = req.body;
    await Vaccine.findByIdAndUpdate(req.params.id, { date });
    req.flash('success_msg', 'Vacuna actualizada correctamente');
    res.redirect('../');
});

router.delete('/vaccines/delete/:id', isAuthenticated, async (req, res) => {
    await Vaccine.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Vacuna eliminada correctamente');
    res.redirect('../');
});

//aplicar vacuna
router.post('/vaccines/aplicarvacuna/:id', isAuthenticated, async (req, res) => {
    const { vacName, sede, turnoID } = req.body;
    const vacunador = await User.findById(req.user.id);
    const tur = await Turno.findByIdAndUpdate(turnoID, { applied: true });
    const newVaccine = new Vaccine();

    const fullname = vacunador.name + ' ' + vacunador.surname;
    newVaccine.name = vacName;
    newVaccine.user = req.params.id;
    newVaccine.date = Date.now();
    newVaccine.place = sede;
    newVaccine.lot = null;
    newVaccine.labName = null;
    newVaccine.vaccinator = fullname;
    await newVaccine.save();
    req.flash('success_msg', 'La vacuna ha sido aplicada.');
    res.render('./users/vacunador/cargar-datos-vacuna', { newVaccine });
});

router.put('/users/vacunador/cargar-datos-vacuna/:id', isAuthenticated, async (req, res) => {
    const { lot, labName } = req.body;
    const vacuna = await Vaccine.findByIdAndUpdate(req.params.id, { lot: lot, labName: labName });
    req.flash('success_msg', 'Se guardaron los datos de la vacuna');
    res.redirect('/users/vacunador/selector-sede');

});

//aplicar vacuna - desde 'buscar paciente' 
router.post('/vaccines/aplicarvacuna2/:id', isAuthenticated, async (req, res) => {
    const vacunador = await User.findById(req.user.id);
    const paciente = await User.findById(req.params.id);

    res.render('./users/vacunador/cargar-datos-vacuna2', { paciente });
});

router.put('/users/vacunador/cargar-datos-vacuna2/:id', isAuthenticated, async (req, res) => {
    const { name, labName, lot, vaccinator, place, date } = req.body;
    const errors = [];
    if (!name) {
        errors.push({ text: 'Debe elegir una vacuna' });
    } else {
        const vaccineName = await Vaccine.findOne({ name: name, user: req.params.id });
        if (vaccineName) {
            req.flash('error', 'La vacuna ya se encuentra registrada');
            res.redirect('/users/vacunador/buscar-paciente');
        } else {
            const newVaccine = new Vaccine({ name, date, place, lot, labName, vaccinator });
            newVaccine.user = req.params.id;
            await newVaccine.save();
            req.flash('success_msg', 'Se ha registrado una nueva vacuna.');
            res.redirect('/users/vacunador/buscar-paciente');
        }

    }

});

//buscar vacunas de un paciente
router.post('/vaccines/buscar-vacunas/:id', isAuthenticated, async (req, res) => {
    const paciente = await User.findById(req.params.id);
    const vacunas = await Vaccine.find({user: paciente.id}); 
    res.render('./users/vacunador/mostrar-vacunas', { paciente, vacunas });
});

module.exports = router;