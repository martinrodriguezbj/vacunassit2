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
    const { turnoName } = req.body;
    console.log(turnoName);
    const errors = [];
    if(!turnoName){
        errors.push({text: 'Por favor seleccione un turno'});
    } else {
        console.log(req.user.id);
        const turnoName = await Turno.findOne( { vaccineName: turnoName,  user: req.user.id}); 
        //    const vaccineDose = await Vaccine.findOne({dosis:dosis});
        if (turnoName){// && vaccineDose){
            console.log('turno ya solicitado');
            req.flash('error_msg', 'La vacuna ya se encuentra registrada');
            console.log(dosis);  
    } else {
       //const vaccine = Vaccine.findOne( );  
       const newTurno = new Turno({ vaccineName });
       newTurno.user = req.user.id;
       newTurno.appointed = false;
       newTurno.attended = false;
       newTurno.orderDate=null;
       console.log(newTurno);
       await newTurno.save();
       req.flash('succes_msg', 'turno agregado correctamente');
      }  res.redirect('/turns/misturnos');
    }
});

router.get('/turns/misturnos', isAuthenticated, async (req, res) => {
    const turnos = await Turno.find({user: req.user.id}).lean().sort({date: 'desc'});
    res.render('turns/misturnos', { turnos });
});

router.delete('/turns/delete/:id', isAuthenticated, async (req, res) => {
    await Turno.findByIdAndDelete(req.params.id);
    req.flash('succes_msg', 'Turno eliminado correctamente');
    res.redirect('/turns/misturnos');
});

module.exports = router;