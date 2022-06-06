const express = require('express');
const res = require('express/lib/response');
const router = express.Router();

const Vaccine = require('../models/Vaccine');
const { isAuthenticated } = require('../helpers/auth');
const User = require('../models/User');
const Turno = require('../models/Turnos');

const { ADMINISTRADOR } = require('../helpers/Roles');
const Turnos = require('../models/Turnos');


//solictar turno
router.get('/turns/solicitar', isAuthenticated, (req, res) => {
    res.render('turns/solicitar')
});

router.post('/turns/solicitar', isAuthenticated, async (req, res) => {
    const { vaccineName }= req.body ;
    const errors = [];
    if(!vaccineName){
        errors.push({text: 'Por favor seleccione una vacuna'});
    } else {
        
        const vaccName = await Turno.findOne( {vaccineName : vaccineName, user : req.user.id});
        const vaccAplied= await Vaccine.findOne({name : vaccineName, user : req.user.id})
        if(vaccName){
            req.flash('error', 'Usted ya tiene un turno para esta vacuna');
            res.redirect('/turns/misturnos'); 
        }else{
            if(vaccAplied){
                req.flash('error', 'Ya tiene aplicada esta vacuna, no puede solicitar un turno');
                res.redirect('/turns/misturnos'); 
            }else{
                const newTurno = new Turno();
                newTurno.vaccineName=vaccineName;
                newTurno.user = req.user.id;
                newTurno.appointed = false;
                newTurno.attended = false;
                newTurno.orderDate= null;
                await newTurno.save();
                req.flash('success_msg', 'turno agregado correctamente');
                res.redirect('/turns/misturnos');
            }
        }
    }
});

router.get('/turns/turnosPasados', isAuthenticated, async (req, res) => {
    const turnos = await Turno.find({user: req.user.id, attended: true}).lean().sort('desc');
    res.render('turns/misturnospasados', { turnos });
});

router.get('/turns/turnosVigentes', isAuthenticated, async (req, res) => {
    const turnos = await Turno.find({user: req.user.id, attended : false}).lean().sort('desc');
    res.render('turns/misturnosvigentes', { turnos});
});

router.get('/turns/misturnos', isAuthenticated, async (req, res) => {
    const turnos = await Turno.find({user: req.user.id}).lean().sort({date: 'desc'});
    res.render('turns/misturnos', { turnos });
});

router.delete('/turns/delete/:id', isAuthenticated, async (req, res) => {
    await Turno.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Turno eliminado correctamente');
    res.redirect('/turns/misturnos');
});

//cancelar turno
router.delete('/turns/cancel/:id', isAuthenticated, async (req, res) => {
    const {orderDate} = await Turno.findById(req.params.id);
    if (orderDate > Date.now()){
        await Turno.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Turno cancelado correctamente');
        res.redirect('/turns/misturnos');
    }else{
        req.flash('error', 'Los turnos deben cancelarse con 24hs de anticipación.');
        res.redirect('/turns/misturnos');
    }
});

//turnos hoy - vacunador

router.get('/turns/turnos-hoy', isAuthenticated, async (req, res) => {
    let resultado = await Turno.aggregate([
        {
            $lookup: {
                from:'users',
                localField:'user',
                foreignField:'_id',
                as:'turnoUsuario'
            }
        },
        { $unwind: "$turnoUsuario"}
    ]); 
    const fecha = new Date(Date.now()).setHours(0,0,0,0); 
    resultado = resultado.filter(r => r.orderDate !== null).filter(r => r.orderDate.setHours(0,0,0,0) === fecha); 
    res.render('turns/turnoshoy', {resultado});
});

module.exports = router;