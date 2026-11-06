
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Ruta del archivo JSON
const RUTA_JSON = path.join(__dirname, 'tickets.json');

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para recibir datos de formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Bootstrap instalado localmente
app.use('/bootstrap', express.static(
    path.join(__dirname, 'node_modules/bootstrap/dist')
));

// Función para leer los tickets
function leerTickets() {
    if (!fs.existsSync(RUTA_JSON)) {
        fs.writeFileSync(RUTA_JSON, '[]', 'utf-8');
    }

    const datos = fs.readFileSync(RUTA_JSON, 'utf-8');

    return JSON.parse(datos);
}

// ===================================
// RUTA INICIO (GET /)
// ===================================

app.get('/', (req, res) => {

    res.render('inicio', {
        titulo: 'Inicio',
        paginaactual: 'inicio'
    });

});

// ===================================
// RUTA REPORTAR (GET /reportar)
// ===================================

app.get('/reportar', (req, res) => {

    res.render('reportar', {
        titulo: 'Reportar una falla',
        paginaactual: 'reportar',
        mensajeServidor: null
    });

});

// ===================================
// RUTA REPORTAR (POST /reportar)
// ===================================

app.post('/reportar', (req, res) => {

    const nombreUsuario = req.body.nombre;
    const ubicacionUsuario = req.body.ubicacion;
    const descripcionUsuario = req.body.descripcion;

    const nuevoTicket = {

        id: Date.now(),
        nombre: nombreUsuario,
        ubicacion: ubicacionUsuario,
        descripcion: descripcionUsuario,
        fecha: new Date().toLocaleString('es-CO')

    };

    try {

        // Leemos los tickets existentes
        const mensajes = leerTickets();

        // Agregamos el nuevo reporte
        mensajes.push(nuevoTicket);

        // Convertimos el arreglo a JSON
        const datosActualizados = JSON.stringify(mensajes, null, 2);

        // Guardamos los datos
        fs.writeFileSync(RUTA_JSON, datosActualizados, 'utf-8');

        console.log('Ticket guardado correctamente');

        // Mostramos mensaje de confirmación
        res.render('reportar', {
            titulo: 'Reportar una falla',
            paginaactual: 'reportar',
            mensajeServidor: `¡Gracias ${nombreUsuario}! Tu reporte fue registrado correctamente.`
        });

    } catch (error) {

        console.error('Error al guardar el ticket:', error);

        res.status(500).render('reportar', {
            titulo: 'Reportar una falla',
            paginaactual: 'reportar',
            mensajeServidor: 'Hubo un problema al guardar tu reporte.'
        });

    }

});

// ===================================
// RUTA PANEL (GET /panel)
// ===================================

app.get('/panel', (req, res) => {

    try {

        // Leemos todos los tickets
        const mensajes = leerTickets();

        // Enviamos los datos a la vista
        res.render('panel', {
            titulo: 'Panel de Tickets',
            paginaactual: 'panel',
            mensajes: mensajes,
            total: mensajes.length
        });

    } catch (error) {

        console.error('Error al leer los tickets:', error);

        res.status(500).send('No se pudieron cargar los tickets.');

    }

});
// ===================================
// RESOLVER TICKET (POST /panel/resolver)
// ===================================

app.post('/panel/resolver', (req, res) => {

    try {

        // Recibimos el ID del ticket
        const idTicket = req.body.id;
        // Leemos los tickets existentes
        const mensajes = leerTickets();
        // Eliminamos únicamente el ticket seleccionado
        const mensajesActualizados = mensajes.filter(
            ticket => String(ticket.id) !== String(idTicket)
        );
        // Guardamos el nuevo arreglo
        fs.writeFileSync(
            RUTA_JSON,
            JSON.stringify(mensajesActualizados, null, 2),
            'utf-8'
        );
        console.log('Ticket resuelto correctamente');

        // Regresamos al panel
        res.redirect('/panel');

    } catch (error) {
        console.error('Error al resolver el ticket:', error);
        res.status(500).send('No se pudo resolver el ticket.');

    }

});

app.listen(port, () => {

    console.log(`Servidor escuchando en http://localhost:${port}`);

});
