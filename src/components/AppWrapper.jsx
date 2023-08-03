import { auth } from "./firebaseConfig/firebase.js";
import { signOut } from "firebase/auth";
import PropTypes from 'prop-types';
import Cookies from "universal-cookie";
import '../../styles/index.css'

const cookies = new Cookies();

export const AppWrapper = ({ children, isAuth, setIsAuth, setIsInChat }) => {
  const signUserOut = async () => {
    await signOut(auth);
    cookies.remove("auth-token");
    setIsAuth(false);
    setIsInChat(false);
  };

  return (
    <div className="App">
      <div className="app-header">
        <h1> Welcome To Chat App - By Federico Aguirre </h1>
        {isAuth && (
          <div className="sign-out">
            <button onClick={signUserOut}> Sign Out</button>
          </div>
        )}
      </div>

      <div className="app-container">{children}</div>
    </div>
  );
};

AppWrapper.propTypes = {
  children: PropTypes.any,
  isAuth: PropTypes.any,
  setIsAuth: PropTypes.any,
  setIsInChat: PropTypes.any
};
