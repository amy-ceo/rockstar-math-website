const bcrypt = require("bcryptjs");

const storedHash = "$2b$10$96B6Rc575iws.9aiD2K6yOtp0kwz2yKZFBGF.G4KlCZdJYUdtNToy"; // Paste your stored hash from MongoDB
const enteredPassword = "hello123"; // Use the exact password you’re entering in the login form

bcrypt.compare(enteredPassword, storedHash).then((result) => {
    console.log("✅ Password Match Result:", result);
});
