const express = require("express");
const app = express();
const PORT = 8080; //default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs');
const { getUserByEmail, isUrlOwner } = require('./helpers');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['apple', 'orange']
}));

////////////////////////////////////////////////////////////////////////////
// to generate a random alphanumeric character
const generateRandomString = function() {
  return Math.random().toString(36).substring(2,8);
};

// to filter URL by userID
const urlsForUser = function(id, urlDatabase) {
  let urls = {};
  for (let shortURL in urlDatabase) {
    if (id === urlDatabase[shortURL].userID) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
};
//////////////////////////////////////////////////////////////////////////////
// const urlDatabase = {
//   "b2xVn2":  "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password:  bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};
const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
  }
};

///////////////////////////////////ROUTES/////////////////////////////////////////

//HOME
app.get("/", (req, res) => {
  res.redirect('/urls');
});


//LIST OF URLS
app.get("/urls", (req, res) => {
  //const templateVars = { urls: urlDatabase, username: req.cookies["username"]};
  const userID = req.session.user_id
  if(!userID) {
    res.redirect("/login");
  } else {
  const templateVars = { urls: urlsForUser(userID, urlDatabase), user: users[userID] }
  res.render("urls_index", templateVars);
  }
});


//CREATE NEW URL
app.get("/urls/new", (req, res) => {
  // console.log('Cookies: ', req.cookies);
  // console.log("cookiebody:",req.body)
  // res.cookie("username",req.cookies.username);
  // const templateVars = { username: req.cookies["username"]};
  const userID = req.session.user_id
  const templateVars = { user: users[userID] };
  if(!users[userID]) {
    res.redirect("/register")
  } else {
  res.render("urls_new",templateVars);
  }
});

//PROCESS NEW URL
app.post("/urls", (req, res) => {
  console.log(req.body.longURL); 
  const userID = req.session.user_id; 
 if(!userID){
    res.status(404).send("error");
    
  } else {
  console.log(urlDatabase);
  const generateShortUrl = generateRandomString();
  urlDatabase[generateShortUrl] = {longURL:req.body.longURL, userID};
  console.log("urldatabase",urlDatabase);
  res.redirect(`/urls/${generateShortUrl}`);
  }
});


//REDIRECT SHORTURL TO LONGURL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]){
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404);
    res.send("404 - Not found");
  }
});


//DELETE URL
app.post('/urls/:shortURL/delete', (req,res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!userID) {
    return res.send("not found")
  }
  if (userID !== urlDatabase[shortURL].userID) {
    return res.send("user is not allowed to delete");
  } 
  delete urlDatabase[shortURL];
  return res.redirect('/urls');
});


//EDIT URL
app.post('/urls/:shortURL/edit', (req,res) => {
  const longURL = req.body.editedLongURL;
  const user_ID = req.session.user_id;
  const shortURL = req.params.shortURL;
  console.log("userID",user_ID);
  console.log("another",urlDatabase[shortURL].userID);
  // console.log("shorturl",shortURL);
  // console.log("urldatabase",urlDatabase);
  if (!user_ID) {
    return res.send("not found")
  }
  if (user_ID !== (urlDatabase[shortURL].userID)) {
    
    return res.send("user is not allowed to edit");
  } 
  urlDatabase[req.params.shortURL].longURL = longURL;
  res.redirect('/urls');
});


//PROCESS LOGIN
app.post('/login', (req,res) => {
  // const userName = req.body.username;
  // console.log(userName);
  const {email, password} = req.body;
  // const email = req.body.email;
  // const password = req.body.password;
  const user = getUserByEmail(email,users)
  // const user = (email, password);
  if (!user) {
    return res.status(403).send("User not found")
  }
  
  if (!bcrypt.compareSync(password, user.password)) {
    // console.log(password, user[password]);
    return res.status(403).send("Invalid password");
  }
  req.session.user_id = user.id;
  res.redirect('/urls');
});


//PROCESS LOGOUT
app.post('/logout', (req, res) => {
  req.session.user_id = null
  // console.log("cookie cleared");
  res.redirect('/urls');
});


//REGISTER
app.get('/register', (req, res) => {
  const templateVars = {user: users[req.session.user_id]};
  res.render("register",templateVars);
});


//PROCESS REGISTER
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // const {email, password} = req.body;
  if (email === "" || password === "") {
    return res.status(400).send("Enter email and password");
  }
  if (getUserByEmail(email)) {
    return res.status(400).send("Email already exists");
  }
  const userRandomID = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = { id: userRandomID, email: email, password: hashedPassword }
  users[userRandomID] = newUser;
  req.session.user_id = users[userRandomID].id;
  console.log({newUser});
  console.log(req.session.user_id)
  // console.log("users",users)
  res.redirect('/urls');
});


//LOGIN FORM
app.get('/login', (req,res) => {
  const userID = req.session.user_id;
  if(userID){
    res.redirect('/urls');
  } else {
    const templateVars = {user: users[req.session.user_id]};
  res.render("login", templateVars );
   }
});


//DISPLAY URL
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const currUserID = req.session.user_id

  // const templateVars = { shortURL, longURL,  username: req.cookies["username"] };
  if(!isUrlOwner(urlDatabase, shortURL, currUserID)) res.status(401).send('Not the resource owner')
  
  const templateVars = { shortURL, longURL, user: users[req.session["user_id"]] };
  res.render("urls_show", templateVars);
});


//DASHBOARD
app.get("/urls.json", (req,res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});



//SERVER CONNECTING
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});