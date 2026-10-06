(function () {
  var host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    window.__CCIDP_API_BASE_URL__ = 'http://127.0.0.1:8080/ccidp';
    return;
  }
  var parts = String(host || '').split('.');
  var numbers = parts.map(function (part) { return Number(part); });
  var privateIp = parts.length === 4 && numbers.every(function (value) {
    return Number.isInteger(value) && value >= 0 && value <= 255;
  }) && (
    numbers[0] === 10 ||
    (numbers[0] === 192 && numbers[1] === 168) ||
    (numbers[0] === 172 && numbers[1] >= 16 && numbers[1] <= 31) ||
    (numbers[0] === 169 && numbers[1] === 254)
  );
  if (privateIp) {
    window.__CCIDP_API_BASE_URL__ = 'http://' + host + ':8080/ccidp';
    return;
  }
  window.__CCIDP_API_BASE_URL__ = window.__CCIDP_API_BASE_URL__ || 'https://ccidp-backend.onrender.com';
})();
