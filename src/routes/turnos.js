const express = require('express');
const res = require('express/lib/response');
const router = express.Router();

const Vaccine = require('../models/Vaccine');
const { isAuthenticated } = require('../helpers/auth');
const User = require('../models/User');
const Turno = require('../models/Turnos');

const { ADMINISTRADOR } = require('../helpers/Roles');


//soliictar turno
router.get('/turns/solicitar', (req, res) => {
    res.render('turns/solicitar')
});

router.post('/turns/solicitar', isAuthenticated, async (req, res) => {
    const { vacuna }= req.body  ;
    const errors = [];
    if(!vacuna){
        errors.push({text: 'Por favor seleccione una vacuna'});
    } else {
       const newTurno = new Turno({ vacuna });
       newTurno.user = req.user.id;
       await newTurno.save();
       req.flash('succes_msg', 'Nota agregada correctamente');
       res.redirect('/turns/misturnos');
    }
});

router.get('/turns/misturnos', isAuthenticated, async (req, res) => {
    const turnos = await Turno.find({user: req.user.id}).lean().sort({date: 'desc'});
    res.render('turns/misturnos', { turnos });
});

module.exports = router;