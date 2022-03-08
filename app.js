const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3005, () => {
      console.log("Server running successfully at http://localhost:3005/");
    });
  } catch (error) {
    console.log(`DB Error at ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.get("/players/", async (request, response) => {
  const getQuery = `select * from player_details;`;
  const dbResponse = await db.all(getQuery);
  //   response.send(dbResponse);
  response.send(
    dbResponse.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});
//get one player

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `select * from player_details where 
  player_id = ${playerId};`;
  const dbResponse = await db.get(getQuery);
  const lastID = dbResponse.lastID;
  //   response.send(dbResponse);
  response.send(convertPlayerDbObjectToResponseObject(dbResponse));
});

//update

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const getQuery = `update 
  player_details
   set
   player_name = '${playerName}' 
  where 
  player_id = ${playerId};`;
  const dbResponse = await db.run(getQuery);
  const lastID = dbResponse.lastID;
  response.send("Player Details Updated");
});

//get match details

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `select * from match_details where 
  match_id = ${matchId};`;
  const dbResponse = await db.get(getQuery);
  const lastID = dbResponse.lastID;
  //   response.send(dbResponse);
  response.send(convertMatchDetailsDbObjectToResponseObject(dbResponse));
});

//all match details from particular player

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `select * from player_match_score
   natural join 
  match_details
   where player_id = ${playerId};`;
  const dbResponse = await db.all(getQuery);
  response.send(
    dbResponse.map((eachMatch) =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch)
    )
  );
  //   response.send(dbResponse);
});

//all player details from specific match

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `select * from player_match_score natural join player_details
   where match_id = ${matchId};`;
  const dbResponse = await db.all(getQuery);
  //   const lastID = dbResponse.lastID;
  //   response.send(dbResponse);
  response.send(
    dbResponse.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//all player details from specific match

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `select player_id as playerId,
  player_name as playerName,
  sum(score) as totalScore,
  sum(fours) as totalFours,
  sum(sixes) as totalSixes
  from player_match_score natural join player_details
   where player_id = ${playerId} ;`;
  const dbResponse = await db.get(getQuery);
  response.send(dbResponse);
});
module.exports = app;
