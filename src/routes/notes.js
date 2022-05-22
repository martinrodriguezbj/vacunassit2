const express = require('express');
const res = require('express/lib/response');
const router = express.Router();

const Note = require('../models/Note');
const { isAuthenticated } = require('../helpers/auth');
const User = require('../models/User');

router.get('/notes/add', isAuthenticated, (req, res) => {
    res.render('notes/new-notes')
});


router.post('/notes/new-notes', isAuthenticated, async (req, res) => {
    const { title, description }= req.body  ;
    const errors = [];
    if(!title){
        errors.push({text: 'Por favor escriba un titulo'});
    }
    if(!description){
        errors.push({text: 'Por favor escriba una descripcion'});
    }
    if(errors.length>0){
        res.render('notes/new-notes', {
            errors,
            title,
            description
        });
    } else {
       const newNote = new Note({ title, description});
       newNote.user = req.user.id;
       await newNote.save();
       req.flash('succes_msg', 'Nota agregada correctamente');
       res.redirect('/notes');
    }
});


router.get('/notes', isAuthenticated, async (req, res) => {
    const notes = await Note.find({user: req.user.id}).lean().sort({date: 'desc'});
    res.render('notes/all-notes', { notes });
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