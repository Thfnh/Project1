import {
  Navigate,
  useLocation,
} from "react-router-dom";


function ProtectedRoute({
  children
}) {

  const location =
    useLocation();


  let user = null;


  try {

    user = JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

  } catch {

    user = null;
  }


  if (!user) {

    const redirect =
      location.pathname
      +
      location.search;


    return (

      <Navigate

        to={
          `/login?redirect=${encodeURIComponent(
            redirect
          )}`
        }

        replace

      />

    );
  }


  return children;
}


export default ProtectedRoute;