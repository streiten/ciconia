/**
 * GET /
 * Home page
 */
 
exports.home = (req, res) => {
  res.render('home', {
    title: 'Home'
  });
};


/**
 * GET /
 * 404
 */
 
exports.notfound = (req, res) => {
  res.render('404', {
    title: '404'
  });
};
