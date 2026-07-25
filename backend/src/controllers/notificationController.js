const pool = require("../config/db");

// GET /api/notifications
async function listNotifications(req, res, next) {
  try {
    const { rows } = await pool.query(
      `select * from notifications where user_id = $1 order by created_at desc limit 50`,
      [req.user.id]
    );
    res.json({ notifications: rows });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/:id/read
async function markRead(req, res, next) {
  try {
    await pool.query(
      "update notifications set is_read = true where id = $1 and user_id = $2",
      [req.params.id, req.user.id]
    );
    res.json({ message: "Marked as read." });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/read-all
async function markAllRead(req, res, next) {
  try {
    await pool.query("update notifications set is_read = true where user_id = $1", [req.user.id]);
    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, markRead, markAllRead };
