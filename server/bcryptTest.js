const bcrypt = require("bcryptjs");

const password = "securepassword1234!"; // ✅ Change this to the password you want
const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync(password, salt);

console.log("Hashed Password:", hashedPassword);
