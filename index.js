import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
const app = express();
const port = 3000;
//constructiong database
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Lazimrayan99*",
  port: 5433,
});
//connecting database
db.connect();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
let currentUserId = 1;
//declaring users
let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];
//finding visited countries
async function checkVisited() {
  const result = await db.query(
    "SELECT country_code FROM visited_countries JOIN users ON users.id = visited_countries.user_id WHERE users.id = $1;", 
    [currentUserId]
  );  
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
//getting the current user
async function getCurrentUser(){
  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  return users.find((user) => user.id == currentUserId); 
}
//getting home page
app.get("/", async (req, res) => {
  const countries = await checkVisited();
  const currentUser = await getCurrentUser();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});
//adding new country for a specific user
app.post("/add", async (req, res) => {
  const user = await getCurrentUser();
  const user_id = user.id;
  const input = req.body["country"];

  // Inside app.post("/add", async (req, res) => { ... })
try {
  const result = await db.query(
    "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
    [input.toLowerCase()]
  );

  if (result.rows.length === 0) {
    return res.status(404).send("Country not found");
  }

  const data = result.rows[0];
  const countryCode = data.country_code;

  try {
    await db.query(
      "INSERT INTO visited_countries (country_code, user_id) VALUES ($1,$2)",
      [countryCode, user_id]
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
} catch (err) {
  console.error(err);
  res.status(500).send("Internal Server Error");
}
});
//handling users tab
app.post("/user", async (req, res) => {
  if(req.body.add === "new"){
    res.render("new.ejs");
  }else{
    currentUserId = req.body.user;
    res.redirect("/");
  }
});
//handling new user adding
app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;
  const result =  await db.query(
    "INSERT INTO users(name,color) VALUES($1,$2) RETURNING *;",
    [name, color]
  );
  const id = result.rows[0].id;
  currentUserId = id;
  res.redirect("/");
});
//starting the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
