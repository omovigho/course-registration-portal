function nowUtc() {
  return new Date().toISOString();
}

module.exports = {
  nowUtc,
};
