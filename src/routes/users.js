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
}));

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
            req.flash('error', 'El dni se encuentra en uso');
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
router.get('/users/miperfil',isAuthenticated, async (req, res) => {
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
});

//hasta acá

//comprobante

router.get('/users/signup', (req, res) => {
    res.render('users/signup')
});

//Recuperar contraseña 
router.get('/users/pass-recovery', (req,res) => {
    res.render('./users/password-recovery');
});    

router.post('/users/password-recovery', async (req,res) => {
    const  user = await User.find(req.body);
    console.log(user); 
    if(Object.entries(user) == 0){
        req.flash('error', 'DATOS INVALIDOS. Vuelva a intentarlo.');
        res.render('./users/signin'); 

    }else{
        const contra = user['0'].contra;
        req.flash('success_msg', 'Su contraseña es: '+contra);
        res.redirect('/users/signin');
    }
}); 

// NO ANDA - QUEDA PARA LA PRÓXIMA 
router.get('/users/edit-pass', isAuthenticated, async (req, res) => {
    const user = await User.find({dni: req.user.dni}).lean();
    //console.log(user); 
    const usuari = await User.findById(req.params.id).lean();
    //console.log(usuari['0'].id);
    res.render('./users/edit-pass', {usuari});

});

router.put('/users/edit-pass/:id', isAuthenticated, async (req, res) => {
    const { contra }= req.body;
    //actualiza contra
    await User.findByIdAndUpdate(req.params.id, {contra});
    console.log(req.params.id+' es el ide')
    //actualiza password
    const u = await User.findById(req.params.id);
    //console.log(u);

    const password = await u.encryptPassword(contra);
    await User.findByIdAndUpdate(req.params.id, {password});
    await newUser.save();
    //informa y redirecciona
    req.flash('success_msg', 'Contraseña actualizada');
    res.redirect('/users/miperfil');
}); 

router.put('/users/miperfil/edit/:id', isAuthenticated, async (req, res) => {
    const { name, surname, dni, address, email }= req.body;
    const us = await User.findByIdAndUpdate(req.params.id, {name, surname, dni, address, email });
    //console.log({name});
    req.flash('success_msg', 'Datos actualizados correctamente');
    res.redirect('/users/miperfil');
});



//validar identidad
router.get('/users/valid-id',isAuthenticated, async (req, res) => {
    const usuarios = await User.find({dni: req.user.dni}).lean();
    console.log(usuarios);
    req.flash('success_msg', 'Identidad de ',usuarios['0'].name,' ',usuarios['0'].surname,' validada.');
    //res.redirect('/users/miperfil');
//});    
     res.render('users/valid-id',{usuarios});
 });


router.get('users/valid-id/:id', isAuthenticated, async  (req, res) => {
    const usuari = await User.findById(req.params.id).lean();
    console.log('Usuario del 2do metodo: '+usuari);
    //res.render('./users/edit-pass', {usuari});
    req.flash('success_msg', 'Identidad de ',usuari['0'].name,' ',usuari['0'].surname,' validada.');
    res.redirect('/users/miperfil');
});
module.exports = router;