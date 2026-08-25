import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          Codveda<span>Dev</span>
        </Link>

        <nav>
          <Link to="/">Home</Link>
          <Link to="/users">Users</Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;