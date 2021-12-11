const getUserByEmail = (email, database) => {
  for (let userID in database) {
    if (email === database[userID].email) {
      return database[userID];
    } 
  }
  return null;
};

module.exports = {getUserByEmail};
