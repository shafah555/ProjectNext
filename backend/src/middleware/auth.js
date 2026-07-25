const { verifyToken } = require("../utils/jwt");
const pool = require("../config/db");

// Verifies the JWT and attaches { id, name, email } to req.user
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated. Please log in." });
    }

    const decoded = verifyToken(token);

    const { rows } = await pool.query(
      "select id, name, email, avatar_color from users where id = $1",
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Account no longer exists." });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session expired or invalid. Please log in again." });
  }
}

// Confirms req.user is a member of req.params.projectId (or body.projectId)
// and attaches req.membership = { role }
async function requireProjectMember(req, res, next) {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.projectId;
    const { rows } = await pool.query(
      "select role from project_members where project_id = $1 and user_id = $2",
      [projectId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: "You are not a member of this project." });
    }

    req.membership = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, requireProjectMember };
