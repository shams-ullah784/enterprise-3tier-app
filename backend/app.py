import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "mysql"),
        user=os.getenv("MYSQL_USER", "appuser"),
        password=os.environ["MYSQL_PASSWORD"],
        database=os.getenv("MYSQL_DATABASE", "enterprise_app")
    )

@app.get("/api/health")
def health():
    try:
        conn = get_db()
        conn.ping(reconnect=True, attempts=1, delay=0)
        conn.close()
        return jsonify(status="healthy", database="connected"), 200
    except Exception:
        return jsonify(status="unhealthy", database="disconnected"), 503

@app.get("/api/tasks")
def list_tasks():
    conn = get_db()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id, title, completed FROM tasks ORDER BY id DESC")
        return jsonify(cur.fetchall())
    finally:
        conn.close()

@app.post("/api/tasks")
def create_task():
    data = request.get_json(silent=True) or {}
    title = data.get("title", "").strip()
    if not title or len(title) > 200:
        return jsonify(error="Title must contain 1-200 characters"), 400

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO tasks (title) VALUES (%s)", (title,))
        conn.commit()
        return jsonify(id=cur.lastrowid, title=title, completed=False), 201
    finally:
        conn.close()

@app.patch("/api/tasks/<int:task_id>")
def update_task(task_id):
    data = request.get_json(silent=True) or {}
    if not isinstance(data.get("completed"), bool):
        return jsonify(error="completed must be true or false"), 400

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE tasks SET completed=%s WHERE id=%s",
                    (data["completed"], task_id))
        conn.commit()
        if cur.rowcount == 0:
            cur.execute("SELECT id FROM tasks WHERE id=%s", (task_id,))
            if not cur.fetchone():
                return jsonify(error="Task not found"), 404
        return jsonify(message="Task updated")
    finally:
        conn.close()

@app.delete("/api/tasks/<int:task_id>")
def delete_task(task_id):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM tasks WHERE id=%s", (task_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify(error="Task not found"), 404
        return jsonify(message="Task deleted")
    finally:
        conn.close()
