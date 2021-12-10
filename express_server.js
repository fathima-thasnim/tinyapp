const express = require("express");
const app = express();
const PORT = 8080; //default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
const saltRounds = 10;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

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
  
//to check the email
const emailLookup = (email) => {
  console.log(email)
  for (let userID in users) {
    if (email === users[userID].email) {
      return users[userID];
    } 
  }
  return null;
};

// //authenticate the user
// const authenticateUser = (email, password, users) => {
//   // retrieve the user with that email
//   const user = emailLookup(email, users);
//   // if we got a user back and the passwords match then return the userObj
//   if (bcrypt.compareSync(password, user.password)) {
//     // user is authenticated
//     return user;
//   } else {
//     // Otherwise return false
//     return false;
//   }
// };


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


app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  //const templateVars = { urls: urlDatabase, username: req.cookies["username"]};
  const userID = req.cookies["user_id"]
  if(!req.cookies["user_id"]) {
    res.redirect("/login");
  } else {
  const templateVars = { urls: urlsForUser(userID, urlDatabase), user: users[req.cookies["user_id"]] }
  res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  // console.log('Cookies: ', req.cookies);
  // console.log("cookiebody:",req.body)
  // res.cookie("username",req.cookies.username);
  // const templateVars = { username: req.cookies["username"]};

  const templateVars = { user: users[req.cookies["user_id"]] };
  if(!users[req.cookies["user_id"]]) {
    res.redirect("/register")
  } else {
  res.render("urls_new",templateVars);
  }
});

app.post("/urls", (req, res) => {
  console.log(req.body.longURL);  
 if(!req.cookies["user_id"]){
    res.status(404).send("error");
    
  } else {
  console.log(urlDatabase);
  const generateShortUrl = generateRandomString();
  urlDatabase[generateShortUrl] = {longURL:req.body.longURL, userID: req.cookies["user_id"]};
  res.redirect(`/urls/${generateShortUrl}`);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]){
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404);
    res.send("404 - Not found");
  }
});

app.post('/urls/:shortURL/delete', (req,res) => {
  const userID = req.cookies["user_id"];
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

app.post('/urls/:shortURL/edit', (req,res) => {
  const longURL = req.body.editedLongURL;
  const userID = req.cookies["user_id"];
  const shortURL = req.params.shortURL;
  if (!userID) {
    return res.send("not found")
  }
  if (userID !== urlDatabase[shortURL].userID) {
    return res.send("user is not allowed to delete");
  } 
  urlDatabase[req.params.shortURL].longURL = longURL;
  res.redirect('/urls');
});

app.post('/login', (req,res) => {
  // const userName = req.body.username;
  // console.log(userName);
  const email = req.body.email;
  const password = req.body.password;
  const user = emailLookup(email)
  // const user = (email, password);
  if (!user) {
    return res.status(403).send("User not found")
  }
  console.log("/login", user);

  if (!bcrypt.compareSync(password, user["password"])) {
    return res.status(403).send("Invalid password");
  }
  res.cookie("user_id", user.id);
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
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = { id: userRandomID, email: email, password: hashedPassword }
  users[userRandomID] = newUser;
  res.cookie('user_id',userRandomID);
  res.redirect('/urls');
  console.log("register", users);
});

app.get('/login', (req,res) => {
  const userID = req.cookies["user_id"];
  if(userID){
    res.redirect('/urls');
  } else {
    const templateVars = {user: users[req.cookies["user_id"]]};
  res.render("login", templateVars );
   }
  
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
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