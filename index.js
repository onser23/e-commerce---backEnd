const express = require("express");
require("./db/config");
const Product = require("./db/Product");

const Jwt = require("jsonwebtoken");
const jwtKey = "e-commerce";
const User = require("./db/User");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(cors()); // frontda cors erroru fix edir

app.post("/register", async (req, resp) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password; //register sonrasi gelen responsdan parolu silir

  Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      resp.send({ result: "Something went wrong" });
    }
    resp.send({ result, auth: token });
  });
});

app.post("/login", async (req, resp) => {
  if (req.body.email && req.body.password) {
    let user = await User.findOne(req.body).select("-password"); // login sonrasi gelen responsdan parolu silir
    if (user) {
      Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
          resp.send({ result: "Something went wrong" });
        }
        resp.send({ user, auth: token });
      });
    } else {
      resp.send({ result: "wrong username or pass" });
    }
  } else {
    resp.send({ result: "Email and Password is required" });
  }
});

app.post("/add-product", veifyToken, async (req, resp) => {
  let product = new Product(req.body);
  let result = await product.save();
  resp.send(result);
});

app.get("/products", veifyToken, async (req, resp) => {
  const products = await Product.find();
  if (products.length > 0) {
    resp.send(products);
  } else {
    resp.send({ result: "Mehsul yoxdur" });
  }
});

app.delete("/product/:id", veifyToken, async (req, resp) => {
  let result = await Product.deleteOne({ _id: req.params.id });
  resp.send(result);
});

app.get("/product/:id", veifyToken, async (req, resp) => {
  try {
    let result = await Product.findOne({ _id: req.params.id });
    console.log("ress", result);

    if (result) {
      resp.send(result);
    } else {
      resp.send({ result: "No results found" });
    }
  } catch (error) {
    console.error(error);
    resp.status(500).send({ error: "An error occurred" });
  }
});

app.put("/product/:id", veifyToken, async (req, resp) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    { $set: req.body }
  );
  resp.send(result);
});

app.get("/search/:key", veifyToken, async (req, resp) => {
  let result = await Product.find({
    $or: [
      {
        name: { $regex: req.params.key },
      },
      {
        company: { $regex: req.params.key },
      },
    ],
  });
  resp.send(result);
});

function veifyToken(req, resp, next) {
  let token = req.headers["authorization"];
  if (token) {
    token = token.split(" ")[1];
    Jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        resp.send("Token has expired");
      } else {
        next();
      }
    });
  } else {
    resp.send("Token has expiredd");
  }
}

app.listen(5000);
