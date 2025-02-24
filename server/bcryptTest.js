const bcrypt = require("bcryptjs");

bcrypt.hash("securepassword123", 10).then((hash) => {
  console.log("Hashed Password:", hash);
});