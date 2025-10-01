import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API_CONFIG from '../config/api';

const TodoList = () => {
  const { user, token } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTodo, setNewTodo] = useState({ title: '', description: '', priority: 'medium' });
  const [error, setError] = useState('');

  // Fetch todos from Node.js backend
  const fetchTodos = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_CONFIG.getApiUrl('/todos'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTodos(data.todos || []);
      } else {
        setError('Failed to fetch todos');
      }
    } catch (err) {
      setError('Error connecting to backend');
      console.error('Fetch todos error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new todo
  const createTodo = async (e) => {
    e.preventDefault();
    if (!token || !newTodo.title.trim()) return;

    try {
      const response = await fetch(API_CONFIG.getApiUrl('/todos'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTodo)
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(prev => [data, ...prev]);
        setNewTodo({ title: '', description: '', priority: 'medium' });
        setError('');
      } else {
        setError('Failed to create todo');
      }
    } catch (err) {
      setError('Error creating todo');
      console.error('Create todo error:', err);
    }
  };

  // Toggle todo completion
  const toggleTodo = async (todoId) => {
    if (!token) return;

    try {
      const response = await fetch(API_CONFIG.getApiUrl(`/todos/${todoId}/toggle`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(prev => prev.map(todo => 
          todo._id === todoId ? updatedTodo : todo
        ));
      } else {
        setError('Failed to update todo');
      }
    } catch (err) {
      setError('Error updating todo');
      console.error('Toggle todo error:', err);
    }
  };

  // Delete todo
  const deleteTodo = async (todoId) => {
    if (!token) return;

    try {
      const response = await fetch(API_CONFIG.getApiUrl(`/todos/${todoId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setTodos(prev => prev.filter(todo => todo._id !== todoId));
      } else {
        setError('Failed to delete todo');
      }
    } catch (err) {
      setError('Error deleting todo');
      console.error('Delete todo error:', err);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [token]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Todo List</h2>
          <p className="text-gray-600">Please log in to view your todos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Todo List</h2>
        <p className="text-gray-600">Welcome back, {user.username}!</p>
        <p className="text-sm text-gray-500">Backend: {API_CONFIG.BACKEND.toUpperCase()} ({API_CONFIG.getCurrentBackendUrl()})</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Add new todo form */}
      <form onSubmit={createTodo} className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Add New Todo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Todo title..."
            value={newTodo.title}
            onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Description (optional)..."
            value={newTodo.description}
            onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newTodo.priority}
            onChange={(e) => setNewTodo(prev => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Add Todo
        </button>
      </form>

      {/* Todos list */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Your Todos ({todos.length})</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading todos...</p>
          </div>
        ) : todos.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No todos yet. Create your first todo above!
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {todos.map((todo) => (
              <div key={todo._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo._id)}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <h4 className={`text-lg font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {todo.title}
                        </h4>
                        {todo.description && (
                          <p className={`text-sm ${todo.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                            {todo.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            todo.priority === 'high' ? 'bg-red-100 text-red-800' :
                            todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {todo.priority} priority
                          </span>
                          <span>Created: {new Date(todo.createdAt).toLocaleDateString()}</span>
                          {todo.completed && (
                            <span>Completed: {new Date(todo.completedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo._id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Delete todo"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
