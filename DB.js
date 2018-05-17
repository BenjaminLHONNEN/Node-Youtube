const mysql2 = require('mysql2');
const Sequelize = require('sequelize');


const db = new Sequelize('youtube', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

const User = db.define('user', {
    mail: {type: Sequelize.STRING},
    password: {type: Sequelize.STRING},
    userName: {type: Sequelize.STRING},
});

const Follows = db.define('follow', {
    userId: {type: Sequelize.INTEGER},
    channelId: {type: Sequelize.STRING},
});

User.hasMany(Follows, {foreignKey: 'userId'});
Follows.belongsTo(User, {foreignKey: 'userId'});

User.sync();
Follows.sync();

module.exports = {
    User: User,
    Follows: Follows,
    db: db,
};