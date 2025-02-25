const bcrypt = require('bcryptjs');

const password = 'securepassword123'; // Use the actual password you want
const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync(password, salt);

console.log('Hashed Password:', hashedPassword);
