// basic imports
const config = require('./config.json');
const consola = require('consola');

// configure database
const mongoose = require('mongoose');
mongoose.connect(config.database.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const pasteModel = require('./models/pastes');

mongoose.connection.on('connected', () => consola.success('Connected to MongoDB'));
mongoose.connection.on('disconnected', () => consola.error('Disconnected from MongoDB'));
mongoose.connection.on('reconnected', () => consola.success('Reconnected to MongoDB'));

// configure authentication
const { auth, requiresAuth } = require('express-openid-connect');
const authconfig = {
    authRequired: false,
    auth0Logout: true,
    baseURL: config.auth.baseURL,
    clientID: config.auth.clientID,
    issuerBaseURL: config.auth.issuerBaseURL,
    secret: config.auth.secret,
    routes: {
        login: false,
    }
}

// configure web server
const express = require('express');
const session = require('express-session');
const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

app.use(express.urlencoded({ extended: false }));
app.use(session({
    resave: false,
    secret: 'keyboard cat',
}));

// attach auth to web server
app.use(auth(authconfig));

// define functions
const redirectIfLoggedIn = (req, res, next) => {
    if (req.oidc.isAuthenticated()) {
        res.redirect('/');
    } else {
        next();
    }
}

const authRedirect = (req, res, next) => {
    if (req.oidc.isAuthenticated()) {
        next();
    } else {
        res.redirect('/login');
    }
}

// routes
app.get('/', authRedirect, (req, res) => res.render('index', { user: req.oidc.user }));
app.get('/template', authRedirect, (req, res) => res.render('template', { user: req.oidc.user }));

// auth routes
app.get('/login',  redirectIfLoggedIn, (req, res) => res.render('auth/login'));
app.get('/api/auth/login', redirectIfLoggedIn, (req, res) => res.oidc.login({ returnTo: '/paste/new' }));

// api routes
app.get('/api/pastes/recent', authRedirect, (req, res) => {
    
});

app.listen(config.web.port, () => consola.success(`Webserver started on port ${config.web.port}`));
