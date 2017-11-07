const parseCookies = (req, res, next) => {
  if (req.headers.cookie !== undefined) {
    var c = req.headers.cookie.split('; ');
    for (var cookie of c) {
      var keyValue = cookie.split('=');
      req.cookies[keyValue[0]] = keyValue[1]; 
    }
  }
  next();
};

module.exports = parseCookies;