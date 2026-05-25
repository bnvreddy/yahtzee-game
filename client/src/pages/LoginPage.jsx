import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const [loginname, setLoginname] = useState('');
  const [password, setPassword] = useState('');
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/lobby');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(loginname, password);
      toast.success('Welcome back!');
      navigate('/lobby');
    } catch (error) {
      toast.error(error);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Login Name"
          value={loginname}
          onChange={(e) => setLoginname(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary">
          Login
        </button>
      </form>
      <p>Don't have an account? <a href="/register">Register here</a></p>
    </div>
  );
};

export default LoginPage;