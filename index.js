// basic imports
require('dotenv').config();
const config = require('./config.json');
const consola = require('consola');

// configure database
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL, {
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

// attach cookie parser to web server
app.use(require('cookie-parser')());

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
        if (req.originalUrl.substring(0, 4) !== '/api') res.cookie('redirect', req.originalUrl);
        res.redirect('/login');
    }
}

// main routes
app.get('/', (req, res) => res.render('index', { user: req.oidc.user }));
app.get('/template', authRedirect, (req, res) => res.render('template', { user: req.oidc.user }));

// paste routes
app.get('/paste/new', authRedirect, (req, res) => res.render('paste/new', { user: req.oidc.user }));
app.get('/paste/your', authRedirect, (req, res) => res.render('paste/your', { user: req.oidc.user }));
app.get('/paste/:id', (req, res) => {
    pasteModel.findById(req.params.id, (err, paste) => {
        if (err) {
            res.render('paste/invalid');
        } else {
            if (!paste) return res.render('paste/invalid', { user: req.oidc.user });
            if (paste.visibility === 'private') {
                if (!req.oidc.user) {
                    return authRedirect(req, res);
                } else if (req.oidc.user.sub.slice(6) !== paste.user.id) {
                    return res.render('paste/invalid', { user: req.oidc.user });
                }
            }
            res.render('paste/view', { paste: paste, user: req.oidc.user });
        }
    });
});

// auth routes
app.get('/login',  redirectIfLoggedIn, (req, res) => res.render('auth/login', { user: req.oidc.user }));
app.get('/api/auth/login', redirectIfLoggedIn, (req, res) => {
    if (!req.cookies['redirect']) {
        res.oidc.login({ returnTo: '/paste/new' })
    } else {
        res.oidc.login({ returnTo: req.cookies['redirect'] });
        res.clearCookie('redirect');
    }
});

// api routes
app.get('/api/pastes/recent/public', (req, res) => {
    pasteModel.find({ visibility: 'public' }, (err, pastes) => {
        let count = 0;
        let recent = [];
        pastes.forEach(paste => {
            if (count < 6) {
                recent.push(paste);
                count++;
            } else {
                return;
            }
        });
        res.json(recent.reverse());
    });
});
app.get('/api/pastes/currentuser', authRedirect, (req, res) => {
    let usersearch = {
        id: req.oidc.user.sub.slice(6),
        name: req.oidc.user.nickname,
    }
    pasteModel.find({ user: usersearch}, (err, pastes) => {
        res.json(pastes.reverse());
    });
});
app.get('/api/pastes/all', authRedirect, (req, res) => {
    pasteModel.find({}, (err, pastes) => {
        res.json(pastes.reverse());
    });
});
app.post('/api/pastes', authRedirect, (req, res) => {
    let paste = new pasteModel({
        user: {
            id: req.oidc.user.sub.slice(6),
            name: req.oidc.user.nickname,
        },
        title: req.body.title,
        content: req.body.content,
        visibility: req.body.visibility,
    });
    paste.save();

    res.send(paste);
});
app.delete('/api/pastes/:id', authRedirect, (req, res) => {
    pasteModel.findByIdAndDelete(req.params.id, (err, paste) => {
        res.send(paste);
    });
});
app.get('/api/version', (req, res) => res.send({ version: config.ver }));

app.listen(config.web.port, () => consola.success(`Webserver started on port ${config.web.port}`));
