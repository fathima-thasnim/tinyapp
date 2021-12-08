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
}

const urlDatabase = {
  "b2xVn2":  "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"]};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
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
  const userName = req.body.username;
  console.log(userName);
  res.cookie("username",userName);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  console.log("cookie cleared");
  res.redirect('/urls');
})


app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = { shortURL, longURL: urlDatabase[shortURL],  username: req.cookies["username"] };
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