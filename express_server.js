const express = require("express");
const app = express();
const PORT = 8080; //default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


// to generate a random alphanumeric character
const generateRandomString = function() {
  return Math.random().toString(36).substring(2,8);
};

const emailLookup = (email) => {
  console.log(email)
  for (let user in users) {
    if (email === users[user].email) {
      return user;
    } 
  }
  return null;
} 


const urlDatabase = {
  "b2xVn2":  "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  //const templateVars = { urls: urlDatabase, username: req.cookies["username"]};
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  // console.log('Cookies: ', req.cookies);
  // console.log("cookiebody:",req.body)
  // res.cookie("username",req.cookies.username);
  // const templateVars = { username: req.cookies["username"]};
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new",templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body.longURL);  
  const generateShortUrl = generateRandomString();
  urlDatabase[generateShortUrl] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${generateShortUrl}`)
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]){
    const longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
  } 
});

app.post('/urls/:shortURL/delete', (req,res) => {
  if (urlDatabase[req.params.shortURL]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

app.post('/urls/:shortURL/edit', (req,res) => {
  const longURL = req.body.editedLongURL;
  urlDatabase[req.params.shortURL] = longURL;
  res.redirect('/urls');
});

app.post('/login', (req,res) => {
  // const userName = req.body.username;
  // console.log(userName);
  const email = req.body.email;
  const password = req.body.password;
  const user = emailLookup(email);
  if (!user) {
    return res.status(403).send("User not found")
  }
  if (user.password !== password) {
    return res.status(403).send("Invalid password");
  }
  res.cookie("user_id", user);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  console.log("cookie cleared");
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const templateVars = {user: users[req.cookies["user_id"]]};
  res.render("register",templateVars);
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // const {email, password} = req.body;
  if (email === "" || password === "") {
    return res.status(400).send("Enter email and password");
  }
  if (emailLookup(email)) {
    return res.status(400).send("Email already exists");
  }
  const userRandomID = generateRandomString();
  const newUser = { id: userRandomID, email, password }
  users[userRandomID] = newUser;
  res.cookie('user_id',userRandomID);
  res.redirect('/urls');
  console.log("register", users);
});

app.get('/login', (req,res) => {
  const templateVars = {user: users[req.cookies["user_id"]]};
  res.render("login", templateVars );
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  // const templateVars = { shortURL, longURL,  username: req.cookies["username"] };
  const templateVars = { shortURL, longURL, user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req,res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});