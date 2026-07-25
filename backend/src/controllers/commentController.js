const pool = require("../config/db");

// GET /api/tasks/:taskId/comments
async function listComments(req, res, next) {
  try {
    const { rows } = await pool.query(
      `select c.*, u.name as user_name, u.avatar_color as user_color
         from comments c
         join users u on u.id = c.user_id
        where c.task_id = $1
        order by c.created_at asc`,
      [req.params.taskId]
    );
    res.json({ comments: rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/:taskId/comments  { content }
async function addComment(req, res, next) {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment can't be empty." });
    }

    const taskRes = await pool.query(
      "select t.*, p.id as project_id from tasks t join projects p on p.id = t.project_id where t.id = $1",
      [req.params.taskId]
    );
    const task = taskRes.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found." });

    const { rows } = await pool.query(
      `insert into comments (task_id, user_id, content) values ($1, $2, $3) returning id`,
      [req.params.taskId, req.user.id, content.trim()]
    );

    const commentRes = await pool.query(
      `select c.*, u.name as user_name, u.avatar_color as user_color
         from comments c join users u on u.id = c.user_id where c.id = $1`,
      [rows[0].id]
    );
    const comment = commentRes.rows[0];

    // Notify the assignee (if someone else commented) and task creator
    const notifyTargets = new Set(
      [task.assignee_id, task.created_by].filter((id) => id && id !== req.user.id)
    );

    for (const targetId of notifyTargets) {
      await pool.query(
        `insert into notifications (user_id, type, content, project_id, task_id)
         values ($1, 'comment_added', $2, $3, $4)`,
        [targetId, `${req.user.name} commented on "${task.title}"`, task.project_id, task.id]
      );
    }

    const io = req.app.get("io");
    io.to(`project:${task.project_id}`).emit("comment:created", { taskId: task.id, comment });
    for (const targetId of notifyTargets) {
      io.to(`user:${targetId}`).emit("notification:new", {
        type: "comment_added",
        content: `${req.user.name} commented on "${task.title}"`,
      });
    }

    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:taskId/comments/:commentId
async function deleteComment(req, res, next) {
  try {
    const { rows } = await pool.query("select * from comments where id = $1", [
      req.params.commentId,
    ]);
    const comment = rows[0];
    if (!comment) return res.status(404).json({ message: "Comment not found." });
    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own comments." });
    }

    await pool.query("delete from comments where id = $1", [req.params.commentId]);

    const taskRes = await pool.query("select project_id from tasks where id = $1", [
      req.params.taskId,
    ]);
    const io = req.app.get("io");
    io.to(`project:${taskRes.rows[0].project_id}`).emit("comment:deleted", {
      taskId: req.params.taskId,
      commentId: req.params.commentId,
    });

    res.json({ message: "Comment deleted." });
  } catch (err) {
    next(err);
  }
}

module.exports = { listComments, addComment, deleteComment };
