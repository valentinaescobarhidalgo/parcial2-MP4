const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const Ticket = require('./models/Ticket');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'claveSecretaClaseNode2026',
    resave: false,
    saveUninitialized: false
}));

function requireAdmin(req, res, next) {
    if (req.session.loginAdmin) {
        return next();
    }

    res.redirect('/login');
}

app.get('/', (req, res) => {
    res.render('inicio', {
        titulo: 'Inicio',
        paginaactual: 'inicio',
        loginAdmin: req.session.loginAdmin
    });
});

app.get('/reportar', (req, res) => {
    res.render('reportar', {
        titulo: 'Reportar una falla',
        paginaactual: 'reportar',
        mensajeServidor: null,
        loginAdmin: req.session.loginAdmin
    });
});

app.post('/reportar', async (req, res) => {
    try {
        await Ticket.create({
            nombre: req.body.nombre,
            ubicacion: req.body.ubicacion,
            descripcion: req.body.descripcion
        });

        res.render('reportar', {
            titulo: 'Reportar una falla',
            paginaactual: 'reportar',
            mensajeServidor: `¡Gracias ${req.body.nombre}! Tu reporte fue registrado correctamente.`,
            loginAdmin: req.session.loginAdmin
        });
    } catch (error) {
        console.error('Error al guardar el ticket:', error);
        res.status(500).render('reportar', {
            titulo: 'Reportar una falla',
            paginaactual: 'reportar',
            mensajeServidor: 'Hubo un problema al guardar tu reporte.',
            loginAdmin: req.session.loginAdmin
        });
    }
});

app.get('/login', (req, res) => {
    if (req.session.loginAdmin) {
        return res.redirect('/panel');
    }

    res.render('login', {
        titulo: 'Acceso Administrador',
        paginaactual: 'login',
        errorLogin: null,
        loginAdmin: false
    });
});

app.post('/login', (req, res) => {
    if (req.body.usuario !== 'admin' || req.body.contrasena !== '12345') {
        return res.status(401).render('login', {
            titulo: 'Acceso Administrador',
            paginaactual: 'login',
            errorLogin: 'Usuario o contraseña incorrectos',
            loginAdmin: false
        });
    }

    req.session.regenerate((error) => {
        if (error) {
            console.error('Error al iniciar sesión:', error);
            return res.status(500).send('No se pudo iniciar sesión.');
        }

        req.session.loginAdmin = true;
        res.redirect('/panel');
    });
});

function cerrarSesion(req, res) {
    req.session.destroy((error) => {
        if (error) {
            console.error('Error al cerrar sesión:', error);
            return res.status(500).send('No se pudo cerrar la sesión.');
        }

        res.clearCookie('connect.sid');
        res.redirect('/');
    });
}

app.get('/logout', cerrarSesion);
app.post('/logout', cerrarSesion);

app.get('/panel', requireAdmin, async (req, res) => {
    try {
        const mensajes = await Ticket.find().sort({ fecha: -1 });
        res.render('panel', {
            titulo: 'Panel de Tickets',
            paginaactual: 'panel',
            mensajes,
            loginAdmin: true
        });
    } catch (error) {
        console.error('Error al cargar los tickets:', error);
        res.status(500).send('No se pudieron cargar los tickets.');
    }
});

app.post('/panel/resolver', requireAdmin, async (req, res) => {
    try {
        await Ticket.findByIdAndDelete(req.body.id);
        res.redirect('/panel');
    } catch (error) {
        console.error('Error al resolver el ticket:', error);
        res.status(500).send('No se pudo resolver el ticket.');
    }
});

app.get('/admin', requireAdmin, (req, res) => res.redirect('/panel'));

async function iniciarServidor() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/escuelaFullstack');
        console.log('Conectado exitosamente a MongoDB');
        app.listen(port, () => {
            console.log(`Servidor escuchando en http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        process.exitCode = 1;
    }
}

iniciarServidor();
