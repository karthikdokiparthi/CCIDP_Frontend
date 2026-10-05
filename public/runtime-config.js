(function () {
  var host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    window.__CCIDP_API_BASE_URL__ = 'http://127.0.0.1:8080/ccidp';
    return;
  }
  window.__CCIDP_API_BASE_URL__ = window.__CCIDP_API_BASE_URL__ || 'https://ccidp-backend.onrender.com';
})();
