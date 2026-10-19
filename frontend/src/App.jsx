import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, Circle, ListTodo, Plus, Trash2 } from 'lucide-react';

const API = '/api';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('Connecting to backend...');
  const [busy, setBusy] = useState(false);

  async function loadTasks() {
    try {
      const response = await fetch(`${API}/tasks`);
      if (!response.ok) throw new Error('API unavailable');
      setTasks(await response.json());
      setStatus('All systems operational');
    } catch {
      setStatus('Backend unavailable — check service logs');
    }
  }

  useEffect(() => { loadTasks(); }, []);

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() })
      });
      if (!response.ok) throw new Error('Could not create task');
      setTitle('');
      await loadTasks();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(task) {
    const response = await fetch(`${API}/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed })
    });
    if (response.ok) await loadTasks();
    else setStatus('Could not update task');
  }

  async function deleteTask(id) {
    const response = await fetch(`${API}/tasks/${id}`, { method: 'DELETE' });
    if (response.ok) await loadTasks();
    else setStatus('Could not delete task');
  }

  const completed = tasks.filter(task => task.completed).length;

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="brand-icon"><ListTodo /></span>
          <span>TaskFlow <small>ENTERPRISE</small></span>
        </div>
        <span className="live"><Activity size={15} /> LIVE WORKSPACE</span>
      </header>

      <section className="hero">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Make progress.<br /><span>One task at a time.</span></h1>
        <p className="sub">A full-stack task manager powered by React, Flask, MySQL and Docker.</p>
      </section>

      <section className="stats">
        <article><span>Total tasks</span><strong>{tasks.length}</strong></article>
        <article><span>Completed</span><strong>{completed}</strong></article>
        <article><span>Remaining</span><strong>{tasks.length - completed}</strong></article>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h2>My tasks</h2><p>Plan your next move.</p></div>
          <span className="count">{tasks.length} TASKS</span></div>

        <form onSubmit={addTask} className="add-form">
          <input value={title} onChange={event => setTitle(event.target.value)}
            maxLength={200} placeholder="What needs to get done?" aria-label="Task title" />
          <button disabled={busy || !title.trim()}><Plus size={18} /> Add task</button>
        </form>

        <div className="task-list">
          {tasks.length === 0 && <div className="empty"><ListTodo size={34}/><p>No tasks yet. Add your first task above.</p></div>}
          {tasks.map(task => <div className="task" key={task.id}>
            <button className="check" onClick={() => toggleTask(task)} aria-label="Toggle completion">
              {task.completed ? <CheckCircle2 className="done-icon" /> : <Circle />}
            </button>
            <span className={task.completed ? 'task-title completed' : 'task-title'}>{task.title}</span>
            <button className="delete" onClick={() => deleteTask(task.id)} aria-label="Delete task"><Trash2 size={17}/></button>
          </div>)}
        </div>
      </section>

      <footer><span className="status-dot" /> {status}<span className="footer-right">BUILT FOR DEVOPS</span></footer>
    </main>
  );
}
