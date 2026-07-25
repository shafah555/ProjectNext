const pool = require("../config/db");

// GET /api/projects - all projects the current user belongs to
async function listProjects(req, res, next) {
  try {
    const { rows } = await pool.query(
      `select p.*, pm.role,
              (select count(*) from project_members where project_id = p.id) as member_count,
              (select count(*) from tasks where project_id = p.id) as task_count,
              (select count(*) from tasks where project_id = p.id and status = 'done') as done_count
         from projects p
         join project_members pm on pm.project_id = p.id
        where pm.user_id = $1
        order by p.updated_at desc`,
      [req.user.id]
    );
    res.json({ projects: rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/projects
async function createProject(req, res, next) {
  const client = await pool.connect();
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Project name is required." });
    }

    await client.query("BEGIN");

    const { rows } = await client.query(
      `insert into projects (name, description, owner_id)
       values ($1, $2, $3) returning *`,
      [name.trim(), description || "", req.user.id]
    );
    const project = rows[0];

    await client.query(
      `insert into project_members (project_id, user_id, role) values ($1, $2, 'owner')`,
      [project.id, req.user.id]
    );

    await client.query("COMMIT");
    res.status(201).json({ project: { ...project, role: "owner", member_count: 1, task_count: 0, done_count: 0 } });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

// GET /api/projects/:id - full detail incl. members and tasks
async function getProject(req, res, next) {
  try {
    const projectId = req.params.id;

    const projectRes = await pool.query("select * from projects where id = $1", [projectId]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ message: "Project not found." });
    }

    const membersRes = await pool.query(
      `select u.id, u.name, u.email, u.avatar_color, pm.role
         from project_members pm
         join users u on u.id = pm.user_id
        where pm.project_id = $1
        order by pm.joined_at asc`,
      [projectId]
    );

    const tasksRes = await pool.query(
      `select t.*, u.name as assignee_name, u.avatar_color as assignee_color
         from tasks t
         left join users u on u.id = t.assignee_id
        where t.project_id = $1
        order by t.position asc, t.created_at asc`,
      [projectId]
    );

    res.json({
      project: projectRes.rows[0],
      members: membersRes.rows,
      tasks: tasksRes.rows,
      role: req.membership.role,
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/projects/:id
async function updateProject(req, res, next) {
  try {
    if (!["owner", "admin"].includes(req.membership.role)) {
      return res.status(403).json({ message: "Only the owner or admins can edit the project." });
    }
    const { name, description } = req.body;
    const { rows } = await pool.query(
      `update projects set name = coalesce($1, name), description = coalesce($2, description)
       where id = $3 returning *`,
      [name, description, req.params.id]
    );
    res.json({ project: rows[0] });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/projects/:id
async function deleteProject(req, res, next) {
  try {
    if (req.membership.role !== "owner") {
      return res.status(403).json({ message: "Only the owner can delete this project." });
    }
    await pool.query("delete from projects where id = $1", [req.params.id]);
    res.json({ message: "Project deleted." });
  } catch (err) {
    next(err);
  }
}

// POST /api/projects/:id/members  { email, role }
async function addMember(req, res, next) {
  try {
    if (!["owner", "admin"].includes(req.membership.role)) {
      return res.status(403).json({ message: "Only the owner or admins can invite members." });
    }
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const userRes = await pool.query("select id, name, email, avatar_color from users where email = $1", [
      email.toLowerCase().trim(),
    ]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "No user found with that email. Ask them to sign up first." });
    }
    const invitedUser = userRes.rows[0];

    const existing = await pool.query(
      "select 1 from project_members where project_id = $1 and user_id = $2",
      [req.params.id, invitedUser.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "That person is already a member of this project." });
    }

    await pool.query(
      `insert into project_members (project_id, user_id, role) values ($1, $2, $3)`,
      [req.params.id, invitedUser.id, role === "admin" ? "admin" : "member"]
    );

    const projectRes = await pool.query("select name from projects where id = $1", [req.params.id]);

    await pool.query(
      `insert into notifications (user_id, type, content, project_id)
       values ($1, 'project_invite', $2, $3)`,
      [invitedUser.id, `${req.user.name} added you to project "${projectRes.rows[0].name}"`, req.params.id]
    );

    res.status(201).json({ member: { ...invitedUser, role: role === "admin" ? "admin" : "member" } });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/projects/:id/members/:userId
async function removeMember(req, res, next) {
  try {
    const targetUserId = req.params.userId;
    const isSelf = targetUserId === req.user.id;
    const canManage = ["owner", "admin"].includes(req.membership.role);

    if (!isSelf && !canManage) {
      return res.status(403).json({ message: "Only the owner or admins can remove members." });
    }

    const targetRoleRes = await pool.query(
      "select role from project_members where project_id = $1 and user_id = $2",
      [req.params.id, targetUserId]
    );
    if (targetRoleRes.rows[0]?.role === "owner") {
      return res.status(400).json({ message: "The project owner can't be removed." });
    }

    await pool.query("delete from project_members where project_id = $1 and user_id = $2", [
      req.params.id,
      targetUserId,
    ]);
    res.json({ message: "Member removed." });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
