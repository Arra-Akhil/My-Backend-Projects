const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "moviesData.db");

const app = express();
app.use(express.json());

let db = null;

initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDirectorDBToResponseObjectDB = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

const convertMovieDbObjectToResponseDbObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

//GET movies API
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT movie_name FROM MOVIE;`;

  const dbResponse = await db.all(getMoviesQuery);
  response.send(
    dbResponse.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

//POST movie API
app.post("/movies/", async (request, response) => {
  const movieData = request.body;
  const { directorId, movieName, leadActor } = movieData;

  const addMovieQuery = `
    INSERT INTO movie 
    (director_id, movie_name, lead_actor)
    VALUES
    (
        ${directorId},
        '${movieName}',
        '${leadActor}'
    );`;

  const dbResponse = await db.run(addMovieQuery);
  const movieId = dbResponse.lastID;
  response.send("Movie Successfully Added");
});

//GET movie API
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT * FROM MOVIE 
    WHERE movie_id = ${movieId};`;

  const movie = await db.get(getMovieQuery);
  response.send(convertMovieDbObjectToResponseDbObject(movie));
});

//Update movie API
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const getMovieQuery = `UPDATE MOVIE 
     SET 
      director_id = ${directorId},
      movie_name = '${movieName}',
      lead_actor = '${leadActor}';`;

  await db.run(getMovieQuery);
  response.send("Movie Details Updated");
});

//delete movie API
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const movieDeleteQuery = `
    DELETE FROM MOVIE 
    WHERE movie_id = ${movieId};`;
  await db.run(movieDeleteQuery);
  response.send("Movie Removed");
});

//get directors API
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
     SELECT * FROM DIRECTOR;`;

  const directors = await db.all(getDirectorsQuery);
  response.send(
    directors.map((director) => convertDirectorDBToResponseObjectDB(director))
  );
});

//get director movies API

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMoviesQuery = `
    SELECT
      movie_name
    FROM
      movie
    WHERE
      director_id=${directorId};`;
  const moviesArray = await db.all(getDirectorMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

module.exports = app;
