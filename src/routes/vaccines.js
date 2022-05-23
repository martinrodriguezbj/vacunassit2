const express = require('express');
const res = require('express/lib/response');
const router = express.Router();

const Vaccine = require('../models/Vaccine');
const { isAuthenticated } = require('../helpers/auth');
const User = require('../models/User');
const { ADMINISTRADOR } = require('../helpers/Roles');

router.get('/vaccines/add', isAuthenticated, (req, res) => {
    res.render('vaccines/new-vaccines');
});

router.post('/vaccines/new-vaccines', isAuthenticated, async (req, res) => {
    const { name } = req.body;
    console.log(name);
    const errors = [];
    if (!name){
        errors.push({text: 'Debe elegir una vacuna'});
    
    // if(errors.length > 0){
    //     res.render('vaccines/all-vaccines', {errors, name, dosis});
    //
    } else {
        console.log(req.user.id);
        const vaccineName = await Vaccine.findOne( { name: name, user: req.user.id}); 
        //    const vaccineDose = await Vaccine.findOne({dosis:dosis});
        if (vaccineName){// && vaccineDose){
            console.log('vacuna ya registrada');
            req.flash('error_msg', 'La vacuna ya se encuentra registrada');
        }else {
            const newVaccine = new Vaccine({name});
            newVaccine.user = req.user.id;
            newVaccine.place = null; 
            newVaccine.lot = null; 
            newVaccine.date = null; 
            await newVaccine.save();
            req.flash('succes_msg', 'Se ha registrado una nueva vacuna.');
        }    res.redirect('/vaccines');
    }
});


router.get('/vaccines', isAuthenticated, async (req, res) => {
    // Si el usuario es administrador, muestra todas las vacunas
    //console.log(req.user);
    //console.log(req.user.id);
    const user = await User.findById(req.user.id).lean();
    if (user.role === ADMINISTRADOR) {
        const vaccines = await Vaccine.find({}).lean().sort({date: 'desc'});
        return res.render('vaccines/all-vaccines', { vaccines });
    }
    const vaccines = await Vaccine.find({user: req.user.id}).lean().sort({date: 'desc'});
    res.render('vaccines/all-vaccines', { vaccines });
});

router.get('/users/miperfil', async (req, res) => {
    const usuarios = await User.find({email: req.user.email}).lean();
    res.render('users/miperfil', {usuarios});
});

router.get('/users/miperfil/edit/:id', isAuthenticated, async (req, res) => {
    const usuari = await User.findById(req.params.id).lean();
    console.log(req.params.id);
    res.render('users/edit', {usuari});
}); 

router.put('/users/miperfil/edit/:id', isAuthenticated, async (req, res) => {
    const { name, email }= req.body;
    const us = await User.findByIdAndUpdate(req.params.id, {name, email });
    req.flash('succes_msg', 'Datos actualizados correctamente');
    res.redirect('/users/miperfil');
}); 


router.get('/vaccines/edit/:id', isAuthenticated, async (req, res) => {
    const vaccine = await Vaccine.findById(req.params.id).lean();
    res.render('vaccines/edit-vaccine', {vaccine});
}); 

router.put('/vaccines/edit-vaccine/:id', isAuthenticated, async (req, res) => {
    const { name, dosis }= req.body;
    await Vaccine.findByIdAndUpdate(req.params.id, {name,dosis});
    req.flash('succes_msg', 'Vacuna actualizada correctamente');
    res.redirect('../');
}); 

router.delete('/vaccines/delete/:id', isAuthenticated, async (req, res) => {
    await Vaccine.findByIdAndDelete(req.params.id);
    req.flash('succes_msg', 'Vacuna eliminada correctamente');
    res.redirect('../');
});

module.exports = router;