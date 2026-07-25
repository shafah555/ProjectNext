const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { signToken } = require("../utils/jwt");

const AVATAR_COLORS = ["#3A6B72", "#E4572E", "#D4A94F", "#5B6C8F", "#8A5A44", "#4C7A5A"];

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, avatarColor: u.avatar_color };
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existing = await pool.query("select id from users where email = $1", [
      email.toLowerCase(),
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "An account with that email already exists." });
    }

    const hash = await bcrypt.hash(password, 10);
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const { rows } = await pool.query(
      `insert into users (name, email, password_hash, avatar_color)
       values ($1, $2, $3, $4)
       returning id, name, email, avatar_color`,
      [name.trim(), email.toLowerCase().trim(), hash, color]
    );

    const user = rows[0];
    const token = signToken({ id: user.id });

    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const { rows } = await pool.query("select * from users where email = $1", [
      email.toLowerCase().trim(),
    ]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const token = signToken({ id: user.id });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, me };
