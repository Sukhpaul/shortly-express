const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const parseCookies = require('./middleware/cookieParser.js');

const app = express();

var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10 // Seconds.
};

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(parseCookies);


app.post('/signup', (req, res, next) => {
  
  var username = req.body.username;
  var password = req.body.password;
  //if user exist redirect to signup
  models.Users.get({username})
  .then((user) => {
    if (user) {
      res.redirect('/signup');
    } else { 
      models.Users.create({username, password})
      .then(() => {
  
        models.Users.get({username})
        .then(result => {
          req.session.user = {};
          req.session.user.username = username;
          req.session.userId = result.id;
          models.Sessions.update({hash: req.session.hash}, {userId: result.id}).then((data) => {
            res.redirect('/');        
          }); 
        });
      });
    }
  });

});

app.get('/logout', (req, res, next) => {
  console.log('---------------------');
  if (models.Sessions.isLoggedIn(req.session)) {
    //console.log('deeeeeeeeeeeeeeeeeeeeeeeeeeeee');
    models.delete({hash: req.session.hash})
    .then(() => {
      res.redirect('/login');
    });
  }
});


app.post('/login', (req, res, next) => {
  var username = req.body.username;
  var password = req.body.password;
  
  var user = models.Users.get({username})
  .then((user) => {
    if (user) {
      if (models.Users.compare(password, user.password, user.salt)) {
        res.redirect('/');
      } else {
        res.redirect('/login');
      }
    } else {
      res.redirect('/login');
    }
  });
});

app.get('/', 
(req, res) => {
  res.render('index');
});

app.get('/create', 
(req, res) => {
  res.render('index');
});

app.get('/links', 
(req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post('/links', 
(req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
