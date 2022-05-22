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

    const { 
        name,
        dosis,
        place,
        date,
        lot
     }= req.body;

    const errors = [];
    
    // VALIDACIONES Q LUCAS TODAVIA NO HIZO

    if(errors.length>0){
        res.render('vaccines/new-vaccines', {
            errors,
            name,
            dosis,
            place,
            date,
            lot
        });
    } else {
       const newVaccine = new Vaccine({
            name,
            dosis,
            place,
            date,
            lot,
            user: req.user.id
        });

       await newVaccine.save();
       req.flash('succes_msg', 'Vacuna agregada correctamente');
       res.redirect('/vaccines');
    }
});


router.get('/vaccines', isAuthenticated, async (req, res) => {
    // Si el usuario es administrador, muestra todas las vacunas
    console.log(req.user);
    const user = await User.findById(req.user.id).lean();
    if (user.role === ADMINISTRADOR) {
        const vaccines = await Vaccine.find({}).lean().sort({date: 'desc'});
        return res.render('vaccines/all-vaccines', { vaccines });
    }
    const vaccines = await Vaccine.find({user: req.user.id}).lean().sort({date: 'desc'});
    res.render('vaccines/all-vaccines', { vaccines });
});

//editado por mi
router.get('/users/miperfil', async (req, res) => {
    const usuarios = await User.find({email: req.user.email}).lean();
    //console.log(usuarios);
    res.render('users/miperfil', {usuarios});
});


router.get('/users/miperfil/edit/:id', isAuthenticated, async (req, res) => {
    const usuari = await User.findById(req.params.id).lean();
    console.log(req.params.id);
    res.render('users/edit', {usuari});
})

router.put('/users/miperfil/edit/:id', isAuthenticated, async (req, res) => {
    const { name, email }= req.body;
    const us = await User.findByIdAndUpdate(req.params.id, {name, email });
    //console.log({name});
    req.flash('succes_msg', 'Datos actualizados correctamente');
    res.redirect('/users/miperfil');
})
//hasta acá



router.get('/notes/edit/:id', isAuthenticated, async (req, res) => {
    const note = await Note.findById(req.params.id).lean();
    res.render('notes/edit-note', {note});
})

router.put('/notes/edit-note/:id', isAuthenticated, async (req, res) => {
    const { title, description }= req.body;
    await Note.findByIdAndUpdate(req.params.id, {title, description});
    req.flash('succes_msg', 'Nota actualizada correctamente');
    res.redirect('/notes');
})

router.delete('/notes/delete/:id', isAuthenticated, async (req, res) => {
    await Note.findByIdAndDelete(req.params.id);
    req.flash('succes_msg', 'Nota eliminada correctamente');
    res.redirect('/notes');
});

module.exports = router;