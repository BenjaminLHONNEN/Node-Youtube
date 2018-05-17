const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');
const session = require('express-session');
const request = require('request');

const {db, User, Follows} = require('./DB');
const {COOKIE_SECRET, YOUTUBE_API_KEY} = require('./const');

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cookieParser(COOKIE_SECRET));
app.use(session({
    secret: COOKIE_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Initialize passport, it must come after Express' session() middleware
app.use(passport.initialize());
app.use(passport.session());


app.get('/', (req, res) => {
    if (req.user !== undefined && req.user !== null) {
        res.render('index', {user: req.user.dataValues});
    } else {
        res.redirect("/login");
    }
});
app.get('/following', (req, res) => {
    if (req.user !== undefined && req.user !== null) {
        res.render("following");
    } else {
        res.redirect("/login");
    }
});
app.get('/apit/get/following', (req, res) => {
    if (req.user !== undefined && req.user !== null) {
        Follows
            .sync()
            .then(() => {
                return Follows
                    .findAll({
                        where: {
                            userId: req.user.id,
                        }
                    })
            })
            .then((channelsIds) => {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(channelsIds));
            });
    } else {
        res.redirect("/login");
    }
});


function getChannelInfo(channelId, cb) {
    const url = "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=" + channelId + "&key=" + YOUTUBE_API_KEY;
    return request({
        headers: {
            'User-Agent': 'Node App',
        },
        uri: url
    }, (err, response, body) => {
        if (err) {
            return cb(err, response, body);
        } else if (Math.floor(response.statusCode / 100) === 2) {
            return cb(null, response, body);
        } else {
            return cb(null, response, body);
        }
    });
}

function getVideosInfo(videosIds, cb) {
    const url = "https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,player&id=" + videosIds.toString() + "&key=" + YOUTUBE_API_KEY;
    request({
        headers: {
            'User-Agent': 'Node App',
        },
        uri: url
    }, (err, response, body) => {
        if (err) {
            cb(err, response, body);
        } else if (Math.floor(response.statusCode / 100) === 2) {
            cb(null, response, body);
        } else {
            cb(err, response, body);
        }
    });
}

app.get('/api/post/follow-:channelId', (req, res) => {
    if (req.user !== undefined && req.user !== null && req.params.channelId !== undefined && req.params.channelId !== null) {
        Follows
            .sync()
            .then(() => {
                return Follows.findOne({
                    where: {
                        userId: req.user.id,
                        channelId: req.params.channelId,
                    }
                })
            })
            .then((follow) => {
                if (follow === null) {
                    Follows.create({
                        userId: req.user.id,
                        channelId: req.params.channelId,
                    });
                    res.sendStatus(200);
                } else {
                    res.sendStatus(403);
                }
            });
    } else {
        res.sendStatus(403);
    }
});

app.get('/api/get/channels-:search', (req, res) => {
    // "https://www.googleapis.com/youtube/v3/search?key="+ YOUTUBE_API_KEY +"&q=" + req.params.search+"&maxResults=10&type=channel&part=snippet"
    const url = "https://www.googleapis.com/youtube/v3/search?key=" + YOUTUBE_API_KEY + "&q=" + req.params.search + "&maxResults=10&type=channel&part=snippet";
    request({
        headers: {
            'User-Agent': 'Node App',
        },
        uri: url
    }, (err, response, body) => {
        console.log(response.statusCode);
        console.log(url);
        if (err) {
            console.error(err);
        } else if (Math.floor(response.statusCode / 100) === 2) {

            let channels = JSON.parse(body);

            let urlChannels = "https://www.googleapis.com/youtube/v3/channels?key=" + YOUTUBE_API_KEY + "&part=id,snippet,statistics&id=";
            channels.items.forEach(function (value, index, array) {
                console.log(value.snippet.title + " | " + value.id.channelId);
                urlChannels += (value.id.channelId);
                if (index !== array.length - 1) {
                    urlChannels += ",";
                }
            });

            request({
                headers: {
                    'User-Agent': 'Node App',
                },
                uri: urlChannels
            }, (err, response, body) => {
                if (err) {
                } else if (Math.floor(response.statusCode / 100) === 2) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(body);
                } else {
                    res.sendStatus(500);
                }
            });
        } else {
            res.sendStatus(500);
        }
    });
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}));

app.get('/login', (req, res) => {
    // Render the login page
    res.render('login');
});

app.get('/register', (req, res) => {
    // Render the login page
    res.render('register');
});
app.post('/register', (req, res) => {
    User
        .sync()
        .then(() => {
            return User.create({
                mail: req.body.mail,
                password: req.body.password,
                userName: req.body.userName,
            });
        })
        .then((user) => {
            user = user.dataValues;
            console.error(user);
            req.login(user, function (err) {
                if (err) {
                    console.error(err);
                    res.redirect('/register');
                } else {
                    res.redirect('/');
                }
            });
        })
        .catch(() => {
            res.send(500);
        });
});


passport.serializeUser((user, cb) => {
    cb(null, user.mail);
});
passport.deserializeUser((mail, cb) => {
    // Get a user from a cookie's content: his email
    User
        .findOne({where: {mail}})
        .then((user) => {
            cb(null, user);
        })
        .catch(cb);
});

passport.use(new LocalStrategy((mail, password, done) => {
    User
        .findOne({where: {mail}})
        .then(function (user) {
            if (user && user.dataValues.password !== password) {
                user = user.dataValues;
                // User not found or an invalid password has been provided
                return done(null, false, {
                    message: 'Invalid credentials'
                });
            }

            // User found
            return done(null, user);
        })
        // If an error occured, report it
        .catch(done);
}));

app.listen(3000);
