import {
  useEffect,
  useState
} from "react";

import {
  Link,
  NavLink,
  useNavigate
} from "react-router-dom";

import {
  ChevronDown,
  LogOut,
  UserRound
} from "lucide-react";

import logoIcon
  from "../../assets/icons/ball.png";

import "./Navbar.css";


function Navbar() {

  const navigate =
    useNavigate();


  const [user, setUser] =
    useState(null);


  /* =========================================================
     LOAD USER
  ========================================================= */

  const loadUser = () => {

    try {

      const savedUser =
        JSON.parse(
          localStorage.getItem(
            "user"
          )
        );


      setUser(
        savedUser
      );

    } catch {

      setUser(
        null
      );
    }
  };


  useEffect(() => {

    loadUser();


    /*
      Event custom này giúp Navbar đổi ngay
      sau Login / Logout.
    */

    const handleAuthChanged = () => {

      loadUser();

    };


    window.addEventListener(
      "auth-changed",
      handleAuthChanged
    );


    return () => {

      window.removeEventListener(
        "auth-changed",
        handleAuthChanged
      );

    };

  }, []);


  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {

    localStorage.removeItem(
      "user"
    );


    localStorage.removeItem(
      "bookingDraft"
    );


    setUser(
      null
    );


    window.dispatchEvent(
      new Event(
        "auth-changed"
      )
    );


    navigate(
      "/"
    );
  };


  /* =========================================================
     USER DISPLAY NAME
  ========================================================= */

  const displayName =
    user?.FullName
    ||
    user?.Username
    ||
    user?.Email
    ||
    "Tài khoản";


  return (

    <header
      className="navbar"
    >

      <div
        className="navbar-container"
      >

        {/* LOGO */}

        <Link

          to="/"

          className="navbar-brand"

        >

          <img

            src={
              logoIcon
            }

            alt="Logo Sân Bóng Xuân Son"

            className="navbar-logo-image"

          />


          <span>

            Sân Bóng Xuân Son

          </span>

        </Link>


        {/* MENU */}

        <nav
          className="navbar-menu"
        >

          <NavLink

            to="/"

            className={
              ({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
            }

          >

            Trang chủ

          </NavLink>


          <NavLink

            to="/fields"

            className={
              ({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
            }

          >

            Danh sách sân

          </NavLink>


          <NavLink

            to={
              user
                ? "/account"
                : "/login?redirect=%2Faccount"
            }

            className={
              ({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
            }

          >

            Lịch đặt

          </NavLink>


          <NavLink

            to="/pricing"

            className={
              ({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
            }

          >

            Bảng giá

          </NavLink>


          <NavLink

            to="/about"

            className={
              ({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
            }

          >

            Giới thiệu

          </NavLink>


          <a
            href="#contact"
            className="navbar-link"
          >

            Liên hệ

          </a>

        </nav>


        {/* AUTH */}

        {
          user
            ? (

              <div
                className="navbar-user-area"
              >

                <Link

                  to="/account"

                  className="navbar-user-button"

                >

                  <div
                    className="navbar-user-avatar"
                  >

                    <UserRound
                      size={18}
                    />

                  </div>


                  <span>

                    {
                      displayName
                    }

                  </span>


                  <ChevronDown
                    size={15}
                  />

                </Link>


                <button

                  type="button"

                  className="navbar-logout-button"

                  onClick={
                    handleLogout
                  }

                >

                  <LogOut
                    size={17}
                  />

                  Đăng xuất

                </button>

              </div>

            )
            : (

              <div
                className="navbar-auth"
              >

                <Link

                  to="/login"

                  className="login-link"

                >

                  Đăng nhập

                </Link>


                <Link

                  to="/register"

                  className="register-btn"

                >

                  Đăng ký

                </Link>

              </div>

            )
        }

      </div>

    </header>

  );
}


export default Navbar;