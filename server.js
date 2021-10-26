const express = require("express");
const app = express();
const port = process.env.PORT || 5678;
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
require("dotenv").config();

const BANK_URL = "https://85ad-52-249-186-92.ngrok.io";

const db = {
  init: () => {
    try {
      fs.readFileSync(path.join(__dirname, "db.json"));
    } catch (e) {
      fs.writeFileSync(path.join(__dirname, "db.json"), "{}");
    }
  },
  add: (type, record) => {
    const data = db._readFile();

    if (!db.getTypeMapping(type)) {
      console.log("Invalid record type.");
      return;
    }

    data[db.getTypeMapping(type)].push(record);
    fs.writeFileSync(path.join(__dirname, "db.json"), JSON.stringify(data));
    return record;
  },
  get: (type, key, value) => {
    const data = db._readFile();

    if (!db.getTypeMapping(type)) {
      console.log("Invalid record type.");
      return;
    }
    return data[db.getTypeMapping(type)].filter((record) =>
      record[key] === value
    )[0];
  },
  /**
   * This requires updating sending in the entire (new) record
   */
  update: (type, key, value, record) => {
    const data = db._readFile();

    if (!db.getTypeMapping(type)) {
      console.log("Invalid record type.");
      return;
    }
    const index = data[db.getTypeMapping(type)].findIndex((record) =>
      record[key] === value
    );
    data[index] = record;

    fs.writeFileSync(path.join(__dirname, "db.json"), JSON.stringify(data));
    return record;
  },
  _readFile: () => {
    const file = fs.readFileSync(path.join(__dirname, "db.json"));
    const data = JSON.parse(file);
    return data;
  },
  getTypeMapping: (type) => {
    const mappings = {
      user: "users",
      org: "orgs",
    };
    return mappings[type];
  },
};

async function updateOrgHcbStatus(id) {
  const org = db.get("org", "id", id);

  const connectionRequest = await fetch(
    `${BANK_URL}/api/v1/organizations/${org.id}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.HCB_API_KEY}`,
      },
    },
  );

  const connectionData = await connectionRequest.json();
  const { status } = connectionData.data[0];
  console.log("lkajhwkjhlaejhkweahjkwjhklw", connectionData.data[0]);
  console.log(status);

  org.status = status;
  
  db.update("org", "id", id, org);
  return org;
}

db.init();

// app.get("", (req, res) => {
//   res.send("BUY NOW!");
// });

/**
 * Login to app (returns the user object)
 */
app.post("/login", (req, res) => {
  const email = req.params.email;
  const user = db.get("user", "email", email);
  if (user) {
    return res.json(user);
  } else {
    return res.status(404).json({
      error: "User not found",
    });
  }
});

app.get("/org/:id", async (req, res) => {
  const id = req.params.id;
  const org = db.get("org", "id", id);

  await updateOrgHcbStatus(id);

  if (org) {
    return res.json(org);
  } else {
    return res.status(404).json({
      error: "Org not found",
    });
  }
});

app.get("/org", async (req, res) => {
  const owner = req.query.owner;
  console.log({ params: req.query });
  const org = db.get("org", "owner", owner);

  await updateOrgHcbStatus(org.id);

  if (org) {
    return res.json(org);
  } else {
    return res.status(404).json({
      error: "Org associated with given owner not found",
    });
  }
});

app.get("/signup-for-bank", async (req, res) => {
  const id = req.query.org;
  console.log("Signing org up for bank:", id);
  const connectionRequest = await fetch(
    `${BANK_URL}/api/v1/connect/start`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HCB_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationIdentifier: id,
        redirectUrl: `localhost:${port}/home`,
        webhookUrl: "https://d096b7674df0.ngrok.io/hcb-webhook",
      }),
    },
  );

  console.log(connectionRequest);

  const connectionData = await connectionRequest.json();
  const connectUrl = connectionData.data[0].connectUrl;
  console.log(connectUrl);
  // const connectUrl = connectionData.connectUrl;

  if (connectUrl) {
    res.redirect(connectUrl);

    const org = db.get("org", id, id);
    org.hcbRegisterURL = connectUrl;
    db.update("org", "id", id, org);
  } else {
    res.send("An error error occured");
  }
});

app.all("hcb-webhook", (req, res) => {
  const { organizationIdentifier, status } = req.body;
  const org = db.get("org", "id", organizationIdentifier);
  db.update("org", "id", organizationIdentifier, { ...org, status });
  res.send("ok");
});

/**
 * Create user
 */
// app.post("users", (req, res) => {
//   const email = req.params.email;
//   const user = db.add("user", {
//     email,
//   });
//   return res.send(`Welcome ${user.email}`);
// });

app.use(express.static("public"));

app.listen(port, () => {
  console.log("CHECK OUT PORT", port, "FOR MORE GREAT DEALS!!!1!");
});
