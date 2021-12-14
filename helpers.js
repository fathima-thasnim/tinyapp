const getUserByEmail = (email, database) => {
  for (let userID in database) {
    if (email === database[userID].email) {
      return database[userID];
    } 
  }
  return null;
};

const isUrlOwner = (urlDatabase, shortURL, currUserID) => {
  return urlDatabase[shortURL].userID === currUserID
}

module.exports = {getUserByEmail, isUrlOwner};
