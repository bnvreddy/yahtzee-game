import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const [loginname, setLoginname] = useState('');
  const [displayname, setDisplayname] = useState('');
  const [password, setPassword] = useState('');
  const { register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/lobby');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(loginname, displayname, password);
      toast.success('Registration successful! Welcome bonus: 1000 coins!');
      navigate('/lobby'); // We will build this next
    } catch (error) {
      toast.error(error);
    }
  };

  return (
    <div className="auth-container">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Login Name (Private)"
          value={loginname}
          onChange={(e) => setLoginname(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Display Name (Public)"
          value={displayname}
          onChange={(e) => setDisplayname(e.target.value)}
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
          Register
        </button>
      </form>
      <p>Already have an account? <a href="/login">Login here</a></p>
    </div>
  );
};

export default RegisterPage;