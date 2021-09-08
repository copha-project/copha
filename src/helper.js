const IsDev = process.env.NODE_ENV && process.env.NODE_ENV === "development" || process.env.COPHA_DEBUG
const IsPro = process.env.NODE_ENV === 'production'

module.exports = {
    IsDev,
    IsPro
}
