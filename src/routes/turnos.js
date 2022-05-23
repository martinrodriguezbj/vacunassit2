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
    const { vaccineName }= req.body ;
    console.log('nombre turno:',vaccineName);
    const errors = [];
    if(!vaccineName){
        errors.push({text: 'Por favor seleccione una vacuna'});
    } else {
        
        const vaccName = await Turno.findOne( {vaccineName : vaccineName, user : req.user.id});
        const vaccAplied= await Vaccine.findOne({name : vaccineName, user : req.user.id})
        //console.log('nombre:',vaccName); 
        if(vaccName){
            req.flash('error_msg', 'Ya tiene un turno pendiente para esta vacuna');
            res.redirect('/turns/misturnos'); 
        }else{
            if(vaccAplied){
                req.flash('error_msg', 'Ya tiene aplicada esta vacuna, no puede solicitar un turno');
                res.redirect('/turns/misturnos'); 
            }else{
                const newTurno = new Turno();
                newTurno.vaccineName=vaccineName;
                newTurno.user = req.user.id;
                newTurno.appointed = false;
                newTurno.attended = false;
                newTurno.orderDate=null;
                console.log(newTurno);
                await newTurno.save();
                req.flash('succes_msg', 'turno agregado correctamente');
                res.redirect('/turns/misturnos');
            }
        }
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