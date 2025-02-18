RockstarMath Website - README 
Document 
Purpose of this Document 
This document serves as a guide for managing, updating, and deploying the RockstarMath 
website. It covers key areas such as the project structure, editing content, deploying via GitHub 
and Railway, updating the domain, and troubleshooting potential issues. 
1. Project Overview 
Client Name: Amy G. 
Company Name: RockstarMath 
Technology Stack: 
● Frontend: HTML, CSS (TailwindCSS, Animate.css), JavaScript (Vite.js) 
● Backend: TypeScript (Node.js) 
● Hosting: Railway 
● Version Control: GitHub 
2. Project Structure 
Below is the general structure of the RockstarMath project: 
rockstar-math/ 
├── client/                 
│   ├── dist/               
# Frontend source code 
# Production-ready compiled files 
│   ├── node_modules/       
# Installed dependencies (Do not edit manually) 
│   ├── index.html          
│   ├── assets/             
│   ├── styles/             
│   ├── scripts/            
│   ├── vite.config.js      
# Main entry HTML file 
# Images, icons, and media files 
# CSS and styling files 
# JavaScript files 
# Configuration for Vite.js 
│   ├── tailwind.config.js  # TailwindCSS configuration 
│   ├── postcss.config.js   # PostCSS configuration 
│ 
├── .git/                   
├── .gitignore              
├── README.md               
# Git repository (hidden folder) 
# Files ignored by Git 
# This documentation file 
3. Updating Content 
Editing Website Text & Images 
● HTML Content: Found in client/index.html or respective .html files in client/. 
● CSS Styling: Modify client/styles/ or TailwindCSS in 
client/tailwind.config.js. 
● Images & Icons: Located in client/assets/. 
● JavaScript Functions: Modify logic in client/scripts/. 
Running the Project Locally 
1. Install Node.js and Vite.js (if not installed): 
npm install -g vite 
Navigate to the project folder and install dependencies: 
cd rockstar-math/client 
2. npm install 
3. Start the development server: 
npm run dev 
4. Deploying via GitHub 
Pushing Updates to GitHub 
1. Ensure you are in the root project folder: 
cd rockstar-math 
2. Check the Git status: 
git status 
Add changes and commit: 
git add . 
3. git commit -m "Updated website content" 
4. Push changes to GitHub: 
git push origin main 
Pulling Latest Changes 
1. Navigate to the project folder: 
cd rockstar-math 
2. Pull the latest changes from GitHub: 
git pull origin main 
5. Railway Hosting & Management 
Deploying to Railway 
1. Log into Railway.app. 
2. Connect the GitHub repository. 
3. Click "Deploy" to push the latest changes. 
4. Monitor logs and errors via the Railway dashboard. 
Managing the Backend & Frontend 
● Frontend: Modify files in client/ and redeploy. 
● Backend: Railway handles Node.js services automatically. 
● Environment Variables: Set in the Railway dashboard under "Variables". 
6. Domain Name Setup 
Updating the Domain on Railway 
1. Go to Railway.app and select the project. 
2. Under "Settings", find "Custom Domains". 
3. Add your custom domain (e.g., rockstarmath.com). 
4. Update DNS records in your domain provider. 
Transferring the Project to the Client 
1. Add Jayla and team  as a collaborator(s) in Railway. 
2. Once Amy has full access, remove previous owners. 
3. Provide GitHub & Railway credentials for future updates. 
7. Colors & Fonts Used 
Colors Used (Hex Codes) 
● Primary Colors: #3498db, #34aadc, #3b82f6 
● Secondary Colors: #5ac8fa, #ff2d55, #f1c40f 
● Neutral Colors: #121212, #e5e7eb, #ffffff 
Fonts Used 
● Primary Font: 'Public Sans', sans-serif 
● Supporting Fonts: swiper-icons, sans-serif, ui-monospace, system-ui 
�
�
